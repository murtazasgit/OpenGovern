/**
 * discussions.ts — Supabase-backed discussion layer for proposals.
 *
 * Tables: proposal_discussions, proposal_comments
 */

import { supabase } from './supabase'
import type { ProposalComment } from '../interfaces/dao'

// ─── Discussion Settings ────────────────────────────────────────────────────

/** Enable discussion for a proposal (called when creating a proposal). */
export async function enableDiscussion(daoAppId: number, proposalIndex: number, enabled: boolean): Promise<void> {
  const { error } = await supabase.from('proposal_discussions').upsert(
    {
      dao_app_id: daoAppId,
      proposal_index: proposalIndex,
      enabled,
    },
    { onConflict: 'dao_app_id,proposal_index' },
  )

  if (error) {
    console.error('[discussions] Failed to set discussion:', error.message)
  }
}

/** Check if discussion is enabled for a proposal. */
export async function isDiscussionEnabled(daoAppId: number, proposalIndex: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('proposal_discussions')
    .select('enabled')
    .eq('dao_app_id', daoAppId)
    .eq('proposal_index', proposalIndex)
    .maybeSingle()

  if (error || !data) return false
  return data.enabled
}

/** Batch-check discussion status for multiple proposals. */
export async function getDiscussionStatuses(daoAppId: number, proposalIndexes: number[]): Promise<Record<number, boolean>> {
  if (proposalIndexes.length === 0) return {}

  const { data, error } = await supabase
    .from('proposal_discussions')
    .select('proposal_index, enabled')
    .eq('dao_app_id', daoAppId)
    .in('proposal_index', proposalIndexes)

  if (error || !data) return {}

  const map: Record<number, boolean> = {}
  for (const row of data) {
    map[row.proposal_index] = row.enabled
  }
  return map
}

// ─── Comments ───────────────────────────────────────────────────────────────

/** Fetch all comments for a proposal, newest first. */
export async function getComments(daoAppId: number, proposalIndex: number): Promise<ProposalComment[]> {
  const { data, error } = await supabase
    .from('proposal_comments')
    .select('*')
    .eq('dao_app_id', daoAppId)
    .eq('proposal_index', proposalIndex)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[discussions] Failed to fetch comments:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    daoAppId: row.dao_app_id,
    proposalIndex: row.proposal_index,
    walletAddress: row.wallet_address,
    content: row.content,
    createdAt: row.created_at,
  }))
}

/** Post a new comment (only members should call this). */
export async function postComment(
  daoAppId: number,
  proposalIndex: number,
  walletAddress: string,
  content: string,
): Promise<ProposalComment | null> {
  const { data, error } = await supabase
    .from('proposal_comments')
    .insert({
      dao_app_id: daoAppId,
      proposal_index: proposalIndex,
      wallet_address: walletAddress,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    console.error('[discussions] Failed to post comment:', error.message)
    return null
  }

  return {
    id: data.id,
    daoAppId: data.dao_app_id,
    proposalIndex: data.proposal_index,
    walletAddress: data.wallet_address,
    content: data.content,
    createdAt: data.created_at,
  }
}

/** Get comment count for a proposal. */
export async function getCommentCount(daoAppId: number, proposalIndex: number): Promise<number> {
  const { count, error } = await supabase
    .from('proposal_comments')
    .select('id', { count: 'exact', head: true })
    .eq('dao_app_id', daoAppId)
    .eq('proposal_index', proposalIndex)

  if (error) return 0
  return count ?? 0
}
