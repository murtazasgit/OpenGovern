import React from 'react'
import type { DAO } from '../interfaces/dao'

interface Props {
  dao: DAO
  onClick: () => void
}

const DAOCard: React.FC<Props> = ({ dao, onClick }) => {
  const memberPercentage = Math.min(100, Math.max(5, (dao.memberCount / (dao.quorum || 1)) * 100))

  return (
    <div
      onClick={onClick}
      className="border border-black bg-white p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors group flex flex-col h-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-[#fef3c7] text-black font-bold text-[10px] px-2 py-1 uppercase tracking-wider">
            APP-{dao.appId.toString()}
          </span>
          <span
            className={`font-bold text-[10px] px-2 py-1 uppercase tracking-wider ${
              dao.membershipType === 0 ? 'bg-[#dbeafe] text-[#1e40af]' : 'bg-[#dcfce7] text-[#166534]'
            }`}
          >
            {dao.membershipType === 0 ? '📋 Whitelist' : '🔒 Stake'}
          </span>
        </div>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Quorum {dao.quorum}</span>
      </div>

      <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-[#7c3aed] transition-colors line-clamp-1">{dao.name}</h3>
      <p className="text-sm text-gray-600 mb-8 flex-grow leading-relaxed line-clamp-2">{dao.description}</p>

      <div className="mt-auto">
        <div className="flex justify-between text-[10px] font-bold tracking-wider mb-2 uppercase">
          <span>Members ({dao.memberCount})</span>
          <span className="text-gray-500">Treasury ({((dao.treasuryBalance ?? 0) / 1_000_000).toLocaleString()} A)</span>
        </div>
        <div className="h-4 w-full bg-gray-300 flex overflow-hidden">
          <div className="h-full bg-[#7c3aed] transition-all duration-1000" style={{ width: `${memberPercentage}%` }}></div>
        </div>
      </div>
    </div>
  )
}

export default DAOCard
