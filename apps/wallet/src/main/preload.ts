import { contextBridge, ipcRenderer } from "electron";
import type { AddressType } from "../core/derive.js";
import type { NetworkId } from "../core/network.js";

type WalletSettings = {
  network: NetworkId;
  defaultAddressType: AddressType;
  autoLockMs: number;
  dashboardUrl: string;
  autoApproveBtc: number;
};

/**
 * Minimal IPC surface exposed to the renderer. No key material crosses this bridge.
 */
const api = {
  activity: () => ipcRenderer.invoke("activity"),
  getStatus: () =>
    ipcRenderer.invoke("wallet:status") as Promise<{
      hasVault: boolean;
      locked: boolean;
      network: NetworkId;
      dashboardUrl: string;
    }>,
  settingsGet: () => ipcRenderer.invoke("settings:get") as Promise<WalletSettings>,
  settingsSet: (partial: Partial<WalletSettings>) =>
    ipcRenderer.invoke("settings:set", partial) as Promise<WalletSettings>,

  vaultCreate: (passphrase: string, network: NetworkId) =>
    ipcRenderer.invoke("vault:create", passphrase, network),
  /** Alias: unlock + decrypt vault from disk. */
  vaultLoad: (passphrase: string) => ipcRenderer.invoke("vault:unlock", passphrase),
  vaultUnlock: (passphrase: string) => ipcRenderer.invoke("vault:unlock", passphrase),
  vaultImport: (mnemonic: string, passphrase: string) =>
    ipcRenderer.invoke("vault:import", mnemonic, passphrase),
  vaultReset: (passphrase: string, confirm: string) =>
    ipcRenderer.invoke("vault:reset", passphrase, confirm),

  seedGenerate: () => ipcRenderer.invoke("seed:generate") as Promise<{ mnemonic: string[] }>,
  backupStart: () => ipcRenderer.invoke("backup:start") as Promise<{ indices: number[] }>,
  backupVerify: (words: string[]) => ipcRenderer.invoke("backup:verify", words),
  walletCommit: (passphrase: string) => ipcRenderer.invoke("wallet:commit", passphrase),
  walletVerifyPassphrase: (passphrase: string) => ipcRenderer.invoke("wallet:verifyPassphrase", passphrase),

  walletLock: () => ipcRenderer.invoke("wallet:lock"),

  deriveAddress: (index: number, type: AddressType) =>
    ipcRenderer.invoke("derive:address", index, type) as Promise<{
      address: string;
      publicKey: string;
      path: string;
    }>,

  signMessage: (index: number, type: AddressType, message: string) =>
    ipcRenderer.invoke("sign:message", index, type, message) as Promise<{
      signature: string;
      address: string;
    }>,

  signTransaction: (psbtBase64: string) =>
    ipcRenderer.invoke("sign:psbt", psbtBase64) as Promise<string>,

  broadcastTx: (rawHex: string, apiBase?: string) =>
    ipcRenderer.invoke("tx:broadcast", rawHex, apiBase) as Promise<{ ok: boolean; error?: string }>,

  connectDashboard: (url: string, addressIndex: number, addressType: AddressType) =>
    ipcRenderer.invoke("connect:dashboard", url, addressIndex, addressType),
  disconnectDashboard: () => ipcRenderer.invoke("connect:disconnect"),

  validateAddress: (addr: string) =>
    ipcRenderer.invoke("validate:address", addr) as Promise<{ ok: boolean }>,
  exportXpub: (account?: number) =>
    ipcRenderer.invoke("xpub:export", account) as Promise<{ xpub: string }>,

  setPrivacyScreen: (on: boolean) => ipcRenderer.invoke("ui:privacy", on),

  onLocked: (cb: () => void) => {
    ipcRenderer.on("wallet:locked", cb);
    return () => ipcRenderer.removeListener("wallet:locked", cb);
  },
};

contextBridge.exposeInMainWorld("bpvp", api);
