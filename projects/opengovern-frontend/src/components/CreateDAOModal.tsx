import React, { useState } from 'react'
import algosdk from 'algosdk'
import type { CreateDaoForm, DaoTemplate } from '../interfaces/dao'

interface CreateDAOModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: CreateDaoForm) => void
}

const INITIAL_FORM: CreateDaoForm = {
  template: 'whitelist',
  name: '',
  description: '',
  quorum: 3,
  threshold: 51,
  votingDurationMinutes: 1440, // 24 hours
  minimumStake: 1,
  whitelistAddresses: [],
}

// ─── Template definitions ──────────────────────────────────────────────────
const TEMPLATES: {
  id: DaoTemplate
  title: string
  subtitle: string
  icon: string
  color: string
  bullets: string[]
}[] = [
  {
    id: 'whitelist',
    title: 'Whitelist + Self Claim',
    subtitle: 'Add trusted wallets to a list. Members claim their spot themselves.',
    icon: '📋',
    color: '#7c3aed',
    bullets: ['Creator adds wallet addresses once', 'Members join at their own time', 'No double claiming possible'],
  },
  {
    id: 'stake',
    title: 'Stake to Join',
    subtitle: 'Members lock ALGO to join. They get it back when they leave.',
    icon: '🔒',
    color: '#059669',
    bullets: ['Members send minimum ALGO to join', 'Stake locked until they leave', 'Spam-resistant — joining costs money'],
  },
]

const CreateDAOModal: React.FC<CreateDAOModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<CreateDaoForm>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fadeClass, setFadeClass] = useState('animate-fadeIn')
  const [addressInput, setAddressInput] = useState('')
  const [addressError, setAddressError] = useState('')

  const addWhitelistAddress = () => {
    const addr = addressInput.trim()
    if (!addr) return
    // Validate Algorand address
    try {
      algosdk.decodeAddress(addr)
    } catch {
      setAddressError('Invalid Algorand address')
      return
    }
    if (form.whitelistAddresses.includes(addr)) {
      setAddressError('Address already added')
      return
    }
    setForm((prev) => ({ ...prev, whitelistAddresses: [...prev.whitelistAddresses, addr] }))
    setAddressInput('')
    setAddressError('')
  }

  const removeWhitelistAddress = (addr: string) => {
    setForm((prev) => ({ ...prev, whitelistAddresses: prev.whitelistAddresses.filter((a) => a !== addr) }))
  }

  const updateField = <K extends keyof CreateDaoForm>(key: K, value: CreateDaoForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const selectTemplate = (template: DaoTemplate) => {
    updateField('template', template)
    // Fade transition
    setFadeClass('animate-fadeOut')
    setTimeout(() => {
      setStep(2)
      setFadeClass('animate-fadeIn')
    }, 250)
  }

  const goBack = () => {
    setFadeClass('animate-fadeOut')
    setTimeout(() => {
      setStep(1)
      setFadeClass('animate-fadeIn')
    }, 250)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      onSubmit(form)
      setForm(INITIAL_FORM)
      setStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setStep(1)
    onClose()
  }

  const isValid =
    form.name.trim().length > 0 &&
    form.quorum > 0 &&
    form.threshold >= 50 &&
    form.threshold <= 100 &&
    form.votingDurationMinutes > 0 &&
    (form.template !== 'stake' || form.minimumStake > 0)

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const selectedTemplate = TEMPLATES.find((t) => t.id === form.template)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pl-[180px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>

      {/* Modal */}
      <div
        className={`relative panel-web3 bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto ${fadeClass}`}
        style={{ animation: fadeClass === 'animate-fadeIn' ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.25s ease-in' }}
      >
        {/* Step indicator bar */}
        <div className="flex border-b-2 border-black">
          <div
            className={`flex-1 py-3 px-4 font-mono text-[10px] uppercase tracking-widest font-bold text-center border-r border-black/10 ${step === 1 ? 'bg-[#fbbf24] text-black' : 'bg-black/5 text-black/30'}`}
          >
            Step 1 · Membership Model
          </div>
          <div
            className={`flex-1 py-3 px-4 font-mono text-[10px] uppercase tracking-widest font-bold text-center ${step === 2 ? 'bg-[#fbbf24] text-black' : 'bg-black/5 text-black/30'}`}
          >
            Step 2 · Governance Rules
          </div>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-[#7c3aed]">
              {step === 1 ? 'Choose Membership Model' : 'Set Governance Rules'}
            </h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 border-2 border-black bg-white hover:bg-black hover:text-white flex items-center justify-center font-bold transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <div className="w-full h-[2px] bg-black/10 mb-6"></div>

          {/* ─── STEP 1: Template Selection ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-4">Select a membership model for your DAO</p>

              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className="group border-2 border-black bg-white hover:bg-[#f9f9f9] p-6 cursor-pointer transition-all hover:shadow-[6px_6px_0px_#000] hover:-translate-y-1"
                  onClick={() => selectTemplate(t.id)}
                  data-test-id={`template-${t.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 border-2 border-black flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${t.color}15` }}
                    >
                      {t.icon}
                    </div>

                    <div className="flex-1">
                      {/* Title */}
                      <h4 className="text-lg font-extrabold uppercase tracking-tight mb-1" style={{ color: t.color }}>
                        {t.title}
                      </h4>
                      <p className="text-sm text-black/60 mb-3">{t.subtitle}</p>

                      {/* Bullets */}
                      <ul className="space-y-1.5">
                        {t.bullets.map((b, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-black/50">
                            <span className="w-1.5 h-1.5 bg-black/20 shrink-0" style={{ backgroundColor: t.color }}></span>
                            <span className="font-mono text-[11px] uppercase tracking-wider">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Arrow */}
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xl font-bold">→</span>
                    </div>
                  </div>

                  {/* Use button */}
                  <div className="mt-4 flex justify-end">
                    <span
                      className="font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 border-2 border-black bg-white group-hover:text-white transition-colors"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => ((e.currentTarget.style.backgroundColor = t.color), (e.currentTarget.style.color = '#fff'))}
                      onMouseLeave={(e) => (
                        (e.currentTarget.style.backgroundColor = 'transparent'),
                        (e.currentTarget.style.color = '#000')
                      )}
                    >
                      Use this model →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── STEP 2: Configuration Form ────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template badge */}
              {selectedTemplate && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-black text-sm font-bold font-mono uppercase tracking-wider"
                  style={{ backgroundColor: `${selectedTemplate.color}15`, color: selectedTemplate.color }}
                >
                  <span>{selectedTemplate.icon}</span>
                  {selectedTemplate.title}
                  <button
                    type="button"
                    onClick={goBack}
                    className="ml-2 w-5 h-5 border border-black/30 bg-white hover:bg-black hover:text-white flex items-center justify-center text-[10px] font-bold transition-colors"
                    title="Change template"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* DAO Name */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-black/60">DAO Name</label>
                <input
                  type="text"
                  placeholder="My Governance DAO"
                  className="w-full border-2 border-black bg-[#f9f9f9] px-4 py-3 font-mono text-sm outline-none focus:shadow-[4px_4px_0px_#fbbf24] transition-shadow placeholder:text-black/30"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  maxLength={64}
                  required
                  data-test-id="dao-name-input"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-black/60">Description</label>
                <textarea
                  placeholder="A community-governed fund for..."
                  className="w-full border-2 border-black bg-[#f9f9f9] px-4 py-3 font-mono text-sm outline-none focus:shadow-[4px_4px_0px_#fbbf24] transition-shadow h-20 resize-none placeholder:text-black/30"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  maxLength={256}
                  data-test-id="dao-desc-input"
                />
              </div>

              {/* Quorum + Threshold row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Quorum */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-black/60">Quorum</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    className="w-full border-2 border-black bg-[#f9f9f9] px-4 py-3 font-mono text-sm outline-none focus:shadow-[4px_4px_0px_#fbbf24] transition-shadow"
                    value={form.quorum}
                    onChange={(e) => updateField('quorum', parseInt(e.target.value) || 1)}
                    data-test-id="dao-quorum-input"
                  />
                  <p className="font-mono text-[9px] text-black/30 mt-1 uppercase tracking-widest">Min. votes needed</p>
                </div>

                {/* Threshold */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-black/60">Threshold</label>
                    <span className="font-mono text-sm font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 border border-[#7c3aed]/30">
                      {form.threshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={1}
                    className="w-full accent-[#7c3aed] h-2 cursor-pointer"
                    value={form.threshold}
                    onChange={(e) => updateField('threshold', parseInt(e.target.value))}
                    data-test-id="dao-threshold-slider"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-black/30 mt-1 px-1 uppercase tracking-widest">
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Voting Duration */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-black/60">Voting Duration</label>
                  <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
                    {formatDuration(form.votingDurationMinutes)}
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={43200}
                  className="w-full border-2 border-black bg-[#f9f9f9] px-4 py-3 font-mono text-sm outline-none focus:shadow-[4px_4px_0px_#fbbf24] transition-shadow"
                  value={form.votingDurationMinutes}
                  onChange={(e) => updateField('votingDurationMinutes', parseInt(e.target.value) || 1)}
                  data-test-id="dao-duration-input"
                />
                <p className="font-mono text-[9px] text-black/30 mt-1 uppercase tracking-widest">Minutes (max 30 days)</p>
              </div>

              {/* Stake Amount — only for "stake" template */}
              {form.template === 'stake' && (
                <div className="border-2 border-dashed border-[#059669]/40 p-4 bg-[#059669]/5">
                  <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-[#059669]">
                    Minimum Stake (ALGO)
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      className="flex-1 border-2 border-r-0 border-black bg-white px-4 py-3 font-mono text-sm outline-none focus:shadow-[4px_4px_0px_#059669] transition-shadow"
                      value={form.minimumStake}
                      onChange={(e) => updateField('minimumStake', parseFloat(e.target.value) || 0)}
                      data-test-id="dao-stake-input"
                    />
                    <span className="border-2 border-black bg-[#059669] text-white px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest flex items-center">
                      ALGO
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-[#059669]/60 mt-1 uppercase tracking-widest">
                    Members must lock this amount to join. Returned when they leave.
                  </p>
                </div>
              )}

              {/* Whitelist Addresses — only for "whitelist" template */}
              {form.template === 'whitelist' && (
                <div className="border-2 border-dashed border-[#7c3aed]/40 p-4 bg-[#7c3aed]/5">
                  <label className="block font-mono text-[10px] uppercase tracking-widest font-bold mb-2 text-[#7c3aed]">
                    Whitelist Wallet Addresses
                  </label>
                  <p className="font-mono text-[9px] text-[#7c3aed]/60 mb-3 uppercase tracking-widest">
                    Add wallets that can claim membership. You (creator) are auto-included.
                  </p>

                  {/* Add address input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Paste Algorand address…"
                      className="flex-1 border-2 border-black bg-white px-3 py-2 font-mono text-xs outline-none focus:shadow-[3px_3px_0px_#7c3aed] transition-shadow placeholder:text-black/25"
                      value={addressInput}
                      onChange={(e) => {
                        setAddressInput(e.target.value)
                        setAddressError('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addWhitelistAddress()
                        }
                      }}
                      data-test-id="whitelist-address-input"
                    />
                    <button
                      type="button"
                      onClick={addWhitelistAddress}
                      className="border-2 border-black bg-[#7c3aed] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#6d28d9] transition-colors"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Error */}
                  {addressError && <p className="font-mono text-[10px] text-red-600 mb-2">⚠ {addressError}</p>}

                  {/* Address list */}
                  {form.whitelistAddresses.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {form.whitelistAddresses.map((addr, i) => (
                        <div key={i} className="flex items-center justify-between border border-black/20 px-3 py-1.5 bg-white">
                          <span className="font-mono text-[11px] text-black/70 truncate mr-2">
                            {addr.substring(0, 8)}…{addr.substring(addr.length - 6)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeWhitelistAddress(addr)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-300 px-1.5 py-0.5 hover:bg-red-50 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 border border-dashed border-black/15">
                      <span className="font-mono text-[10px] text-black/30 uppercase">No addresses added yet</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-4 pt-4 border-t-2 border-dashed border-black/10">
                <button type="button" onClick={goBack} className="btn-secondary-web3 text-xs px-6 py-2">
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn-primary-web3 text-xs px-6 py-2"
                  disabled={!isValid || isSubmitting}
                  data-test-id="deploy-dao-btn"
                >
                  {isSubmitting ? '⏳ Deploying...' : '🚀 Create DAO'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-8px) scale(0.98); }
        }
      `}</style>
    </div>
  )
}

export default CreateDAOModal
