import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
  type MenuItemConstructorOptions,
} from "electron";
import * as bitcoin from "bitcoinjs-lib";
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from "../core/seed.js";
import { createWalletSeed, initVault, loadVault, saveVault, type VaultInner } from "../core/vault.js";
import { deriveAddress, getXpub, type AddressType } from "../core/derive.js";
import { signMessageWithSeed, signPsbt } from "../core/sign.js";
import { DashboardConnection } from "../core/connect.js";
import type { NetworkId } from "../core/network.js";
import { clearMnemonicTemp, defaultSettings, session, wipeSeed, type WalletSettings } from "./state.js";
import { createMainWindow, setContentProtection } from "./window.js";
import { getBitcoinNetwork } from "../core/network.js";

const __mainDir = path.dirname(fileURLToPath(import.meta.url));
/** dist/main → repo apps/wallet/assets/tray-icon.png */
const TRAY_ICON_PATH = path.join(__mainDir, "..", "..", "assets", "tray-icon.png");

const TRAY_ICON = (() => {
  if (existsSync(TRAY_ICON_PATH)) {
    return nativeImage.createFromPath(TRAY_ICON_PATH);
  }
  return nativeImage.createFromBuffer(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    ),
  );
})();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function toWsUrl(input: string) {
  const trimmed = input.trim().replace(/\/$/, "");
  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
    return trimmed.endsWith("/ws") ? trimmed : `${trimmed}/ws`;
  }
  const href = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  const u = new URL(href);
  const proto = u.protocol === "https:" ? "wss:" : "ws:";
  const base = `${proto}//${u.host}${u.pathname.replace(/\/$/, "")}`;
  return `${base}/ws`;
}

function walletDir() {
  return path.join(app.getPath("userData"), "bpvp-wallet");
}

function vaultFilePath() {
  return path.join(walletDir(), "vault.json");
}

function settingsPath() {
  return path.join(walletDir(), "settings.json");
}

async function loadSettingsFile() {
  try {
    const raw = await readFile(settingsPath(), "utf8");
    const s = JSON.parse(raw) as Partial<WalletSettings>;
    session.settings = { ...defaultSettings, ...s };
  } catch {
    session.settings = { ...defaultSettings };
  }
}

async function persistSettings() {
  await mkdir(walletDir(), { recursive: true });
  await writeFile(settingsPath(), JSON.stringify(session.settings, null, 2), { mode: 0o600 });
}

function scheduleAutoLock() {
  if (session.lockTimer) {
    clearTimeout(session.lockTimer);
    session.lockTimer = null;
  }
  const ms = session.settings.autoLockMs;
  if (!ms || ms <= 0 || !session.seed) return;
  session.lockTimer = setTimeout(() => {
    wipeSeed();
    mainWindow?.webContents.send("wallet:locked");
  }, ms);
}

function touchActivity() {
  scheduleAutoLock();
}

async function ensureSeed() {
  if (!session.seed) {
    throw new Error("wallet locked");
  }
  return session.seed;
}

function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

function lockWalletFromMenu() {
  session.connection?.disconnect();
  session.connection = null;
  wipeSeed();
  if (session.lockTimer) {
    clearTimeout(session.lockTimer);
    session.lockTimer = null;
  }
  mainWindow?.webContents.send("wallet:locked");
}

function installApplicationMenu() {
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "BPVP",
      submenu: [
        {
          label: "Lock Wallet",
          accelerator: "CommandOrControl+L",
          click: () => lockWalletFromMenu(),
        },
        { type: "separator" },
        {
          label: "Open Dashboard in Browser",
          click: () => {
            void shell.openExternal(session.settings.dashboardUrl);
          },
        },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  if (!isMac) {
    template.push({
      label: "File",
      submenu: [{ role: "quit" }],
    });
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function installTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  tray = new Tray(TRAY_ICON);
  tray.setToolTip("BPVP Wallet");
  const menu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: () => showMainWindow(),
    },
    {
      label: "Lock",
      click: () => lockWalletFromMenu(),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.on("click", () => showMainWindow());
}

app.whenReady().then(async () => {
  await loadSettingsFile();
  session.vaultPath = vaultFilePath();
  installApplicationMenu();
  mainWindow = createMainWindow();
  installTray();

  ipcMain.handle("activity", () => {
    touchActivity();
  });

  ipcMain.handle("wallet:status", async () => {
    let hasVault = false;
    try {
      await readFile(session.vaultPath, "utf8");
      hasVault = true;
    } catch {
      hasVault = false;
    }
    return {
      hasVault,
      locked: session.seed === null,
      network: session.settings.network,
      dashboardUrl: session.settings.dashboardUrl,
    };
  });

  ipcMain.handle("settings:get", async () => ({ ...session.settings }));

  ipcMain.handle("settings:set", async (_e, partial: Partial<WalletSettings>) => {
    session.settings = { ...session.settings, ...partial };
    await persistSettings();
    touchActivity();
    return session.settings;
  });

  ipcMain.handle("vault:create", async (_e, passphrase: string, network: NetworkId) => {
    touchActivity();
    await initVault(session.vaultPath, passphrase, network);
    session.settings.network = network;
    await persistSettings();
    return { ok: true };
  });

  ipcMain.handle("vault:unlock", async (_e, passphrase: string) => {
    touchActivity();
    const { file, inner } = await loadVault(session.vaultPath, passphrase);
    session.settings.network = file.network;
    await persistSettings();
    if (!inner.seedHex) {
      return { ok: true, empty: true as const };
    }
    wipeSeed();
    session.seed = Buffer.from(inner.seedHex, "hex");
    scheduleAutoLock();
    return { ok: true, empty: false as const };
  });

  ipcMain.handle("vault:import", async (_e, mnemonic: string, passphrase: string) => {
    touchActivity();
    const m = mnemonic.trim();
    if (!validateMnemonic(m)) {
      throw new Error("invalid mnemonic");
    }
    const seed = mnemonicToSeed(m);
    const inner: VaultInner = { seedHex: seed.toString("hex") };
    seed.fill(0);
    await saveVault(session.vaultPath, passphrase, session.settings.network, inner);
    wipeSeed();
    session.seed = Buffer.from(inner.seedHex!, "hex");
    scheduleAutoLock();
    return { ok: true };
  });

  ipcMain.handle("seed:generate", async () => {
    touchActivity();
    const m = generateMnemonic();
    session.mnemonicTemp = m;
    return { mnemonic: m.split(/\s+/) };
  });

  /** Returns only word indices — full phrase never leaves main after Create display. */
  ipcMain.handle("backup:start", async () => {
    touchActivity();
    if (!session.mnemonicTemp) {
      throw new Error("no mnemonic session");
    }
    const words = session.mnemonicTemp.split(/\s+/);
    const indices: number[] = [];
    while (indices.length < 3) {
      const i = Math.floor(Math.random() * words.length);
      if (!indices.includes(i)) indices.push(i);
    }
    indices.sort((a, b) => a - b);
    session.backupIndices = indices;
    return { indices };
  });

  ipcMain.handle("backup:verify", async (_e, words: string[]) => {
    touchActivity();
    if (!session.mnemonicTemp || !session.backupIndices) {
      throw new Error("backup not started");
    }
    const expected = session.mnemonicTemp.split(/\s+/);
    for (let i = 0; i < session.backupIndices.length; i++) {
      const idx = session.backupIndices[i];
      if ((words[i] ?? "").trim().toLowerCase() !== (expected[idx] ?? "").toLowerCase()) {
        return { ok: false };
      }
    }
    return { ok: true };
  });

  ipcMain.handle("wallet:commit", async (_e, passphrase: string) => {
    touchActivity();
    if (!session.mnemonicTemp) {
      throw new Error("no mnemonic");
    }
    const { inner } = await createWalletSeed(
      session.vaultPath,
      passphrase,
      session.settings.network,
      session.mnemonicTemp,
    );
    clearMnemonicTemp();
    wipeSeed();
    if (!inner.seedHex) {
      throw new Error("vault missing seed after commit");
    }
    session.seed = Buffer.from(inner.seedHex, "hex");
    scheduleAutoLock();
    return { ok: true };
  });

  ipcMain.handle("wallet:verifyPassphrase", async (_e, passphrase: string) => {
    touchActivity();
    await loadVault(session.vaultPath, passphrase);
    return { ok: true };
  });

  ipcMain.handle("wallet:lock", async () => {
    session.connection?.disconnect();
    session.connection = null;
    wipeSeed();
    if (session.lockTimer) {
      clearTimeout(session.lockTimer);
      session.lockTimer = null;
    }
    return { ok: true };
  });

  ipcMain.handle("derive:address", async (_e, index: number, type: AddressType) => {
    touchActivity();
    const seed = await ensureSeed();
    return deriveAddress(seed, index, type, session.settings.network);
  });

  ipcMain.handle("sign:message", async (_e, index: number, type: AddressType, message: string) => {
    touchActivity();
    const seed = await ensureSeed();
    return signMessageWithSeed(seed, index, type, session.settings.network, message);
  });

  ipcMain.handle("sign:psbt", async (_e, psbtBase64: string) => {
    touchActivity();
    const seed = await ensureSeed();
    return signPsbt(seed, psbtBase64, session.settings.network);
  });

  ipcMain.handle("tx:broadcast", async (_e, rawHex: string, apiBase?: string) => {
    touchActivity();
    const base = (apiBase ?? session.settings.dashboardUrl).replace(/\/$/, "");
    const r = await fetch(`${base}/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawtx: rawHex }),
    }).catch(() => null);
    if (!r?.ok) {
      return { ok: false, error: "broadcast_failed" };
    }
    return { ok: true };
  });

  ipcMain.handle("connect:dashboard", async (_e, url: string, addressIndex: number, addressType: AddressType) => {
    touchActivity();
    session.connection?.disconnect();
    const seed = await ensureSeed();
    const wsUrl = toWsUrl(url);
    const conn = new DashboardConnection(
      wsUrl,
      async (nonce) => {
        const { signature } = await signMessageWithSeed(
          seed,
          addressIndex,
          addressType,
          session.settings.network,
          nonce,
        );
        return signature;
      },
      5 * 60_000,
    );
    await conn.connect();
    session.connection = conn;
    return { ok: true };
  });

  ipcMain.handle("connect:disconnect", async () => {
    session.connection?.disconnect();
    session.connection = null;
    return { ok: true };
  });

  ipcMain.handle("ui:privacy", async (_e, on: boolean) => {
    setContentProtection(mainWindow, on);
    return { ok: true };
  });

  ipcMain.handle("vault:reset", async (_e, passphrase: string, confirm: string) => {
    if (confirm !== "DELETE MY WALLET") {
      throw new Error("confirmation mismatch");
    }
    await loadVault(session.vaultPath, passphrase);
    await initVault(session.vaultPath, passphrase, session.settings.network);
    session.connection?.disconnect();
    session.connection = null;
    wipeSeed();
    clearMnemonicTemp();
    return { ok: true };
  });

  ipcMain.handle("validate:address", async (_e, addr: string) => {
    try {
      bitcoin.address.toOutputScript(addr.trim(), getBitcoinNetwork(session.settings.network));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

  ipcMain.handle("xpub:export", async (_e, account = 0) => {
    touchActivity();
    const seed = await ensureSeed();
    return { xpub: getXpub(seed, session.settings.network, account) };
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });

  app.on("before-quit", () => {
    tray?.destroy();
    tray = null;
  });
});
