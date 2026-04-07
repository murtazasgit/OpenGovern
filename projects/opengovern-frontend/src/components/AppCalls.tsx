import { useWallet } from '@txnlab/use-wallet-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { DaoClient } from '../contracts/DaoClient'
import { getAlgodClient, shortenAddress } from '../utils/algorand'
import type { DaoGlobalState } from '../contracts/DaoClient'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [appIdInput, setAppIdInput] = useState<string>('')
  const [daoInfo, setDaoInfo] = useState<DaoGlobalState | null>(null)
  const { activeAddress } = useWallet()

  const fetchDaoInfo = async () => {
    if (!appIdInput || !activeAddress) return

    setLoading(true)
    setDaoInfo(null)

    try {
      const algod = getAlgodClient()
      const client = new DaoClient(BigInt(appIdInput), algod, activeAddress)
      const state = await client.getGlobalState()
      setDaoInfo(state)
      toast.success(`Fetched DAO: ${state.daoName}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      toast.error(`Error reading DAO: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box bg-base-200">
        <h3 className="font-bold text-lg text-primary">Query DAO Contract</h3>
        <p className="text-sm text-base-content/60 mt-1">Enter a deployed DAO App ID to fetch its global state.</p>
        <br />
        <input
          type="number"
          placeholder="App ID (e.g. 1234)"
          className="input input-bordered bg-base-300 w-full"
          value={appIdInput}
          onChange={(e) => setAppIdInput(e.target.value)}
        />

        {daoInfo && (
          <div className="mt-4 bg-base-300 rounded-lg p-4 text-sm space-y-1">
            <div>
              <span className="text-base-content/50">Name:</span> <span className="font-bold">{daoInfo.daoName}</span>
            </div>
            <div>
              <span className="text-base-content/50">Description:</span> {daoInfo.description}
            </div>
            <div>
              <span className="text-base-content/50">Quorum:</span> {daoInfo.quorum.toString()}
            </div>
            <div>
              <span className="text-base-content/50">Threshold:</span> {daoInfo.threshold.toString()}%
            </div>
            <div>
              <span className="text-base-content/50">Voting Duration:</span> {daoInfo.votingDuration.toString()}s
            </div>
            <div>
              <span className="text-base-content/50">Proposals:</span> {daoInfo.proposalCount.toString()}
            </div>
            <div>
              <span className="text-base-content/50">Members:</span> {daoInfo.totalMembers.toString()}
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={() => setModalState(false)}>
            Close
          </button>
          <button className="btn btn-primary" onClick={fetchDaoInfo} disabled={!appIdInput || !activeAddress || loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Fetch DAO Info'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default AppCalls
