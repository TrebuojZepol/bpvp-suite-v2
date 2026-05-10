import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import argon2 from "argon2";
import type { NetworkId } from "./network.js";
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from "./seed.js";

export const VAULT_VERSION = 1;

export type VaultKdf = {
  alg: "argon2id";
  salt: string;
  memoryKiB: number;
  iterations: number;
  parallelism: number;
};

export type VaultCipher = {
  iv: string;
  tag: string;
  ciphertext: string;
};

/** On-disk vault envelope: KDF params + AES-256-GCM payload. */
export type VaultFile = {
  version: number;
  network: NetworkId;
  kdf: VaultKdf;
  cipher: VaultCipher;
};

/** Decrypted JSON payload (never includes plaintext mnemonic on initial create). */
export type VaultInner = {
  seedHex?: string;
};

const ARGON_MEMORY_KIB = 65536;
const ARGON_TIME = 3;
const ARGON_PARALLELISM = 4;
const SALT_LEN = 16;
const KEY_LEN = 32;
const IV_LEN = 12;

async function deriveKey(passphrase: string, kdf: VaultKdf): Promise<Buffer> {
  const salt = Buffer.from(kdf.salt, "base64");
  const hash = await argon2.hash(passphrase, {
    type: argon2.argon2id,
    salt,
    memoryCost: kdf.memoryKiB,
    timeCost: kdf.iterations,
    parallelism: kdf.parallelism,
    hashLength: KEY_LEN,
    raw: true,
  });
  return Buffer.from(hash);
}

function encrypt(plain: string, key: Buffer): VaultCipher {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: enc.toString("base64"),
  };
}

function decrypt(cipher: VaultCipher, key: Buffer): string {
  const iv = Buffer.from(cipher.iv, "base64");
  const tag = Buffer.from(cipher.tag, "base64");
  const data = Buffer.from(cipher.ciphertext, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/**
 * initVault creates an empty encrypted vault (no seed) at path using Argon2id + AES-256-GCM.
 */
export async function initVault(
  vaultPath: string,
  passphrase: string,
  network: NetworkId,
): Promise<VaultFile> {
  const inner: VaultInner = {};
  return saveVault(vaultPath, passphrase, network, inner);
}

/**
 * createWalletSeed generates a real BIP39 mnemonic, derives the seed, encrypts it into the vault, and returns the word list for backup UX.
 * If `mnemonic` is provided (e.g. after user verification), it must be a valid phrase; otherwise a new one is generated.
 */
export async function createWalletSeed(
  vaultPath: string,
  passphrase: string,
  network: NetworkId,
  mnemonic?: string,
): Promise<{ mnemonicWords: string[]; file: VaultFile; inner: VaultInner }> {
  const phrase = (mnemonic?.trim() ? mnemonic.trim() : generateMnemonic()).trim();
  if (!validateMnemonic(phrase)) {
    throw new Error("invalid mnemonic");
  }
  const seedBuf = mnemonicToSeed(phrase);
  const inner: VaultInner = { seedHex: seedBuf.toString("hex") };
  seedBuf.fill(0);
  const file = await saveVault(vaultPath, passphrase, network, inner);
  const mnemonicWords = phrase.split(/\s+/);
  return { mnemonicWords, file, inner };
}

/**
 * saveVault encrypts inner JSON and writes the file with mode 0o600.
 */
export async function saveVault(
  vaultPath: string,
  passphrase: string,
  network: NetworkId,
  inner: VaultInner,
): Promise<VaultFile> {
  const salt = randomBytes(SALT_LEN);
  const kdf: VaultKdf = {
    alg: "argon2id",
    salt: salt.toString("base64"),
    memoryKiB: ARGON_MEMORY_KIB,
    iterations: ARGON_TIME,
    parallelism: ARGON_PARALLELISM,
  };
  const key = await deriveKey(passphrase, kdf);
  const cipher = encrypt(JSON.stringify(inner), key);
  key.fill(0);

  const file: VaultFile = {
    version: VAULT_VERSION,
    network,
    kdf,
    cipher,
  };

  await mkdir(dirname(vaultPath), { recursive: true });
  await writeFile(vaultPath, JSON.stringify(file, null, 0), { mode: 0o600 });
  await chmod(vaultPath, 0o600);
  return file;
}

/**
 * loadVault reads and decrypts the vault at path using the passphrase.
 */
export async function loadVault(
  vaultPath: string,
  passphrase: string,
): Promise<{ file: VaultFile; inner: VaultInner }> {
  const raw = await readFile(vaultPath, "utf8");
  const file = JSON.parse(raw) as VaultFile;
  if (file.version !== VAULT_VERSION) {
    throw new Error("unsupported vault version");
  }
  const key = await deriveKey(passphrase, file.kdf);
  let inner: VaultInner;
  try {
    inner = JSON.parse(decrypt(file.cipher, key)) as VaultInner;
  } finally {
    key.fill(0);
  }
  return { file, inner };
}
