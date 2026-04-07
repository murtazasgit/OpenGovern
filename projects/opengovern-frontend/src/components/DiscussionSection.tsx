import React, { useCallback, useEffect, useState } from 'react'
import type { ProposalComment } from '../interfaces/dao'
import { getComments, postComment } from '../utils/discussions'
import { shortenAddress } from '../utils/algorand'

interface DiscussionSectionProps {
  daoAppId: number
  proposalIndex: number
  walletAddress: string | null
  isMember: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const DiscussionSection: React.FC<DiscussionSectionProps> = ({ daoAppId, proposalIndex, walletAddress, isMember }) => {
  const [comments, setComments] = useState<ProposalComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const loadComments = useCallback(async () => {
    setLoading(true)
    const data = await getComments(daoAppId, proposalIndex)
    setComments(data)
    setLoading(false)
  }, [daoAppId, proposalIndex])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handlePost = async () => {
    if (!walletAddress || !newComment.trim()) return
    setPosting(true)
    const comment = await postComment(daoAppId, proposalIndex, walletAddress, newComment)
    if (comment) {
      setComments((prev) => [...prev, comment])
      setNewComment('')
    }
    setPosting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handlePost()
    }
  }

  return (
    <div className="border-t-2 border-dashed border-black/10 mt-4 pt-3">
      {/* Toggle header */}
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 w-full text-left group">
        <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-black/50 group-hover:text-[#7c3aed] transition-colors">
          💬 Discussion
        </span>
        <span className="bg-black/10 text-black/60 text-[10px] font-mono font-bold px-2 py-0.5">{comments.length}</span>
        <span className="ml-auto text-[10px] font-mono text-black/30">{isOpen ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
      </button>

      {/* Collapsible thread */}
      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Comments list */}
          {loading ? (
            <div className="text-center py-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-black/40 animate-pulse">Loading discussion...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-black/10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-black/30">
                No comments yet. Be the first to discuss.
              </span>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {comments.map((c) => (
                <div key={c.id} className="group/comment">
                  <div className="flex items-start gap-3 p-3 bg-[#f9f9f9] border border-black/10 hover:border-black/20 transition-colors">
                    {/* Avatar placeholder */}
                    <div className="w-7 h-7 bg-[#7c3aed] border border-black flex items-center justify-center text-white font-bold text-[10px] shrink-0 mt-0.5">
                      {c.walletAddress.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold text-black/70 uppercase tracking-wider">
                          {shortenAddress(c.walletAddress)}
                        </span>
                        <span className="font-mono text-[9px] text-black/30 uppercase tracking-widest">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-black/80 leading-relaxed break-words whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          {isMember && walletAddress ? (
            <div className="flex gap-2 mt-2">
              <div className="w-7 h-7 bg-[#fbbf24] border border-black flex items-center justify-center text-black font-bold text-[10px] shrink-0">
                {walletAddress.slice(0, 2)}
              </div>
              <div className="flex-1 flex border-2 border-black bg-white focus-within:shadow-[3px_3px_0px_#fbbf24] transition-shadow">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 font-mono text-sm outline-none resize-none bg-transparent placeholder:text-black/30"
                  rows={1}
                  maxLength={2000}
                  disabled={posting}
                />
                <button
                  onClick={handlePost}
                  disabled={!newComment.trim() || posting}
                  className="px-3 bg-black text-white font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#7c3aed] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  {posting ? '...' : 'SEND'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 border border-dashed border-black/10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-black/30">
                {!walletAddress ? '🔒 Connect wallet to comment' : '🔒 Join the DAO to participate in discussion'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DiscussionSection
