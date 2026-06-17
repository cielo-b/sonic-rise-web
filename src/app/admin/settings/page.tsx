'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRole } from '@/hooks/useRole'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SlidersHorizontal, ShieldCheck,
  Eye, EyeOff, Smartphone,
  Monitor, LogOut, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { useMe, QK } from '@/lib/queries'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import { EASE } from '@/lib/motion'

type Tab = 'General' | 'Security'

const TABS: { id: Tab; icon: React.ElementType }[] = [
  { id: 'General',  icon: SlidersHorizontal },
  { id: 'Security', icon: ShieldCheck       },
]

const GEAR = ['SSL 4000 G+', 'Neve 1073', 'U87 Ai', 'Focal Trio11']

const TEAM = [
  { initials: 'JA', name: 'Jean-Luc Amahoro', role: 'Lead Engineer',   badge: 'Admin',  badgeColor: 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'  },
  { initials: 'MU', name: 'Marie Uwase',       role: 'Production Mgr', badge: 'Editor', badgeColor: 'bg-white/10 text-[#C8C5CB] border border-white/10'              },
]

const ACTIVE_SESSIONS = [
  { device: 'Chrome on macOS',  location: 'Kigali, RW', time: 'Now — current session', icon: Monitor,  current: true  },
  { device: 'Safari on iPhone', location: 'Kigali, RW', time: '2 hours ago',           icon: Smartphone, current: false },
]

const LOGIN_HISTORY = [
  { event: 'Login',          device: 'Chrome on macOS',  time: 'Today, 09:14',     status: 'success' },
  { event: 'Login',          device: 'Safari on iPhone', time: 'Today, 07:02',     status: 'success' },
  { event: 'Failed attempt', device: 'Unknown',          time: 'Yesterday, 23:51', status: 'warning' },
  { event: 'Login',          device: 'Chrome on macOS',  time: 'Oct 28, 18:30',    status: 'success' },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminSettingsPage() {
  const { role }                  = useRole()
  const { data: me }              = useMe()
  const [activeTab, setActiveTab] = useState<Tab>('General')
  const [showPass, setShowPass]   = useState(false)
  const [saving, setSaving]       = useState(false)

  const [profileName,  setProfileName]  = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profilePhone, setProfilePhone] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 2FA state
  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'setup' | 'verify-enable' | 'verify-disable'>('idle')
  const [twoFaQr, setTwoFaQr] = useState('')
  const [twoFaCode, setTwoFaCode] = useState('')
  const [twoFaError, setTwoFaError] = useState('')
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)

  const qc = useQueryClient()

  // Sessions
  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.sessions.list(),
    staleTime: 30_000,
  })

  // Login history
  const { data: loginHistory = [] } = useQuery({
    queryKey: ['loginHistory'],
    queryFn: () => api.loginHistory.list(),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (me) {
      setProfileName(me.name)
      setProfileEmail(me.email)
      setProfilePhone(me.phone ?? '')
    }
  }, [me])

  const visibleTabs = TABS


  async function handleSave() {
    setSaving(true)
    try {
      await api.users.update({ name: profileName, phone: profilePhone || undefined })
      qc.invalidateQueries({ queryKey: QK.me })
      toast.success('Profile saved.')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save profile.')
    } finally { setSaving(false) }
  }

  async function handlePasswordUpdate() {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Passwords do not match or are empty.')
      return
    }
    setSaving(true)
    try {
      await api.users.update({ password: newPassword })
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated.')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  async function handle2FASetup() {
    setTwoFaError('')
    try {
      const res = await api.twofa.setup()
      setTwoFaQr(res.qrDataUrl)
      setTwoFaStep('setup')
    } catch (e: any) {
      setTwoFaError(e.message || 'Failed to generate 2FA secret')
    }
  }

  async function handle2FAEnable() {
    setTwoFaError('')
    try {
      await api.twofa.enable(twoFaCode)
      setTwoFaEnabled(true)
      setTwoFaStep('idle')
      setTwoFaCode('')
      toast.success('Two-factor authentication enabled.')
    } catch (e: any) {
      const msg = e.message || 'Invalid code.'
      setTwoFaError(msg)
      toast.error(msg)
    }
  }

  async function handle2FADisable() {
    setTwoFaError('')
    try {
      await api.twofa.disable(twoFaCode)
      setTwoFaEnabled(false)
      setTwoFaStep('idle')
      setTwoFaCode('')
      toast.success('Two-factor authentication disabled.')
    } catch (e: any) {
      const msg = e.message || 'Invalid code.'
      setTwoFaError(msg)
      toast.error(msg)
    }
  }

  async function handleRevokeSession(id: string) {
    try {
      await api.sessions.revoke(id)
      refetchSessions()
      toast.success('Session revoked.')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to revoke session.')
    }
  }

  async function handleRevokeAll() {
    try {
      await api.sessions.revokeAll()
      refetchSessions()
      toast.success('All other sessions signed out.')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to sign out sessions.')
    }
  }

  return (
    <div className="p-5 md:p-8 min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex items-end justify-between mb-10">
        <div>
          <h2 className="font-headline text-3xl font-bold text-text-primary">Settings</h2>
          <p className="text-text-muted text-sm mt-1">Manage your profile and account security.</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <p className="font-mono text-xs font-medium text-[#E4E1EC]">{me?.name || 'Loading...'}</p>
            <p className="font-mono text-[10px] text-brand-cyan uppercase tracking-wider">{role}</p>
          </div>
          {me?.avatarUrl ? (
            <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10">
              <img src={me.avatarUrl} alt="Profile" className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full bg-brand-purple/30 border border-white/10 flex items-center justify-center font-headline font-bold text-[#D2BBFF] text-sm">
              {me?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
      </header>

      {/* ── Bento grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left nav ──────────────────────────────────────────────────── */}
        <nav className="lg:col-span-3 space-y-1">
          {visibleTabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-all border ${
                activeTab === id
                  ? 'bg-[#292932] border-white/10 text-[#D2BBFF]'
                  : 'border-transparent text-[#929095] hover:bg-white/5 hover:border-white/8 hover:text-[#E4E1EC]'
              }`}
            >
              <Icon size={16} className={activeTab === id ? 'text-[#D2BBFF]' : 'text-[#929095]'} />
              {id}
            </button>
          ))}
        </nav>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-9 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="space-y-6"
            >

              {/* ── General ─────────────────────────────────────────────── */}
              {activeTab === 'General' && (
                <>
                  <div className="glass-card rounded-xl p-6 space-y-5">
                    <h3 className="font-headline text-[#D2BBFF] text-lg font-semibold">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Full Name</label>
                        <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="input-studio text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Email</label>
                        <input type="email" value={profileEmail} readOnly className="input-studio text-sm opacity-60 cursor-not-allowed" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Phone</label>
                        <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+250 700 000 000" className="input-studio text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Role</label>
                        <input type="text" value={role} readOnly className="input-studio text-sm opacity-60 cursor-not-allowed" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-6 py-2.5 ml-auto disabled:opacity-60">
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Security ────────────────────────────────────────────── */}
              {activeTab !== 'General' && (
                <div className="space-y-6">

                  {/* Password reset */}
                  <div className="glass-card rounded-xl p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-purple/10 flex items-center justify-center">
                        <ShieldCheck size={16} className="text-brand-purple" />
                      </div>
                      <h3 className="font-headline text-[#D2BBFF] text-lg font-semibold">Password</h3>
                    </div>
                    <div className="space-y-3 max-w-md">
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">New Password</label>
                        <div className="relative">
                          <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="input-studio text-sm pr-10" />
                          <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] hover:text-[#E4E1EC] transition-colors">
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Confirm New Password</label>
                        <div className="relative">
                          <input type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="input-studio text-sm pr-10" />
                          <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] hover:text-[#E4E1EC] transition-colors">
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={handlePasswordUpdate} disabled={saving} className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60">{saving ? 'Updating...' : 'Update Password'}</button>
                  </div>

                  {/* Two-factor auth */}
                  <div className="glass-card rounded-xl p-6 space-y-4">
                    <h3 className="font-headline text-[#D2BBFF] text-lg font-semibold">Two-Factor Authentication</h3>
                    <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                          <Smartphone size={18} className="text-brand-cyan" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#E4E1EC]">Authenticator App</p>
                          <p className="text-[11px] text-[#929095] mt-0.5">{twoFaEnabled ? '2FA is active on your account' : 'Google Authenticator or Authy'}</p>
                        </div>
                      </div>
                      {twoFaEnabled ? (
                        <button onClick={() => { setTwoFaStep('verify-disable'); setTwoFaError(''); setTwoFaCode('') }}
                          className="px-5 py-2 rounded-lg font-mono text-xs font-bold bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                          ✓ Enabled — Disable
                        </button>
                      ) : (
                        <button onClick={handle2FASetup} className="px-5 py-2 rounded-lg font-mono text-xs font-bold bg-brand-cyan text-[#003642] hover:shadow-[0_0_15px_rgba(60,215,255,0.4)] transition-all">
                          Enable
                        </button>
                      )}
                    </div>

                    {/* Setup: show QR code */}
                    {twoFaStep === 'setup' && (
                      <div className="bg-[#1B1B23] rounded-xl p-5 border border-white/5 space-y-4">
                        <p className="font-mono text-[10px] text-brand-cyan uppercase tracking-wider">Scan with your authenticator app</p>
                        {twoFaQr && <img src={twoFaQr} alt="QR Code" className="w-40 h-40 rounded-lg" />}
                        <div className="space-y-2">
                          <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Enter 6-digit code to verify</label>
                          <input type="text" maxLength={6} value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} placeholder="000000" className="input-studio text-sm w-40 font-mono tracking-widest" />
                        </div>
                        {twoFaError && <p className="text-red-400 text-xs font-mono">{twoFaError}</p>}
                        <div className="flex gap-3">
                          <button onClick={handle2FAEnable} className="btn-primary text-sm px-5 py-2">Confirm & Enable</button>
                          <button onClick={() => { setTwoFaStep('idle'); setTwoFaCode('') }} className="btn-glass text-sm px-5 py-2">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Disable: ask for code */}
                    {twoFaStep === 'verify-disable' && (
                      <div className="bg-[#1B1B23] rounded-xl p-5 border border-red-500/20 space-y-3">
                        <p className="font-mono text-[10px] text-red-400 uppercase tracking-wider">Enter your authenticator code to disable 2FA</p>
                        <input type="text" maxLength={6} value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} placeholder="000000" className="input-studio text-sm w-40 font-mono tracking-widest" />
                        {twoFaError && <p className="text-red-400 text-xs font-mono">{twoFaError}</p>}
                        <div className="flex gap-3">
                          <button onClick={handle2FADisable} className="px-5 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 border border-red-500/30 font-mono">Disable 2FA</button>
                          <button onClick={() => { setTwoFaStep('idle'); setTwoFaCode('') }} className="btn-glass text-sm px-5 py-2">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active sessions */}
                  <div className="glass-card rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline text-[#D2BBFF] text-lg font-semibold">Active Sessions</h3>
                      {sessions.length > 1 && (
                        <button onClick={handleRevokeAll} className="font-mono text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                          <LogOut size={12} /> Sign out everywhere
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {sessions.length === 0 && <p className="text-[#929095] text-sm">No active sessions found.</p>}
                      {sessions.map((session, i) => (
                        <div key={session.id} className={`flex items-center justify-between p-4 rounded-xl border ${i === 0 ? 'border-brand-cyan/20 bg-brand-cyan/5' : 'border-white/5 bg-white/[0.02]'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-brand-cyan/10' : 'bg-white/5'}`}>
                              <Monitor size={16} className={i === 0 ? 'text-brand-cyan' : 'text-[#929095]'} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#E4E1EC]">{session.device || 'Unknown device'}</p>
                              <p className="text-xs text-[#929095] font-mono">{session.ipAddress || '—'} · {new Date(session.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          {i === 0
                            ? <span className="font-mono text-[10px] text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">Current</span>
                            : <button onClick={() => handleRevokeSession(session.id)} className="flex items-center gap-1 text-red-400 hover:text-red-300 font-mono text-xs transition-colors"><LogOut size={12} /> Revoke</button>
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Login history */}
                  <div className="glass-card rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/8">
                      <h3 className="font-headline text-[#E4E1EC] font-semibold text-base">Login History</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#47464B]/20">
                          {['Status', 'Device', 'IP Address', 'Time'].map((col) => (
                            <th key={col} className="px-6 py-3 text-left font-mono text-[10px] text-[#929095] uppercase tracking-widest">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-4 text-[#929095] text-sm text-center">No login history yet.</td></tr>
                        )}
                        {loginHistory.map((row) => (
                          <tr key={row.id} className="border-b border-[#47464B]/10 last:border-0 hover:bg-white/[0.02]">
                            <td className="px-6 py-3">
                              {row.status === 'success'
                                ? <div className="flex items-center gap-1.5 text-[#4ade80] text-xs"><CheckCircle2 size={12} /> Success</div>
                                : <div className="flex items-center gap-1.5 text-red-400 text-xs"><AlertTriangle size={12} /> Failed</div>
                              }
                            </td>
                            <td className="px-6 py-3 text-sm text-[#929095]">{row.device || '—'}</td>
                            <td className="px-6 py-3 font-mono text-xs text-[#929095]">{row.ipAddress || '—'}</td>
                            <td className="px-6 py-3 font-mono text-xs text-[#929095]">{new Date(row.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
