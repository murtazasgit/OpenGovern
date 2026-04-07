/**
 * algorand.ts — Low-level Algorand utilities.
 *
 * Provides algod client constructors and address formatting helpers.
 * Automatically selects localnet vs testnet based on VITE_NETWORK.
 */

import algosdk from 'algosdk'

// ─── Network detection ──────────────────────────────────────────────────────

export type Network = 'localnet' | 'testnet' | 'mainnet'

/** Current network from env. Falls back to localnet. */
export function getNetwork(): Network {
  const net = (import.meta.env.VITE_NETWORK ?? import.meta.env.VITE_ALGOD_NETWORK ?? 'localnet').toLowerCase()

  if (net === 'testnet') return 'testnet'
  if (net === 'mainnet') return 'mainnet'
  return 'localnet'
}

export function isLocalnet(): boolean {
  return getNetwork() === 'localnet'
}

// ─── Algod client ───────────────────────────────────────────────────────────

/**
 * Create an Algodv2 client for the current network.
 *
 * Reads from VITE_ALGOD_SERVER/PORT/TOKEN. If none are set, uses
 * sensible defaults per VITE_NETWORK:
 *  - localnet → localhost:4001
 *  - testnet  → testnet-api.algonode.cloud:443
 *  - mainnet  → mainnet-api.algonode.cloud:443
 */
export function getAlgodClient(): algosdk.Algodv2 {
  const server = import.meta.env.VITE_ALGOD_SERVER
  const port = import.meta.env.VITE_ALGOD_PORT
  const token = import.meta.env.VITE_ALGOD_TOKEN

  // If env vars are set, use them directly
  if (server) {
    return new algosdk.Algodv2(token ?? '', server, port ?? '')
  }

  // Otherwise fall back based on network
  const network = getNetwork()
  switch (network) {
    case 'testnet':
      return new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443)
    case 'mainnet':
      return new algosdk.Algodv2('', 'https://mainnet-api.algonode.cloud', 443)
    default:
      return new algosdk.Algodv2('a'.repeat(64), 'http://localhost', 4001)
  }
}

// ─── Indexer client ─────────────────────────────────────────────────────────

/** Create an Indexer client for the current network. */
export function getIndexerClient(): algosdk.Indexer {
  const server = import.meta.env.VITE_INDEXER_SERVER
  const port = import.meta.env.VITE_INDEXER_PORT
  const token = import.meta.env.VITE_INDEXER_TOKEN

  if (server) {
    return new algosdk.Indexer(token ?? '', server, port ?? '')
  }

  const network = getNetwork()
  switch (network) {
    case 'testnet':
      return new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', 443)
    case 'mainnet':
      return new algosdk.Indexer('', 'https://mainnet-idx.algonode.cloud', 443)
    default:
      return new algosdk.Indexer('a'.repeat(64), 'http://localhost', 8980)
  }
}

// ─── Localnet convenience ───────────────────────────────────────────────────

/**
 * Create an Algodv2 client pre-configured for AlgoKit LocalNet.
 * Uses localhost:4001 with the default sandbox token.
 */
export function getAlgodLocalnet(): algosdk.Algodv2 {
  return new algosdk.Algodv2('a'.repeat(64), 'http://localhost', 4001)
}

// ─── Address helpers ────────────────────────────────────────────────────────

/**
 * Shorten an Algorand address for display.
 *
 * @example shortenAddress("ABC...XYZ") → "ABCDEF...WXYZ"
 *
 * @param addr  Full 58-character Algorand address
 * @param front Number of leading characters to keep (default 6)
 * @param back  Number of trailing characters to keep (default 4)
 */
export function shortenAddress(addr: string, front = 6, back = 4): string {
  if (!addr) return ''
  if (addr.length <= front + back + 3) return addr
  return `${addr.slice(0, front)}...${addr.slice(-back)}`
}

// ─── Micro-Algo conversion ──────────────────────────────────────────────────

/** Convert ALGO to microAlgo (1 ALGO = 1_000_000 microAlgo). */
export function algoToMicroAlgo(algo: number): number {
  return Math.round(algo * 1_000_000)
}

/** Convert microAlgo to ALGO. */
export function microAlgoToAlgo(microAlgo: number | bigint): number {
  return Number(microAlgo) / 1_000_000
}
