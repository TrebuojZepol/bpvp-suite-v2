import * as bip39 from "bip39";

export function generateMnemonic(): string {
  return bip39.generateMnemonic(256);
}

export function validateMnemonic(phrase: string): boolean {
  return bip39.validateMnemonic(phrase.trim());
}

export function mnemonicToSeed(mnemonic: string): Buffer {
  return bip39.mnemonicToSeedSync(mnemonic.trim(), "");
}
