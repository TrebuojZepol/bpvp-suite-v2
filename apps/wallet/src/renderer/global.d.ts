type AddressType = "p2wpkh" | "p2tr" | "p2sh-p2wpkh" | "p2pkh";
type NetworkId = "bitcoin" | "testnet" | "signet" | "regtest";

type WalletSettings = {
  network: NetworkId;
  defaultAddressType: AddressType;
  autoLockMs: number;
  dashboardUrl: string;
  autoApproveBtc: number;
};

declare global {
  interface Window {
    bpvp: {
      activity: () => Promise<void>;
      getStatus: () => Promise<{
        hasVault: boolean;
        locked: boolean;
        network: NetworkId;
        dashboardUrl: string;
      }>;
      settingsGet: () => Promise<WalletSettings>;
      settingsSet: (p: Partial<WalletSettings>) => Promise<WalletSettings>;
      vaultCreate: (passphrase: string, network: NetworkId) => Promise<unknown>;
      vaultLoad: (passphrase: string) => Promise<{ ok: boolean; empty?: boolean }>;
      vaultUnlock: (passphrase: string) => Promise<{ ok: boolean; empty?: boolean }>;
      vaultImport: (mnemonic: string, passphrase: string) => Promise<unknown>;
      vaultReset: (passphrase: string, confirm: string) => Promise<unknown>;
      seedGenerate: () => Promise<{ mnemonic: string[] }>;
      backupStart: () => Promise<{ indices: number[] }>;
      backupVerify: (words: string[]) => Promise<{ ok: boolean }>;
      walletCommit: (passphrase: string) => Promise<unknown>;
      walletVerifyPassphrase: (passphrase: string) => Promise<{ ok: boolean }>;
      walletLock: () => Promise<unknown>;
      deriveAddress: (
        index: number,
        type: AddressType,
      ) => Promise<{ address: string; publicKey: string; path: string }>;
      signMessage: (
        index: number,
        type: AddressType,
        message: string,
      ) => Promise<{ signature: string; address: string }>;
      signTransaction: (psbt: string) => Promise<string>;
      broadcastTx: (rawHex: string, apiBase?: string) => Promise<{ ok: boolean; error?: string }>;
      connectDashboard: (url: string, addressIndex: number, addressType: AddressType) => Promise<unknown>;
      disconnectDashboard: () => Promise<unknown>;
      validateAddress: (addr: string) => Promise<{ ok: boolean }>;
      exportXpub: (account?: number) => Promise<{ xpub: string }>;
      setPrivacyScreen: (on: boolean) => Promise<unknown>;
      onLocked: (cb: () => void) => () => void;
    };
  }
}

export {};
