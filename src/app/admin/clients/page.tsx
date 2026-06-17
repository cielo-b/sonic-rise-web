'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useRole } from '@/hooks/useRole'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, SlidersHorizontal, X,
  ExternalLink, MessageSquare,
  Mail, Phone, CheckCircle, Plus, Send,
  ChevronDown, Calendar, UserPlus
} from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useSendMessage } from '@/lib/queries'
import { toast } from 'sonner'
import { api } from '@/lib/api'

/* ─── Types ─────────────────────────────────────────────────────────────── */
type ClientStatus   = 'Active Now' | 'Idle' | 'Contracted'
type ClientCategory = 'CORPORATE' | 'ARTIST' | 'AGENCY'

interface Client {
  id?:           string
  name:          string
  email:         string
  phone?:        string
  notes?:        string
  company:       string
  category:      ClientCategory
  projects:      number
  lifetimeValue: string
  status:        ClientStatus
  photo:         string
  since:         string
  studioHours:   number
  projectHistory: { name: string; date: string; pct: number; statusLabel: string; color: string }[]
  activityLogs:  { icon: React.ElementType; iconBg: string; iconColor: string; title: string; sub: string }[]
}

/* ─── Static data ────────────────────────────────────────────────────────── */
function categoryChip(cat: ClientCategory) {
  switch (cat) {
    case 'CORPORATE': return 'chip bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
    case 'ARTIST':    return 'chip bg-[#D2BBFF]/10 text-[#D2BBFF] border border-[#D2BBFF]/20'
    case 'AGENCY':    return 'chip bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
  }
}

function statusDot(status: ClientStatus) {
  switch (status) {
    case 'Active Now':  return <><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-[#E4E1EC]">Active Now</span></>
    case 'Contracted':  return <><span className="w-2 h-2 rounded-full bg-green-400" /><span className="text-[#E4E1EC]">Contracted</span></>
    case 'Idle':        return <><span className="w-2 h-2 rounded-full bg-[#929095]/40" /><span className="text-[#929095]">Idle</span></>
  }
}

/* ─── Send Message Modal ─────────────────────────────────────────────────── */
function SendMessageModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  
  const { mutate: sendEmail, isPending } = useSendMessage()

  const handleSend = () => {
    if (!client.id) return
    sendEmail(
      { id: client.id, subject, message },
      {
        onSuccess: () => { setSent(true); toast.success(`Message sent to ${client.name}.`) },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to send message.'),
      },
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-headline text-[#E4E1EC] font-bold">Send Message</h3>
            <p className="text-[#929095] text-xs mt-0.5">To: {client.name} ({client.email})</p>
          </div>
          <button onClick={onClose} disabled={isPending} className="text-[#929095] hover:text-[#E4E1EC] transition-colors disabled:opacity-50"><X size={16} /></button>
        </div>
        {sent ? (
          <div className="p-8 text-center">
            <CheckCircle size={40} className="text-brand-cyan mx-auto mb-3" />
            <p className="text-[#E4E1EC] font-medium mb-1">Email Sent Successfully!</p>
            <p className="text-[#929095] text-sm mb-6">Your message has been delivered to {client.email}</p>
            <button onClick={onClose} className="btn-glass text-sm px-6 py-2">Close</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Subject</label>
              <input disabled={isPending} type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Session follow-up" className="input-studio text-sm disabled:opacity-50" />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Message</label>
              <textarea disabled={isPending} rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message..." className="input-studio text-sm resize-none disabled:opacity-50" />
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button disabled={isPending} onClick={onClose} className="btn-ghost text-sm px-4 py-2 disabled:opacity-50">Cancel</button>
              <button onClick={handleSend} disabled={!subject || !message || isPending} className="btn-primary text-sm px-5 py-2 gap-2 disabled:opacity-50">
                {isPending ? 'Sending...' : <><Send size={13} /> Send Email</>}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ─── Row Action Menu (Portal) ───────────────────────────────────────────── */
function RowActionMenu({
  clientId,
  clientName,
  onClose,
  onAction,
  x, y
}: {
  clientId: string
  clientName: string
  onClose: () => void
  onAction: (id: string, action: string) => void
  x: number; y: number
}) {
  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{ left: x - 160, top: y + 10 }}
        className="fixed z-[101] w-40 bg-[#292932] border border-white/10 rounded-xl shadow-2xl py-1"
      >
        <div className="px-3 py-2 border-b border-white/5 mb-1">
          <p className="text-[10px] font-mono uppercase text-[#929095] tracking-widest truncate">{clientName}</p>
        </div>
        <button onClick={() => onAction(clientId, 'view')} className="w-full text-left px-4 py-2 text-sm text-[#E4E1EC] hover:bg-white/5 transition-colors">
          View Profile
        </button>
        <button onClick={() => onAction(clientId, 'edit')} className="w-full text-left px-4 py-2 text-sm text-[#E4E1EC] hover:bg-white/5 transition-colors">
          Edit Details
        </button>
        <button onClick={() => onAction(clientId, 'delete')} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
          Delete Client
        </button>
      </motion.div>
    </>
  )
}

/* ─── Add Client Modal ───────────────────────────────────────────────────── */

function AddClientModal({ mode = 'create', initialData, onClose }: { mode?: 'create' | 'edit'; initialData?: Client; onClose: () => void }) {
  const { mutate: createClient } = useCreateClient()
  const { mutate: updateClient } = useUpdateClient()
  const [saved, setSaved] = useState(false)

  const [name, setName]         = useState(initialData?.name || '')
  const [company, setCompany]   = useState(initialData?.company || '')
  const [email, setEmail]       = useState(initialData?.email || '')
  const [phone, setPhone]       = useState(initialData?.phone || '')
  const [category, setCategory] = useState<ClientCategory>(initialData?.category || 'CORPORATE')
  const [notes, setNotes]       = useState(initialData?.notes || '')

  const handleSave = () => {
    if (!name || !email) return
    if (mode === 'edit' && initialData?.id) {
      updateClient(
        { id: initialData.id, data: { name, email, company, phone, category, notes } },
        {
          onSuccess: () => { setSaved(true); toast.success('Client profile updated.') },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update client.'),
        },
      )
    } else {
      createClient(
        { name, email, company, phone, category, notes },
        {
          onSuccess: () => { setSaved(true); toast.success('Client profile created.') },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create client.'),
        },
      )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-lg overflow-hidden"
      >
          <div className="px-7 py-5 border-b border-white/10 flex items-center justify-between bg-[#292932]/50">
          <h3 className="font-headline text-[#E4E1EC] text-lg font-bold">{mode === 'edit' ? 'Edit Profile' : 'New Client Profile'}</h3>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors"><X size={16} /></button>
        </div>
        {saved ? (
          <div className="p-10 text-center">
            <CheckCircle size={44} className="text-brand-cyan mx-auto mb-4" />
            <h4 className="font-headline text-xl font-bold text-[#E4E1EC] mb-2">{mode === 'edit' ? 'Profile Updated!' : 'Client Added!'}</h4>
            <p className="text-[#929095] text-sm mb-5">{mode === 'edit' ? 'Changes saved successfully.' : 'Profile created and added to the ecosystem.'}</p>
            <button onClick={onClose} className="btn-primary text-sm px-8 py-2.5">Done</button>
          </div>
        ) : (
          <div className="p-7 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Full Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Elena Vance" className="input-studio text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Company</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Vance Media Group" className="input-studio text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@company.com" className="input-studio text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250 7XX XXX XXX" className="input-studio text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Category</label>
              <div className="relative">
                <select value={category} onChange={e => setCategory(e.target.value as ClientCategory)} className="input-studio text-sm appearance-none pr-9">
                  <option>CORPORATE</option>
                  <option>ARTIST</option>
                  <option>AGENCY</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Initial notes about this client..." className="input-studio text-sm resize-none" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={onClose} className="btn-ghost text-sm px-5 py-2.5">Cancel</button>
              <button onClick={handleSave} disabled={!name || !email} className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50">
                {mode === 'edit' ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ─── Filter Modal ───────────────────────────────────────────────────────── */
function FilterModal({ onClose, onApply }: { onClose: () => void; onApply: (cat: string, status: string) => void }) {
  const [cat, setCat]       = useState('All')
  const [status, setStatus] = useState('All')
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-sm p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-[#E4E1EC] font-bold">Filter Clients</h3>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Category</label>
          <div className="flex flex-wrap gap-2">
            {['All', 'CORPORATE', 'ARTIST', 'AGENCY'].map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${cat === c ? 'bg-[#D2BBFF] text-[#3F008E]' : 'bg-white/5 text-[#929095] hover:bg-white/10'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Status</label>
          <div className="flex flex-wrap gap-2">
            {['All', 'Active Now', 'Contracted', 'Idle'].map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${status === s ? 'bg-brand-cyan text-[#003642]' : 'bg-white/5 text-[#929095] hover:bg-white/10'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => { setCat('All'); setStatus('All') }} className="btn-ghost text-sm flex-1 py-2.5">Reset</button>
          <button onClick={() => { onApply(cat, status); onClose() }} className="btn-primary text-sm flex-1 py-2.5">Apply</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Confirm Modal ──────────────────────────────────────────────────────── */
function ConfirmModal({
  title, message, onConfirm, onCancel, confirmText = 'Confirm', isDestructive = false
}: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText?: string; isDestructive?: boolean
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-card rounded-2xl p-8 max-w-sm w-full border border-white/10 shadow-2xl">
        <h3 className="font-headline text-xl font-bold text-[#E4E1EC] mb-2">{title}</h3>
        <p className="text-[#929095] text-sm mb-8">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm text-[#929095] hover:text-[#E4E1EC] transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${isDestructive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-brand-cyan text-[#004e5f] hover:bg-[#3CD7FF] hover:shadow-[0_0_15px_rgba(60,215,255,0.4)]'}`}>
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Client Profile Modal ───────────────────────────────────────────────── */
function ClientModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [messageOpen, setMessageOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Modal header */}
        <div className="px-7 py-5 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <Image
              src={client.photo}
              alt={client.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-2xl object-cover border border-white/20 flex-shrink-0"
              unoptimized
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-headline text-xl font-bold text-[#E4E1EC]">{client.name}</h3>
                <span className="chip bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 font-mono">
                  ELITE PARTNER
                </span>
              </div>
              <p className="text-[#C8C5CB] text-sm">
                {client.company} · Client since {client.since}
              </p>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="font-mono text-[10px] text-[#D2BBFF] uppercase tracking-wider">Projects</p>
                  <p className="font-headline text-xl font-bold text-[#E4E1EC]">{client.projects}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#D2BBFF] uppercase tracking-wider">Studio Hours</p>
                  <p className="font-headline text-xl font-bold text-[#E4E1EC]">{client.studioHours.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Modal body: 3/5 + 2/5 */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-5">

          {/* Main Info (3/5) */}
          <div className="md:col-span-3 p-7 border-r border-white/8 space-y-8">
            
            {/* Contact Details & Notes */}
            <div className="space-y-4">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#929095] border-b border-white/5 pb-3">
                Client Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1B1B23] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                    <Mail size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#929095] font-mono">Email</p>
                    <p className="text-[#E4E1EC] text-sm font-medium">{client.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-[#1B1B23] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D2BBFF]/10 flex items-center justify-center text-[#D2BBFF]">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#929095] font-mono">Phone</p>
                    <p className="text-[#E4E1EC] text-sm font-medium">{client.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              {client.notes && (
                <div className="bg-[#1B1B23] p-4 rounded-xl border border-white/5 mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-[#929095] font-mono mb-2">Notes</p>
                  <p className="text-[#C8C5CB] text-sm leading-relaxed">{client.notes}</p>
                </div>
              )}
            </div>

            {/* Project History */}
            <div className="space-y-4">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#929095] border-b border-white/5 pb-3">
                Recent Projects
              </h4>
              <div className="space-y-3">
                {client.projectHistory.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#1B1B23] border border-white/5 hover:border-[#D2BBFF]/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-medium text-[#E4E1EC] text-sm">{proj.name}</span>
                      <span className="font-mono text-[10px] text-[#929095]">{proj.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1 rounded-full bg-[#292932] overflow-hidden">
                        <div className={`h-full rounded-full ${proj.color}`} style={{ width: `${proj.pct}%` }} />
                      </div>
                      <span
                        className={`font-mono text-[10px] ${
                          proj.statusLabel === 'COMPLETED' ? 'text-brand-cyan'  :
                          proj.statusLabel.includes('PROGRESS')   ? 'text-[#D2BBFF]'  :
                          'text-[#929095]'
                        }`}
                      >
                        {proj.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Logs (2/5) */}
          <div className="md:col-span-2 p-7 bg-[#0D0E15]/40 flex flex-col">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#929095] border-b border-white/5 pb-3 mb-5">
              Activity Logs
            </h4>
            <div className="flex-1 space-y-5">
              {client.activityLogs.map((log, i) => {
                const Icon = log.icon
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full ${log.iconBg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                        <Icon size={13} className={log.iconColor} />
                      </div>
                      {i < client.activityLogs.length - 1 && (
                        <div className="w-px flex-1 bg-white/5 my-1" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-medium text-[#E4E1EC]">{log.title}</p>
                      <p className="text-[11px] text-[#929095] font-mono mt-0.5">{log.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="pt-5 mt-5 border-t border-white/8">
              <button
                onClick={() => setMessageOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1F1F27] hover:bg-[#292932] text-[#E4E1EC] text-sm font-medium rounded-xl border border-white/8 transition-all"
              >
                <MessageSquare size={14} />
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Send Message sub-modal */}
        <AnimatePresence>
          {messageOpen && <SendMessageModal client={client} onClose={() => setMessageOpen(false)} />}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ClientsPage() {
  const { can }                          = useRole()
  const [selected, setSelected]         = useState<Client | null>(null)
  const [search, setSearch]             = useState('')
  const [filterOpen, setFilterOpen]     = useState(false)
  const [addOpen, setAddOpen]           = useState(false)
  const [editOpen, setEditOpen]         = useState<Client | null>(null)
  const [activeMenu, setActiveMenu]     = useState<{ id: string; x: number; y: number } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [filterCat, setFilterCat]       = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const { data: apiClients } = useClients()
  const { mutate: deleteClient } = useDeleteClient()
  const clientCount = apiClients?.length ?? null

  const handleAction = (id: string, action: string) => {
    setActiveMenu(null)
    const client = mappedClients.find(c => c.id === id)
    if (!client) return

    if (action === 'view') {
      setSelected(client)
    } else if (action === 'edit') {
      setEditOpen(client)
    } else if (action === 'delete') {
      setConfirmDelete({ id: client.id!, name: client.name })
    }
  }

  const handleDelete = () => {
    if (confirmDelete) {
      deleteClient(confirmDelete.id, {
        onSuccess: () => toast.success(`${confirmDelete.name} deleted.`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete client.'),
      })
      setConfirmDelete(null)
    }
  }

  const mappedClients: Client[] = (apiClients || []).map((u: any) => {
    const bookings = u.bookings || []
    
    // Revenue
    const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED')
    const rev = completedBookings.reduce((sum: number, b: any) => sum + Number(b.totalAmount), 0)
    const lifetimeValue = rev > 0 ? new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(rev) : 'RWF 0.00'

    // Project History
    const projectHistory = bookings.slice(0, 5).map((b: any) => {
      let pct = 0;
      let statusLabel = 'PENDING';
      let color = 'bg-[#929095]';
      if (b.status === 'COMPLETED') { pct = 100; statusLabel = 'COMPLETED'; color = 'bg-brand-cyan' }
      else if (b.status === 'CONFIRMED') { pct = 50; statusLabel = 'IN PROGRESS'; color = 'bg-[#D2BBFF]' }
      else if (b.status === 'CANCELLED') { pct = 100; statusLabel = 'CANCELLED'; color = 'bg-red-400' }
      
      return {
        name: b.serviceType + ' Session',
        date: new Date(b.dateTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
        pct,
        statusLabel,
        color
      }
    })

    if (projectHistory.length === 0) {
      projectHistory.push({
        name: 'Account Setup',
        date: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
        pct: 100,
        statusLabel: 'COMPLETED',
        color: 'bg-brand-cyan'
      })
    }

    // Activity Logs
    const activityLogs = bookings.slice(0, 3).map((b: any) => ({
      icon: b.status === 'COMPLETED' ? CheckCircle : Calendar,
      iconBg: b.status === 'COMPLETED' ? 'bg-brand-cyan/20' : 'bg-[#D2BBFF]/20',
      iconColor: b.status === 'COMPLETED' ? 'text-brand-cyan' : 'text-[#D2BBFF]',
      title: `${b.status === 'COMPLETED' ? 'Completed' : 'Booked'} ${b.serviceType}`,
      sub: new Date(b.dateTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }))

    if (activityLogs.length === 0) {
      activityLogs.push({
        icon: UserPlus,
        iconBg: 'bg-brand-cyan/20',
        iconColor: 'text-brand-cyan',
        title: 'Account Created',
        sub: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      })
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      notes: u.notes,
      company: u.company || 'Independent',
      category: (u.category || 'CORPORATE') as ClientCategory,
      projects: bookings.length,
      lifetimeValue,
      status: u.isActive ? 'Active Now' : 'Idle',
      photo: u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(u.name)}`,
      since: new Date(u.createdAt).getFullYear().toString(),
      studioHours: bookings.length * 2,
      projectHistory,
      activityLogs,
    }
  })

  const filtered = mappedClients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.company.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCat === 'All'    || c.category === filterCat
    const matchStatus = filterStatus === 'All' || c.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const hasActiveFilter = filterCat !== 'All' || filterStatus !== 'All'

  return (
    <div className="p-5 md:p-8 min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-[#E4E1EC] text-2xl font-bold tracking-tight">Client Ecosystem</h1>
          <p className="text-[#C8C5CB] text-sm mt-1 max-w-xl">
            Manage your roster of elite artists and corporate partners. Monitor performance, lifecycle value, and studio engagement.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="bg-[#292932] px-4 py-2.5 rounded-xl border border-white/5 text-center">
            <span className="block font-mono text-[10px] text-brand-cyan uppercase tracking-wider">Active Clients</span>
            <span className="block font-headline text-xl font-bold text-[#E4E1EC]">{clientCount ?? '—'}</span>
          </div>
          {can('revenue:view') && (
            <div className="bg-[#292932] px-4 py-2.5 rounded-xl border border-white/5 text-center">
              <span className="block font-mono text-[10px] text-[#D2BBFF] uppercase tracking-wider">Revenue</span>
              <span className="block font-headline text-xl font-bold text-[#E4E1EC]">$2.4M</span>
            </div>
          )}
          {can('clients:write') && (
            <button onClick={() => setAddOpen(true)} className="btn-primary text-sm gap-2 py-2.5 px-4">
              <Plus size={15} /> Add Client
            </button>
          )}
        </div>
      </header>

      {/* ── Search + Filter ───────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#929095]" />
          <input
            type="text"
            placeholder="Search by name, company, or artist handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-studio pl-10 text-sm py-3 w-full"
          />
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className={`glass-card px-5 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm font-mono shrink-0 ${
            hasActiveFilter ? 'border-brand-cyan/40 text-brand-cyan' : 'text-[#C8C5CB] hover:bg-white/10'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filter{hasActiveFilter ? ' ●' : ''}
        </button>
      </div>

      {/* ── CRM Table ─────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-[#292932]/50 border-b border-white/5">
              {['Client', 'Category', 'Total Projects', ...(can('revenue:view') ? ['Lifetime Value'] : []), 'Status', ''].map((col) => (
                <th key={col} className="px-6 py-3 text-left font-mono text-[10px] text-[#929095] uppercase tracking-widest font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((client, i) => (
              <motion.tr
                key={client.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => setSelected(client)}
                className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                {/* Client */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src={client.photo}
                      alt={client.name}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#D2BBFF]/20 flex-shrink-0"
                      unoptimized
                    />
                    <div>
                      <p className="font-medium text-[#E4E1EC] text-sm">{client.name}</p>
                      <p className="text-[#929095] text-xs">{client.company}</p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <span className={categoryChip(client.category)}>{client.category}</span>
                </td>

                {/* Total Projects */}
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-[#E4E1EC]">{client.projects} Projects</span>
                </td>

                {/* Lifetime Value */}
                {can('revenue:view') && (
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-[#E4E1EC]">{client.lifetimeValue}</span>
                  </td>
                )}

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    {statusDot(client.status)}
                  </div>
                </td>

                {/* Action */}
                <td className="px-6 py-4 text-right relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      const rect = e.currentTarget.getBoundingClientRect()
                      setActiveMenu({ id: client.id!, x: rect.left, y: rect.bottom })
                    }}
                    className="text-[#929095] group-hover:text-[#D2BBFF] transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-[#929095] font-mono text-sm uppercase tracking-wider">
            No clients match your search
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selected    && <ClientModal client={selected} onClose={() => setSelected(null)} />}
        {filterOpen  && <FilterModal onClose={() => setFilterOpen(false)} onApply={(cat, st) => { setFilterCat(cat); setFilterStatus(st) }} />}
        {addOpen     && <AddClientModal onClose={() => setAddOpen(false)} />}
        {editOpen    && <AddClientModal mode="edit" initialData={editOpen} onClose={() => setEditOpen(null)} />}
        {confirmDelete && (
          <ConfirmModal
            title="Delete Client"
            message={`Are you sure you want to permanently delete ${confirmDelete.name}? This action cannot be undone.`}
            confirmText="Yes, Delete"
            isDestructive={true}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Row Action Menu via Portal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeMenu && (() => {
            const row = mappedClients.find(c => c.id === activeMenu.id)
            if (!row) return null
            return (
              <RowActionMenu
                key={row.id}
                clientId={row.id!}
                clientName={row.name}
                onClose={() => setActiveMenu(null)}
                onAction={handleAction}
                x={activeMenu.x}
                y={activeMenu.y}
              />
            )
          })()}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
