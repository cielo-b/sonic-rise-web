'use client'

import { useState } from 'react'
import { FileText, Plus, Trash2, CheckCircle2, Clock, PenTool, ShieldCheck, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { api, type Contract, type SplitContributor } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { Button, Field, Input, Modal, Select, Textarea } from './ui'
import { SignaturePad } from './SignaturePad'

interface ContractModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  contract?: Contract | null
  onSaved: () => void
  canSign?: boolean
  userName?: string
}

const DEFAULT_TERMS = `1. The parties acknowledge and agree that the master recording and underlying musical composition shall be owned and distributed according to the percentage shares outlined in this Split Sheet.
2. All mechanical, public performance, digital streaming, and sync licensing royalties collected worldwide shall be distributed pro-rata based on these agreed publishing and master shares.
3. This agreement is legally binding upon digital signature by the participating parties.`

export function ContractModal({
  open,
  onClose,
  projectId,
  contract,
  onSaved,
  canSign = true,
  userName = '',
}: ContractModalProps) {
  const isViewing = !!contract

  // Create form state
  const [title, setTitle] = useState(contract?.title ?? 'Official Split Sheet & Royalty Agreement')
  const [trackTitle, setTrackTitle] = useState(contract?.trackTitle ?? '')
  const [contractType, setContractType] = useState(contract?.type ?? 'SONGWRITING_AND_MASTER_SPLIT')
  const [terms, setTerms] = useState(contract?.terms ?? DEFAULT_TERMS)
  const [contributors, setContributors] = useState<SplitContributor[]>(
    contract?.splits ?? [
      { id: '1', name: userName || 'Lead Artist', email: '', role: 'Artist / Songwriter', masterShare: 50, publishingShare: 50, proAffiliation: 'BMI' },
      { id: '2', name: 'Studio Producer', email: '', role: 'Producer / Composer', masterShare: 50, publishingShare: 50, proAffiliation: 'ASCAP' },
    ]
  )
  const [saving, setSaving] = useState(false)
  const [showSignPad, setShowSignPad] = useState(false)
  const [signingContributorId, setSigningContributorId] = useState<string | undefined>(undefined)

  const totalMaster = contributors.reduce((sum, c) => sum + (Number(c.masterShare) || 0), 0)
  const totalPublishing = contributors.reduce((sum, c) => sum + (Number(c.publishingShare) || 0), 0)

  const handleAddContributor = () => {
    setContributors([
      ...contributors,
      {
        id: String(Date.now()),
        name: '',
        email: '',
        role: 'Songwriter',
        masterShare: 0,
        publishingShare: 0,
      },
    ])
  }

  const handleRemoveContributor = (id: string) => {
    if (contributors.length <= 1) return
    setContributors(contributors.filter((c) => c.id !== id))
  }

  const handleUpdateContributor = (id: string, field: keyof SplitContributor, value: string | number) => {
    setContributors(
      contributors.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackTitle.trim()) {
      toast.error('Please specify the track title')
      return
    }
    setSaving(true)
    try {
      await api.contracts.create(projectId, {
        title,
        trackTitle: trackTitle.trim(),
        type: contractType,
        splits: contributors,
        terms,
      })
      toast.success('Music split sheet created')
      onSaved()
      onClose()
    } catch {
      toast.error('Failed to create contract')
    } finally {
      setSaving(false)
    }
  }

  const handleApplySignature = async (signatureData: string) => {
    if (!contract) return
    setSaving(true)
    try {
      await api.contracts.sign(contract.id, {
        signatureData,
        contributorId: signingContributorId,
      })
      toast.success('Digital signature recorded and verified')
      setShowSignPad(false)
      onSaved()
      onClose()
    } catch {
      toast.error('Failed to record signature')
    } finally {
      setSaving(false)
    }
  }

  const whatsappShareText = contract
    ? encodeURIComponent(
        `🎵 *SonicRise Studio Split Sheet*\nTrack: *${contract.trackTitle}*\nStatus: ${
          contract.status === 'SIGNED' ? '✅ Fully Signed & Validated' : '⏳ Pending Signatures'
        }\n\nAgreed Splits:\n${contract.splits
          .map((s) => `• ${s.name} (${s.role}): ${s.masterShare}% Master / ${s.publishingShare}% Publishing`)
          .join('\n')}\n\nManaged securely on SonicRise Studio OS.`
      )
    : ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isViewing ? contract.title : 'Create Music Contract & Split Sheet'}
      wide
      footer={
        isViewing ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <a
              href={`https://wa.me/?text=${whatsappShareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass text-xs py-2 px-3 text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
            >
              <MessageSquare size={14} /> Share Agreement on WhatsApp
            </a>
            <Button variant="glass" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : undefined
      }
    >
      {isViewing ? (
        <div className="space-y-4">
          {/* Header Info */}
          <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-text-muted">Track / Recording</p>
              <p className="text-base font-bold text-text-primary flex items-center gap-2">
                🎵 {contract.trackTitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  contract.status === 'SIGNED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                }`}
              >
                {contract.status === 'SIGNED' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                {contract.status === 'SIGNED' ? 'Fully Executed' : 'Awaiting Signatures'}
              </span>
            </div>
          </div>

          {/* Splits Table */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Agreed Royalty & Publishing Splits
            </p>
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-text-muted">
                    <th className="p-3 font-medium">Contributor</th>
                    <th className="p-3 font-medium">Role</th>
                    <th className="p-3 font-medium text-right">Master %</th>
                    <th className="p-3 font-medium text-right">Publishing %</th>
                    <th className="p-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contract.splits.map((split) => (
                    <tr key={split.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-semibold text-text-primary">
                        {split.name}
                        {split.proAffiliation && (
                          <span className="block text-[10px] text-text-muted font-mono">
                            PRO: {split.proAffiliation} {split.ipiNumber ? `· IPI: ${split.ipiNumber}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-text-muted">{split.role}</td>
                      <td className="p-3 text-right font-mono font-bold text-brand-cyan">
                        {split.masterShare}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-brand-purple">
                        {split.publishingShare}%
                      </td>
                      <td className="p-3 text-center">
                        {split.signedAt ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 size={12} /> Signed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-yellow-400 font-medium">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Terms */}
          {contract.terms && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Terms & Stipulations</p>
              <div className="p-3 rounded-lg border border-white/10 bg-black/30 text-xs text-text-muted whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                {contract.terms}
              </div>
            </div>
          )}

          {/* Digital Signatures Box */}
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/10">
            {/* Staff / Studio Signature */}
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <p className="text-xs font-semibold text-text-muted flex items-center justify-between">
                Studio / Producer
                <ShieldCheck size={14} className="text-brand-cyan" />
              </p>
              {contract.staffSignature ? (
                <div className="space-y-1">
                  <div className="h-11 px-3 py-1 bg-black/40 border border-white/10 rounded-lg flex items-center">
                    {contract.staffSignature.startsWith('data:image') && !contract.staffSignature.includes('AAAABJRU5ErkJggg==') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={contract.staffSignature} alt="Producer Signature" className="h-9 max-w-full object-contain" />
                    ) : (
                      <span className="font-serif italic text-base text-brand-cyan tracking-wider font-semibold">
                        Marcus Vance (Producer)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted font-mono">
                    Signed: {formatDateTime(contract.staffSignedAt!, 'UTC')}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-text-muted italic py-2">Awaiting studio signature</div>
              )}
            </div>

            {/* Client Signature */}
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <p className="text-xs font-semibold text-text-muted flex items-center justify-between">
                Client / Artist
                <ShieldCheck size={14} className="text-emerald-400" />
              </p>
              {contract.clientSignature ? (
                <div className="space-y-1">
                  <div className="h-11 px-3 py-1 bg-black/40 border border-white/10 rounded-lg flex items-center">
                    {contract.clientSignature.startsWith('data:image') && !contract.clientSignature.includes('AAAABJRU5ErkJggg==') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={contract.clientSignature} alt="Client Signature" className="h-9 max-w-full object-contain" />
                    ) : (
                      <span className="font-serif italic text-base text-emerald-400 tracking-wider font-semibold">
                        Nova Sky (Artist)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted font-mono">
                    Signed: {formatDateTime(contract.clientSignedAt!, 'UTC')}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-text-muted italic py-2">Awaiting client signature</div>
              )}
            </div>
          </div>

          {/* Fully executed note OR Sign Pad */}
          {contract.status === 'SIGNED' ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>
                <strong>Split Sheet Validated & Locked.</strong> Both producer and artist signatures are digitally verified and stored.
              </span>
            </div>
          ) : showSignPad ? (
            <SignaturePad
              onSign={handleApplySignature}
              onCancel={() => setShowSignPad(false)}
              signerName={userName}
            />
          ) : (
            canSign && (
              <div className="pt-2 flex justify-end">
                <Button onClick={() => setShowSignPad(true)}>
                  <PenTool size={15} className="mr-1.5" /> Sign This Split Sheet Digitally
                </Button>
              </div>
            )
          )}
        </div>
      ) : (
        /* CREATE MODE FORM */
        <form onSubmit={handleCreateContract} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Document Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Track / Song Title">
              <Input
                placeholder="e.g. Midnight Melody"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Contract Type">
            <Select value={contractType} onChange={(e) => setContractType(e.target.value)}>
              <option value="SONGWRITING_AND_MASTER_SPLIT">Songwriting & Master Recording Splits</option>
              <option value="MASTER_ROYALTY_AGREEMENT">Producer Master Royalty Agreement</option>
              <option value="WORK_FOR_HIRE">Work For Hire / Session Musician Release</option>
            </Select>
          </Field>

          {/* Contributors & Splits Manager */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-primary">
                Contributors & Percentage Allocations
              </label>
              <Button type="button" variant="quiet" size="sm" onClick={handleAddContributor}>
                <Plus size={13} className="mr-1" /> Add Person
              </Button>
            </div>

            <div className="space-y-2.5">
              {contributors.map((c) => (
                <div key={c.id} className="p-3 rounded-xl border border-white/10 bg-white/[0.02] grid gap-2 sm:grid-cols-5 items-center">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={c.name}
                      onChange={(e) => handleUpdateContributor(c.id, 'name', e.target.value)}
                      className="input-studio text-xs w-full mb-1"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Producer, Vocalist)"
                      value={c.role}
                      onChange={(e) => handleUpdateContributor(c.id, 'role', e.target.value)}
                      className="input-studio text-[11px] text-text-muted w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted block">Master %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={c.masterShare}
                      onChange={(e) => handleUpdateContributor(c.id, 'masterShare', Number(e.target.value))}
                      className="input-studio text-xs font-mono w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted block">Publishing %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={c.publishingShare}
                      onChange={(e) => handleUpdateContributor(c.id, 'publishingShare', Number(e.target.value))}
                      className="input-studio text-xs font-mono w-full"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveContributor(c.id)}
                      disabled={contributors.length <= 1}
                      className="p-2 text-text-muted hover:text-rose-400 transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Split Sum Validation Checkers */}
            <div className="flex flex-wrap items-center justify-between text-xs p-2.5 rounded-lg border border-white/10 bg-black/40">
              <span className={totalMaster === 100 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                Total Master: {totalMaster}% {totalMaster === 100 ? '✓' : '(Should equal 100%)'}
              </span>
              <span className={totalPublishing === 100 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                Total Publishing: {totalPublishing}% {totalPublishing === 100 ? '✓' : '(Should equal 100%)'}
              </span>
            </div>
          </div>

          <Field label="Standard Agreement Terms">
            <Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button type="button" variant="glass" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={!trackTitle.trim()}>
              <FileText size={14} className="mr-1" /> Create Split Sheet
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
