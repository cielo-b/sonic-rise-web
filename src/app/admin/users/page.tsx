'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, X, ChevronDown, Search, MoreVertical,
  ShieldCheck, Edit2, XCircle, Mail, Shield, Eye, EyeOff,
  Users, CheckCircle2, Clock, Copy,
} from 'lucide-react'
import { useUsers, useDeactivateUser, useUpdateUser, useDeleteUser } from '@/lib/queries'
import { toast } from 'sonner'
import { api, type ApiUser } from '@/lib/api'

type Role   = 'Super Admin' | 'Client'
type Status = 'Active' | 'Pending' | 'Suspended'

interface AdminUser {
  id:        number | string
  name:      string
  email:     string
  role:      Role
  status:    Status
  lastLogin: string
  initials:  string
  grad:      string
  joinedAt:  string
}

const ROLES: Role[] = ['Super Admin', 'Client']

const ROLE_META: Record<Role, { color: string; description: string }> = {
  'Super Admin': { color: 'bg-[#D2BBFF]/10 text-[#D2BBFF] border border-[#D2BBFF]/20', description: 'Full access to all settings, users, media and billing' },
  'Client':      { color: 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20', description: 'Access to personal analytics, media, bookings and settings' },
}

const STATUS_META: Record<Status, { color: string; dot: string }> = {
  'Active':    { color: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Pending':   { color: 'text-amber-400',   dot: 'bg-amber-400 animate-pulse' },
  'Suspended': { color: 'text-red-400',     dot: 'bg-red-400'     },
}

/* ─── Invite User Modal ──────────────────────────────────────────────────── */
function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: (name: string, email: string, role: Role) => void }) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole]   = useState<Role>('Client')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required.'); return }
    if (!email.trim() || !email.includes('@')) { setError('A valid email is required.'); return }
    setLoading(true)
    try {
      await api.auth.invite(email.trim(), role === 'Super Admin' ? 'SUPERADMIN' : 'CLIENT')
      const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/accept-invite?token=sent&email=${encodeURIComponent(email.trim())}`
      setInviteLink(link)
      onInvited(name.trim(), email.trim(), role)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#292932]/50">
          <div>
            <h3 className="font-headline text-[#E4E1EC] text-lg font-bold">Invite Team Member</h3>
            <p className="font-mono text-[10px] text-brand-cyan uppercase tracking-widest mt-0.5">
              Send an account invitation by email
            </p>
          </div>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice Uwimana"
              className="input-studio text-sm w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@sonicrise.rw"
              className="input-studio text-sm w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === r ? 'border-[#D2BBFF]/40 bg-[#D2BBFF]/5' : 'border-white/8 bg-[#1B1B23] hover:border-white/15'
                  }`}
                >
                  <p className={`font-mono text-xs font-bold mb-0.5 ${role === r ? 'text-[#D2BBFF]' : 'text-[#C8C5CB]'}`}>{r}</p>
                  <p className="font-mono text-[9px] text-[#929095] leading-tight">{ROLE_META[r].description}</p>
                </button>
              ))}
            </div>
          </div>

          {inviteLink ? (
            <div className="space-y-3 pt-2">
              <p className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 size={11} /> Invitation created
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#1B1B23] border border-white/8">
                <p className="font-mono text-[10px] text-[#929095] truncate flex-1">{inviteLink}</p>
                <button onClick={copyLink} className="shrink-0 text-[#929095] hover:text-brand-cyan transition-colors">
                  <Copy size={13} />
                </button>
              </div>
              {copied && <p className="font-mono text-[10px] text-brand-cyan">Copied to clipboard!</p>}
              <button onClick={onClose} className="btn-primary text-sm w-full py-2.5">Done</button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost text-sm flex-1 py-2.5">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary text-sm flex-1 py-2.5 gap-2 disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Generating…
                  </span>
                ) : <><Mail size={14} /> Send Invitation</>}
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ─── Edit User Modal ────────────────────────────────────────────────────── */
function EditUserModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (data: { name: string, email: string, role: Role, password?: string }) => void }) {
  const [role, setRole] = useState<Role>(user.role)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-md overflow-hidden my-8"
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#292932]/50">
          <div>
            <h3 className="font-headline text-[#E4E1EC] text-lg font-bold">Edit User</h3>
            <p className="font-mono text-[10px] text-[#929095] mt-0.5">{user.name}</p>
          </div>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-studio text-sm w-full" />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-studio text-sm w-full" />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">New Password <span className="lowercase opacity-50">(optional)</span></label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="Leave blank to keep unchanged" value={password} onChange={e => setPassword(e.target.value)} className="input-studio text-sm w-full pr-10" />
              <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] hover:text-[#E4E1EC] transition-colors">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === r ? 'border-[#D2BBFF]/40 bg-[#D2BBFF]/5' : 'border-white/8 bg-[#1B1B23] hover:border-white/15'
                  }`}
                >
                  <p className={`font-mono text-xs font-bold mb-0.5 ${role === r ? 'text-[#D2BBFF]' : 'text-[#C8C5CB]'}`}>{r}</p>
                  <p className="font-mono text-[9px] text-[#929095] leading-tight">{ROLE_META[r].description}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button onClick={onClose} className="btn-ghost text-sm flex-1 py-2.5">Cancel</button>
            <button onClick={() => onSave({ name, email, role, password })} className="btn-primary text-sm flex-1 py-2.5">Save Details</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Row Action Menu ────────────────────────────────────────────────────── */
function UserActionMenu({
  user, onEdit, onSuspend, onRemove, onClose,
}: {
  user: AdminUser
  onEdit: () => void
  onSuspend: () => void
  onRemove: () => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-30 mt-1 w-48 glass-card rounded-xl overflow-hidden shadow-2xl border border-white/10"
    >
      <div className="px-4 py-2.5 border-b border-white/10">
        <p className="font-mono text-[10px] text-[#929095] truncate">{user.email}</p>
      </div>
      <button
        onClick={() => { onEdit(); onClose() }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C8C5CB] hover:bg-white/5 transition-colors"
      >
        <Edit2 size={13} /> Edit User
      </button>
      <button
        onClick={() => { onSuspend(); onClose() }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${
          user.status === 'Suspended' ? 'text-emerald-400' : 'text-amber-400'
        }`}
      >
        {user.status === 'Suspended' ? <><CheckCircle2 size={13} /> Reactivate</> : <><XCircle size={13} /> Suspend</>}
      </button>
      {user.role !== 'Super Admin' && (
        <button
          onClick={() => { onRemove(); onClose() }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/5 transition-colors border-t border-white/8"
        >
          <X size={13} /> Remove User
        </button>
      )}
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
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card rounded-2xl p-8 max-w-sm w-full border border-white/10 shadow-2xl">
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

/* ═══════════════════════════════════════════════════════════════════════════ */
const GRAD_POOL = [
  'from-[#7C3AED] to-[#6001D1]', 'from-[#000d12] to-[#3CD7FF]',
  'from-[#D4AF37] to-[#D2BBFF]', 'from-[#47464B] to-[#7B797E]',
  'from-[#6001D1] to-[#D2BBFF]',
]

function apiToAdminUser(u: ApiUser, i: number): AdminUser {
  return {
    id:        u.id,
    name:      u.name,
    email:     u.email,
    role:      u.role === 'SUPERADMIN' ? 'Super Admin' : 'Client',
    status:    u.isActive ? 'Active' : 'Suspended',
    lastLogin: 'Recently',
    initials:  u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(),
    grad:      GRAD_POOL[i % GRAD_POOL.length],
    joinedAt:  new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  }
}

export default function UsersPage() {
  const { data: apiUsers = [], isLoading } = useUsers()
  const { mutate: deactivate } = useDeactivateUser()
  const { mutate: updateUser } = useUpdateUser()
  const { mutate: deleteUser } = useDeleteUser()

  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<AdminUser>>>({})
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editUser, setEditUser]   = useState<AdminUser | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | number | null>(null)
  const [search, setSearch]       = useState('')
  const [pendingInvites, setPendingInvites] = useState<AdminUser[]>([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [confirmAction, setConfirmAction] = useState<{
    type: 'Suspend' | 'Reactivate' | 'Remove',
    user: AdminUser
  } | null>(null)

  const users: AdminUser[] = useMemo(() => {
    const fromApi = apiUsers.map((u, i) => ({ ...apiToAdminUser(u, i), ...localOverrides[i] }))
    return [...fromApi, ...pendingInvites]
  }, [apiUsers, localOverrides, pendingInvites])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const currentUsers = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  function handleInvited(name: string, email: string, role: Role) {
    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    const newUser: AdminUser = {
      id: Date.now(), name, email, role,
      status: 'Pending', lastLogin: 'Never',
      initials, grad: 'from-[#47464B] to-[#7B797E]',
      joinedAt: 'Invited',
    }
    setPendingInvites((prev) => [...prev, newUser])
    setInviteOpen(false)
    toast.success(`Invitation sent to ${email}`)
  }

  function handleSaveUser(userId: string | number, data: { name: string, email: string, role: Role, password?: string }) {
    if (typeof userId === 'string') {
      const payload: any = { 
        name: data.name, 
        email: data.email, 
        role: data.role === 'Super Admin' ? 'SUPERADMIN' : 'CLIENT' 
      }
      if (data.password) payload.password = data.password
      updateUser({ id: userId, data: payload })
    }
    setLocalOverrides((prev) => ({ ...prev, [userId]: { ...prev[userId], name: data.name, email: data.email, role: data.role } }))
    setEditUser(null)
    toast.success('User updated successfully')
  }

  function handleSuspend(userId: string | number) {
    const u = users.find((u) => u.id === userId)
    if (!u) return
    const apiUser = apiUsers.find((apiU) => apiU.id === userId)
    if (apiUser) {
      if (u.status === 'Suspended') updateUser({ id: apiUser.id, data: { isActive: true } })
      else deactivate(apiUser.id)
    }
    setLocalOverrides((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], status: (u.status === 'Suspended' ? 'Active' : 'Suspended') as Status },
    }))
    toast.success(u.status === 'Suspended' ? `${u.name} reactivated` : `${u.name} suspended`)
  }

  function handleRemove(userId: string | number) {
    const u = users.find((u) => u.id === userId)
    if (typeof userId === 'string') {
      deleteUser(userId)
    } else {
      setPendingInvites((prev) => prev.filter((p) => p.id !== userId))
    }
    toast.success(`${u?.name} removed`)
  }

  const statCards = [
    { label: 'Total Users',   value: users.length,                              icon: Users,        color: 'text-[#D2BBFF]', bg: 'bg-[#D2BBFF]/10' },
    { label: 'Active',        value: users.filter((u) => u.status === 'Active').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending Invites', value: users.filter((u) => u.status === 'Pending').length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Admins',        value: users.filter((u) => u.role === 'Super Admin').length, icon: Shield, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10' },
  ]

  return (
    <div className="p-5 md:p-8 min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-[#E4E1EC] text-2xl font-bold tracking-tight">Team & Users</h1>
          <p className="text-[#C8C5CB] text-sm mt-1">Manage admin accounts, roles and access permissions.</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="btn-primary text-sm gap-2 py-2.5 px-5 self-start sm:self-auto"
        >
          <UserPlus size={15} /> Invite User
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="glass-card p-5 rounded-xl">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-4`}>
                <Icon size={17} className={card.color} />
              </div>
              <p className="font-headline text-2xl font-bold text-[#E4E1EC] mb-1">{card.value}</p>
              <p className="font-mono text-[10px] text-[#929095] uppercase tracking-widest">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* ── User table ──────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl relative">

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3 rounded-t-2xl bg-[#0D0E15]/20">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929095]" />
            <input
              type="text"
              placeholder="Search by name, email or role…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="input-studio pl-9 text-sm py-2 w-full"
            />
          </div>
          <div className="relative">
            <select className="input-studio text-sm py-2 pr-8 appearance-none cursor-pointer">
              <option>All Roles</option>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#929095] pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto sm:overflow-visible">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-[#47464B]/20 bg-[#0D0E15]/50">
                {['User', 'Role', 'Status', 'Last Login', 'Joined', ''].map((col) => (
                  <th key={col} className="px-6 py-3 text-left font-mono text-[10px] text-[#929095] uppercase tracking-widest font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout" initial={false}>
                {currentUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-[#47464B]/10 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.grad} flex items-center justify-center shrink-0`}>
                          <span className="font-mono text-[11px] font-bold text-white">{user.initials}</span>
                        </div>
                        <div>
                          <p className="text-[#E4E1EC] text-sm font-medium">{user.name}</p>
                          <p className="text-[#929095] text-xs font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`chip text-xs ${ROLE_META[user.role].color}`}>
                        {user.role === 'Super Admin' && <ShieldCheck size={11} className="mr-1" />}
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_META[user.status].dot}`} />
                        <span className={`text-sm font-mono ${STATUS_META[user.status].color}`}>{user.status}</span>
                      </div>
                    </td>

                    {/* Last login */}
                    <td className="px-6 py-4 text-[#929095] text-sm font-mono">{user.lastLogin}</td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-[#929095] text-xs font-mono">{user.joinedAt}</td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                          className="text-[#929095] hover:text-[#C8C5CB] transition-colors p-1"
                        >
                          <MoreVertical size={15} />
                        </button>
                        <AnimatePresence>
                          {activeMenu === user.id && (
                            <UserActionMenu
                              user={user}
                              onEdit={() => setEditUser(user)}
                              onSuspend={() => setConfirmAction({ type: user.status === 'Suspended' ? 'Reactivate' : 'Suspend', user })}
                              onRemove={() => setConfirmAction({ type: 'Remove', user })}
                              onClose={() => setActiveMenu(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-[#929095] font-mono text-sm uppercase tracking-wider">
              No users match your search
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1B1B23] border-t border-white/8 flex items-center justify-between rounded-b-2xl">
          <p className="text-[#929095] font-mono text-xs">
            {filtered.length > 0 ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} users` : 'No users'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-[#E4E1EC] disabled:opacity-30 transition-colors hover:bg-white/10"
            >
              Prev
            </button>
            <span className="text-[#929095] text-xs font-mono px-2">{currentPage} / {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-[#E4E1EC] disabled:opacity-30 transition-colors hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Permission reference ─────────────────────────────────────────── */}
      <div className="mt-6 glass-card rounded-xl p-6">
        <h3 className="font-headline text-[#E4E1EC] text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield size={14} className="text-brand-cyan" />
          Role Permissions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES.map((role) => (
            <div key={role} className="bg-[#1B1B23] rounded-xl p-4 border border-white/5">
              <span className={`chip text-xs mb-3 inline-flex ${ROLE_META[role].color}`}>{role}</span>
              <p className="text-[#929095] text-xs leading-relaxed">{ROLE_META[role].description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {inviteOpen && (
          <InviteModal onClose={() => setInviteOpen(false)} onInvited={handleInvited} />
        )}
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={(data) => handleSaveUser(editUser.id, data)}
          />
        )}
        {confirmAction && (
          <ConfirmModal
            title={`${confirmAction.type} User`}
            message={`Are you sure you want to ${confirmAction.type.toLowerCase()} ${confirmAction.user.name}?`}
            confirmText={confirmAction.type}
            isDestructive={confirmAction.type === 'Remove' || confirmAction.type === 'Suspend'}
            onCancel={() => setConfirmAction(null)}
            onConfirm={() => {
              if (confirmAction.type === 'Remove') handleRemove(confirmAction.user.id);
              else handleSuspend(confirmAction.user.id);
              setConfirmAction(null);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
