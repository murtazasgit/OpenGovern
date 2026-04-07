import React, { useState } from 'react'
import type { CreateProposalForm } from '../interfaces/dao'

interface CreateProposalModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: CreateProposalForm) => void
}

const INITIAL_FORM: CreateProposalForm = {
  title: '',
  description: '',
  recipient: '',
  amountAlgo: 1,
  discussionEnabled: true,
}

/** Basic check that a string looks like a 58-char Algorand address. */
function isValidAlgoAddress(addr: string): boolean {
  return /^[A-Z2-7]{58}$/.test(addr)
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateProposalForm>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = <K extends keyof CreateProposalForm>(key: K, value: CreateProposalForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      onSubmit(form)
      setForm(INITIAL_FORM)
    } finally {
      setIsSubmitting(false)
    }
  }

  const recipientValid = form.recipient.length === 0 || isValidAlgoAddress(form.recipient)
  const isValid = form.title.trim().length > 0 && isValidAlgoAddress(form.recipient) && form.amountAlgo > 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative panel-web3 bg-white p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Decorative corner */}
        <div className="absolute top-0 right-8 w-6 h-6 border-b-2 border-l-2 border-black bg-[#8b5cf6] transform -translate-y-1/2"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-extrabold uppercase tracking-tight text-[#7c3aed]">New Proposal</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-black bg-white hover:bg-black hover:text-white flex items-center justify-center font-bold transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <div className="w-full h-[2px] bg-black/10 mb-6"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-black/60">Title</label>
            <input
              type="text"
              placeholder="Fund community event"
              className="w-full border-2 border-black bg-[#f9f9f9] px-4 py-3 font-mono text-sm outline-none focus:shadow-[4px_4px_0px_#fbbf24] transition-shadow placeholder:text-black/30"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              maxLength={128}
              required
              data-test-id="proposal-title-input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-black/60">Description</label>
            <textarea
              placeholder="Describe the proposal purpose and how funds will be used..."
              className="w-full border-2 border-black bg-[#f9f9f9] px-4 py-3 font-mono text-sm outline-none focus:shadow-[4px_4px_0px_#fbbf24] transition-shadow h-24 resize-none placeholder:text-black/30"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              maxLength={512}
              data-test-id="proposal-desc-input"
            />
          </div>

          {/* Recipient address */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-black/60">Recipient Address</label>
            <input
              type="text"
              placeholder="ALGO address (58 characters)"
              className={`w-full border-2 bg-[#f9f9f9] px-4 py-3 font-mono text-sm outline-none transition-shadow placeholder:text-black/30 ${
                !recipientValid
                  ? 'border-red-500 shadow-[4px_4px_0px_rgba(255,0,0,0.3)]'
                  : 'border-black focus:shadow-[4px_4px_0px_#fbbf24]'
              }`}
              value={form.recipient}
              onChange={(e) => updateField('recipient', e.target.value.toUpperCase())}
              maxLength={58}
              required
              data-test-id="proposal-recipient-input"
            />
            {!recipientValid && (
              <p className="font-mono text-[10px] text-red-500 mt-1 uppercase tracking-widest font-bold">
                ⚠ Invalid Algorand address format
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-black/60">Amount (ALGO)</label>
            <div className="flex">
              <input
                type="number"
                min={0.001}
                step={0.001}
                className="flex-1 border-2 border-r-0 border-black bg-[#f9f9f9] px-4 py-3 font-mono text-sm outline-none focus:shadow-[4px_4px_0px_#fbbf24] transition-shadow"
                value={form.amountAlgo}
                onChange={(e) => updateField('amountAlgo', parseFloat(e.target.value) || 0)}
                required
                data-test-id="proposal-amount-input"
              />
              <span className="border-2 border-black bg-black text-white px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest flex items-center">
                ALGO
              </span>
            </div>
            <p className="font-mono text-[9px] text-black/30 mt-1 uppercase tracking-widest">
              = {(form.amountAlgo * 1_000_000).toLocaleString()} microAlgo
            </p>
          </div>

          {/* Discussion Toggle */}
          <div className="border-2 border-dashed border-black/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest font-bold text-black/60">Discussion Layer</label>
                <p className="font-mono text-[9px] text-black/30 mt-1 uppercase tracking-widest">
                  Allow DAO members to comment on this proposal
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateField('discussionEnabled', !form.discussionEnabled)}
                className={`relative w-14 h-7 border-2 border-black transition-colors duration-200 ${
                  form.discussionEnabled ? 'bg-[#fbbf24]' : 'bg-gray-200'
                }`}
                data-test-id="discussion-toggle"
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-black transition-transform duration-200 ${
                    form.discussionEnabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest">
              {form.discussionEnabled ? (
                <span className="text-[#059669]">● ON — Members can discuss</span>
              ) : (
                <span className="text-black/30">○ OFF — No discussion</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t-2 border-dashed border-black/10">
            <button type="button" onClick={onClose} className="btn-secondary-web3 text-xs px-6 py-2">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-web3 text-xs px-6 py-2"
              disabled={!isValid || isSubmitting}
              data-test-id="submit-proposal-btn"
            >
              {isSubmitting ? '⏳ ' : ''}Submit Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProposalModal
