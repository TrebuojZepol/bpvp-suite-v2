import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getPreloadPath(): string {
  return path.join(__dirname, "preload.cjs");
}

export function getRendererHtmlPath(): string {
  return path.join(__dirname, "..", "renderer", "index.html");
}

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  const dev = process.env.BPVP_WALLET_DEV === "1";
  if (dev) {
    void win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    void win.loadFile(getRendererHtmlPath());
  }

  return win;
}

export function setContentProtection(win: BrowserWindow | null, on: boolean) {
  if (win && !win.isDestroyed()) {
    win.setContentProtection(on);
  }
}
