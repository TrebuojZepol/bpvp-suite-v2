import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import { coinTypeForNetwork, getBitcoinNetwork, type NetworkId } from "./network.js";

const bip32 = BIP32Factory(ecc);

export type AddressType = "p2wpkh" | "p2tr" | "p2sh-p2wpkh" | "p2pkh";

export type DerivedAddress = {
  address: string;
  publicKey: string;
  path: string;
};

function toXOnly(pubkey: Buffer): Buffer {
  return pubkey.subarray(1, 33);
}

export function deriveAddress(
  seed: Buffer,
  index: number,
  type: AddressType,
  networkId: NetworkId,
): DerivedAddress {
  if (!seed || seed.length === 0) {
    throw new Error("seed required");
  }
  const network = getBitcoinNetwork(networkId);
  const coin = coinTypeForNetwork(networkId);
  const root = bip32.fromSeed(seed, network);

  let path: string;
  let node: ReturnType<typeof root.derivePath>;
  let payment: bitcoin.Payment;

  switch (type) {
    case "p2wpkh":
      path = `m/84'/${coin}'/0'/0/${index}`;
      node = root.derivePath(path);
      payment = bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network });
      break;
    case "p2tr":
      path = `m/86'/${coin}'/0'/0/${index}`;
      node = root.derivePath(path);
      payment = bitcoin.payments.p2tr({ internalPubkey: toXOnly(node.publicKey), network });
      break;
    case "p2sh-p2wpkh":
      path = `m/49'/${coin}'/0'/0/${index}`;
      node = root.derivePath(path);
      payment = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network }),
        network,
      });
      break;
    case "p2pkh":
      path = `m/44'/${coin}'/0'/0/${index}`;
      node = root.derivePath(path);
      payment = bitcoin.payments.p2pkh({ pubkey: node.publicKey, network });
      break;
    default:
      throw new Error("unsupported address type");
  }

  if (!payment.address) {
    throw new Error("failed to derive address");
  }

  return {
    address: payment.address,
    publicKey: node.publicKey.toString("hex"),
    path,
  };
}

export function derivePrivateKeyAtPath(seed: Buffer, path: string, networkId: NetworkId): Buffer {
  if (!seed || seed.length === 0) {
    throw new Error("seed required");
  }
  const network = getBitcoinNetwork(networkId);
  const root = bip32.fromSeed(seed, network);
  const node = root.derivePath(path);
  if (!node.privateKey) {
    throw new Error("missing private key");
  }
  return node.privateKey;
}

export function getXpub(seed: Buffer, networkId: NetworkId, account = 0): string {
  if (!seed || seed.length === 0) {
    throw new Error("seed required");
  }
  const network = getBitcoinNetwork(networkId);
  const coin = coinTypeForNetwork(networkId);
  const root = bip32.fromSeed(seed, network);
  const accountNode = root.derivePath(`m/84'/${coin}'/${account}'`);
  return accountNode.neutered().toBase58();
}
