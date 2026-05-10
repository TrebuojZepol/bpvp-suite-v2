import { createHash } from "node:crypto";
import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import * as bitcoinMessage from "bitcoinjs-message";
import * as noble from "@noble/secp256k1";
import type { AddressType } from "./derive.js";
import { deriveAddress, derivePrivateKeyAtPath } from "./derive.js";
import type { NetworkId } from "./network.js";
import { getBitcoinNetwork } from "./network.js";

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

/**
 * signMessage creates a base64-encoded signature for message using the raw private key.
 * The key buffer is zeroed before return. Never log the key material.
 */
export function signMessage(
  privateKey: Buffer,
  message: string,
  type: AddressType,
  _networkId: NetworkId,
): string {
  const key = Buffer.from(privateKey);
  try {
    if (type === "p2tr") {
      const msgHash = createHash("sha256").update(message, "utf8").digest();
      const sig = noble.schnorr.sign(new Uint8Array(msgHash), new Uint8Array(key));
      return Buffer.from(sig).toString("base64");
    }
    const keyPair = ECPair.fromPrivateKey(key);
    const signature = bitcoinMessage.sign(message, keyPair.privateKey!, true);
    return signature.toString("base64");
  } finally {
    key.fill(0);
  }
}

/**
 * Derives the signing key from seed, signs, and returns signature + address. Keys are wiped after use.
 */
export function signMessageWithSeed(
  seed: Buffer,
  index: number,
  type: AddressType,
  networkId: NetworkId,
  message: string,
): { signature: string; address: string } {
  const { address, path } = deriveAddress(seed, index, type, networkId);
  const priv = derivePrivateKeyAtPath(seed, path, networkId);
  try {
    const signature = signMessage(priv, message, type, networkId);
    return { signature, address };
  } finally {
    priv.fill(0);
  }
}

export function signPsbt(seed: Buffer, psbtBase64: string, networkId: NetworkId): string {
  const network = getBitcoinNetwork(networkId);
  const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network });
  const root = bip32.fromSeed(seed, network);

  psbt.data.inputs.forEach((input, idx) => {
    const bip32Derivation = input.bip32Derivation?.[0];
    if (!bip32Derivation) return;
    const node = root.derivePath(bip32Derivation.path);
    if (!node.privateKey) return;
    try {
      psbt.signInput(idx, node);
    } catch {
      /* unsupported script path */
    }
    node.privateKey.fill(0);
  });

  return psbt.toBase64();
}
