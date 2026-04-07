import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { DAO } from '../interfaces/dao'
import { DaoClient } from '../contracts/DaoClient'
import { getAlgodClient } from '../utils/algorand'
import DAODashboard from '../components/DAODashboard'
import algosdk from 'algosdk'

const DAOPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>()
  const [dao, setDao] = useState<DAO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const algod = getAlgodClient()
        const id = BigInt(appId)
        const client = new DaoClient(id, algod, '')
        const state = await client.getGlobalState()

        const treasuryAddress = algosdk.getApplicationAddress(id).toString()

        let treasuryBalance = 0
        try {
          const accInfo = await algod.accountInformation(treasuryAddress).do()
          treasuryBalance = Number((accInfo as any).amount)
        } catch {}

        setDao({
          appId: id,
          name: state.daoName,
          description: state.description,
          quorum: Number(state.quorum),
          threshold: Number(state.threshold),
          votingDuration: Number(state.votingDuration),
          treasuryAddress,
          treasuryBalance,
          memberCount: Number(state.totalMembers),
          membershipType: Number(state.membershipType),
          minimumStake: Number(state.minimumStake),
          creator: state.creator,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load DAO')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [appId])

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <span className="animate-pulse bg-black text-white px-6 py-3 font-mono text-sm uppercase shadow-[2px_2px_0_rgba(251,191,36,0.8)] tracking-widest">
          Loading DAO...
        </span>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error || !dao) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="panel-web3 bg-white p-12">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-red-500 mb-2">Failed to load DAO</h2>
          <p className="text-sm text-black/50 font-mono">{error ?? `Could not find DAO with App ID ${appId}`}</p>
          <Link to="/" className="btn-primary-web3 text-xs px-6 py-2 mt-6 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto pt-2 mb-4">
        <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-black/50">
          <Link to="/" className="hover:text-[#7c3aed] transition-colors underline">
            Home
          </Link>
          <span>/</span>
          <span className="text-black font-bold">{dao.name}</span>
        </div>
      </div>

      <DAODashboard dao={dao} />
    </div>
  )
}

export default DAOPage
