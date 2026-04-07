/**
 * txnToast.tsx — Transaction notification helper using react-hot-toast.
 *
 * Shows a styled toast with a clickable link to the Lora explorer.
 */

import React from 'react'
import toast from 'react-hot-toast'
import { getNetwork, type Network } from './algorand'

// ─── Explorer URL builder ───────────────────────────────────────────────────

const EXPLORER_BASES: Record<Network, string> = {
  localnet: 'https://lora.algokit.io/localnet',
  testnet: 'https://lora.algokit.io/testnet',
  mainnet: 'https://lora.algokit.io/mainnet',
}

export function getExplorerTxUrl(txId: string): string {
  const network = getNetwork()
  return `${EXPLORER_BASES[network]}/transaction/${txId}`
}

export function getExplorerAppUrl(appId: bigint | number): string {
  const network = getNetwork()
  return `${EXPLORER_BASES[network]}/application/${appId}`
}

// ─── Toast styles ───────────────────────────────────────────────────────────

const TOAST_STYLE = {
  background: '#1d232a',
  color: '#a6adbb',
  border: '1px solid #2a323c',
}

const TOAST_ERROR_STYLE = {
  background: '#1d232a',
  color: '#a6adbb',
  border: '1px solid #3b1f1f',
}

// ─── Toast helpers ──────────────────────────────────────────────────────────

/** Show a success toast with a clickable explorer link. */
export function txnSuccess(message: string, txId: string): void {
  const url = getExplorerTxUrl(txId)

  toast.success(
    () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontWeight: 600 }}>{message} ✓</span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'underline' }}>
          View on explorer →
        </a>
      </div>
    ),
    { duration: 6000, style: TOAST_STYLE },
  )
}

/** Show an error toast. */
export function txnError(message: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : String(err ?? '')
  const text = `${message}${detail ? `: ${detail.slice(0, 120)}` : ''}`

  toast.error(text, { duration: 8000, style: TOAST_ERROR_STYLE })
}

/** Show an info toast (non-error, no icon). */
export function txnInfo(message: string): void {
  toast(message, { duration: 4000, icon: 'ℹ️', style: TOAST_STYLE })
}
