// ─── Core domain interfaces for the DAO frontend ───────────────────────────

export interface DAO {
  appId: bigint
  name: string
  description: string
  quorum: number
  threshold: number
  votingDuration: number
  treasuryAddress: string
  treasuryBalance?: number
  memberCount: number
  /** 0 = whitelist, 1 = stake */
  membershipType: number
  /** Minimum stake in microAlgos (only for stake mode) */
  minimumStake: number
  /** Creator wallet address */
  creator: string
}

export interface Proposal {
  id: number
  title: string
  description: string
  recipient: string
  amount: number
  remainingAmount: number
  yesVotes: number
  noVotes: number
  deadline: number
  executed: boolean
  passed: boolean
  rageQuitDeadline: number
  status: 'active' | 'passed' | 'rejected' | 'executed'
  userHasVoted?: boolean
}

// ─── Form interfaces ────────────────────────────────────────────────────────

export type DaoTemplate = 'whitelist' | 'stake'

export interface CreateDaoForm {
  template: DaoTemplate
  name: string
  description: string
  quorum: number
  threshold: number
  votingDurationMinutes: number
  /** Only used when template === 'stake' (in ALGO, e.g. 1) */
  minimumStake: number
  /** Only used when template === 'whitelist' — addresses to whitelist on creation */
  whitelistAddresses: string[]
}

export interface CreateProposalForm {
  title: string
  description: string
  recipient: string
  amountAlgo: number
  discussionEnabled: boolean
}

export interface ProposalComment {
  id: number
  daoAppId: number
  proposalIndex: number
  walletAddress: string
  content: string
  createdAt: string
}
