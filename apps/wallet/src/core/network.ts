import * as bitcoin from "bitcoinjs-lib";

export type NetworkId = "bitcoin" | "testnet" | "signet" | "regtest";

/** Signet uses same address versions as testnet in bitcoinjs-lib; bech32 HRP is `tb`. */
const signetLike: bitcoin.Network = {
  ...bitcoin.networks.testnet,
  bech32: "tb",
};

export function getBitcoinNetwork(id: NetworkId): bitcoin.Network {
  switch (id) {
    case "bitcoin":
      return bitcoin.networks.bitcoin;
    case "testnet":
      return bitcoin.networks.testnet;
    case "signet":
      return signetLike;
    case "regtest":
      return bitcoin.networks.regtest;
    default:
      return bitcoin.networks.testnet;
  }
}

/** BIP44 coin type: mainnet 0, everything else 1. */
export function coinTypeForNetwork(id: NetworkId): number {
  return id === "bitcoin" ? 0 : 1;
}
