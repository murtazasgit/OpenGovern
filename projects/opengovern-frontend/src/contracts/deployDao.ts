/**
 * deployDao — Deploy a new instance of the Daocontract.
 *
 * Uses raw algosdk + the compiled TEAL (base64-encoded) to create the
 * application on-chain via an ApplicationCreateTransaction.
 *
 * For production use, prefer the generated typed client from
 * `algokit generate client`.  This module is a standalone, dependency-light
 * alternative that works with any algosdk v3 setup.
 */

import algosdk from 'algosdk'

// ─── ABI method for the create call ─────────────────────────────────────────
const CREATE_DAO_METHOD = new algosdk.ABIMethod({
  name: 'create_dao',
  args: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'description' },
    { type: 'uint64', name: 'quorum' },
    { type: 'uint64', name: 'threshold' },
    { type: 'uint64', name: 'voting_duration' },
    { type: 'uint64', name: 'membership_type' },
    { type: 'uint64', name: 'minimum_stake' },
  ],
  returns: { type: 'void' },
})

// ─── Config ─────────────────────────────────────────────────────────────────
export interface DeployDaoConfig {
  /** Human-readable DAO name */
  name: string
  /** DAO description */
  description: string
  /** Minimum number of voters for quorum */
  quorum: number
  /** Minimum YES vote percentage (1-100) */
  threshold: number
  /** Voting window in seconds */
  votingDuration: number
  /** 0 = whitelist, 1 = stake */
  membershipType: number
  /** Minimum stake in microAlgos (only for stake mode) */
  minimumStake: number
}

export interface DeployDaoResult {
  appId: bigint
  appAddress: string
  txId: string
}

// ─── Helper: get algod client from VITE env ─────────────────────────────────
export function getAlgodClient(): algosdk.Algodv2 {
  const server = import.meta.env.VITE_ALGOD_SERVER ?? 'http://localhost'
  const port = import.meta.env.VITE_ALGOD_PORT ?? '4001'
  const token = import.meta.env.VITE_ALGOD_TOKEN ?? 'a'.repeat(64)

  return new algosdk.Algodv2(token, server, port)
}

// ─── Main deploy function ───────────────────────────────────────────────────

/**
 * Deploy a brand-new Daocontract instance.
 *
 * @param config  - DAO parameters (name, quorum, threshold, etc.)
 * @param approvalB64  - Base64-encoded approval TEAL program (compiled)
 * @param clearB64     - Base64-encoded clear-state TEAL program (compiled)
 * @param sender       - Deployer address
 * @param signer       - Transaction signer (from wallet adapter)
 * @param algodClient  - Optional custom algod client
 *
 * @returns The new app ID, address, and creation tx ID.
 */
export async function deployDao(
  config: DeployDaoConfig,
  approvalB64: string,
  clearB64: string,
  sender: string,
  signer: algosdk.TransactionSigner,
  algodClient?: algosdk.Algodv2,
): Promise<DeployDaoResult> {
  const client = algodClient ?? getAlgodClient()
  const sp = await client.getTransactionParams().do()

  // The b64 files contain base64-encoded TEAL *source* text.
  // We must compile through algod to get bytecode.
  const approvalSource = new TextDecoder().decode(new Uint8Array(Buffer.from(approvalB64, 'base64')))
  const clearSource = new TextDecoder().decode(new Uint8Array(Buffer.from(clearB64, 'base64')))

  const approvalCompiled = await client.compile(approvalSource).do()
  const clearCompiled = await client.compile(clearSource).do()

  const approvalProgram = new Uint8Array(Buffer.from(approvalCompiled.result, 'base64'))
  const clearProgram = new Uint8Array(Buffer.from(clearCompiled.result, 'base64'))

  // ── Build the ABI-encoded create call ──────────────────────────────────
  const atc = new algosdk.AtomicTransactionComposer()

  atc.addMethodCall({
    appID: 0, // 0 = create new application
    method: CREATE_DAO_METHOD,
    methodArgs: [
      config.name,
      config.description,
      BigInt(config.quorum),
      BigInt(config.threshold),
      BigInt(config.votingDuration),
      BigInt(config.membershipType),
      BigInt(config.minimumStake),
    ],
    sender,
    suggestedParams: { ...sp, fee: Math.max(Number(sp.minFee), 3000), flatFee: true },
    signer,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram,
    clearProgram,
    extraPages: 3, // contract is large — needs extra pages
    numGlobalByteSlices: 3, // dao_name, description, creator
    numGlobalInts: 7, // quorum, threshold, voting_duration, proposal_count, total_members, membership_type, minimum_stake
    numLocalByteSlices: 0,
    numLocalInts: 2, // member_since, staked_amount
  })

  // ── Execute ────────────────────────────────────────────────────────────
  const result = await atc.execute(client, 4)
  const txId = result.txIDs[0]

  // The created app ID is in the confirmed transaction info
  const txInfo = await client.pendingTransactionInformation(txId).do()
  const appId = BigInt(
    ((txInfo as unknown as Record<string, unknown>).applicationIndex as number) ??
      ((txInfo as unknown as Record<string, unknown>)['application-index'] as number),
  )
  const appAddress = algosdk.getApplicationAddress(appId).toString()

  return { appId, appAddress, txId }
}

/**
 * Convenience: fund the newly deployed DAO treasury so it can send inner txns.
 */
export async function fundDaoTreasury(
  appId: bigint,
  amountMicroAlgos: number,
  sender: string,
  signer: algosdk.TransactionSigner,
  algodClient?: algosdk.Algodv2,
): Promise<string> {
  const client = algodClient ?? getAlgodClient()
  const sp = await client.getTransactionParams().do()
  const appAddress = algosdk.getApplicationAddress(appId).toString()

  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver: appAddress,
    amount: amountMicroAlgos,
    suggestedParams: sp,
  })

  const signed = await signer([payTxn], [0])
  const { txid } = await client.sendRawTransaction(signed).do()
  await algosdk.waitForConfirmation(client, txid, 4)

  return txid
}
