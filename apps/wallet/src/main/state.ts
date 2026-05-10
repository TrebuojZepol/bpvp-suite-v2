import type { DashboardConnection } from "../core/connect.js";
import type { AddressType } from "../core/derive.js";
import type { NetworkId } from "../core/network.js";

export type WalletSettings = {
  network: NetworkId;
  defaultAddressType: AddressType;
  autoLockMs: number;
  dashboardUrl: string;
  autoApproveBtc: number;
};

export const defaultSettings: WalletSettings = {
  network: "testnet",
  defaultAddressType: "p2wpkh",
  autoLockMs: 15 * 60 * 1000,
  dashboardUrl: "http://localhost:3000",
  autoApproveBtc: 0,
};

export const session: {
  seed: Buffer | null;
  vaultPath: string;
  settings: WalletSettings;
  mnemonicTemp: string | null;
  backupIndices: number[] | null;
  connection: DashboardConnection | null;
  lockTimer: ReturnType<typeof setTimeout> | null;
} = {
  seed: null,
  vaultPath: "",
  settings: { ...defaultSettings },
  mnemonicTemp: null,
  backupIndices: null,
  connection: null,
  lockTimer: null,
};

export function wipeSeed() {
  if (session.seed) {
    session.seed.fill(0);
    session.seed = null;
  }
}

export function clearMnemonicTemp() {
  session.mnemonicTemp = null;
  session.backupIndices = null;
}
