/**
 * daoRegistry.ts — DAO registry backed by Supabase.
 *
 * Replaces localStorage with a Supabase `dao_registry` table so the
 * DAO list persists across deployments and devices.
 *
 * Table: dao_registry (app_id, name, network, creator_address, created_at)
 */

import { supabase } from './supabase'
import { getNetwork } from './algorand'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DaoRegistryEntry {
  appId: number
  name: string
  createdAt: string // ISO-8601
  network?: string
  creatorAddress?: string
}

// ─── Read ───────────────────────────────────────────────────────────────────

/** Return all tracked DAOs for the current network, newest first. */
export async function getAllDAOs(): Promise<DaoRegistryEntry[]> {
  const network = getNetwork()

  const { data, error } = await supabase
    .from('dao_registry')
    .select('app_id, name, network, creator_address, created_at')
    .eq('network', network)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[daoRegistry] Failed to fetch DAOs:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    appId: Number(row.app_id),
    name: row.name,
    createdAt: row.created_at,
    network: row.network,
    creatorAddress: row.creator_address,
  }))
}

/** Check if a given appId is already tracked. */
export async function hasDAO(appId: number): Promise<boolean> {
  const { count, error } = await supabase.from('dao_registry').select('app_id', { count: 'exact', head: true }).eq('app_id', appId)

  if (error) return false
  return (count ?? 0) > 0
}

// ─── Write ──────────────────────────────────────────────────────────────────

/** Add a DAO to the registry. Skips if already present (upsert). */
export async function addDAO(appId: number, name: string, creatorAddress?: string): Promise<void> {
  const network = getNetwork()

  const { error } = await supabase.from('dao_registry').upsert(
    {
      app_id: appId,
      name,
      network,
      creator_address: creatorAddress ?? null,
    },
    { onConflict: 'app_id' },
  )

  if (error) {
    console.error('[daoRegistry] Failed to add DAO:', error.message)
  }
}

/** Remove a DAO from the registry by appId. */
export async function removeDAO(appId: number): Promise<void> {
  const { error } = await supabase.from('dao_registry').delete().eq('app_id', appId)

  if (error) {
    console.error('[daoRegistry] Failed to remove DAO:', error.message)
  }
}

// ─── Bulk import ────────────────────────────────────────────────────────────

/**
 * Merge entries from an external source (e.g. static JSON)
 * into the registry without duplicating.
 */
export async function mergeEntries(entries: DaoRegistryEntry[]): Promise<void> {
  const network = getNetwork()

  const rows = entries.map((e) => ({
    app_id: e.appId,
    name: e.name,
    network: e.network ?? network,
    creator_address: e.creatorAddress ?? null,
  }))

  if (rows.length === 0) return

  const { error } = await supabase.from('dao_registry').upsert(rows, { onConflict: 'app_id' })

  if (error) {
    console.error('[daoRegistry] Failed to merge entries:', error.message)
  }
}
