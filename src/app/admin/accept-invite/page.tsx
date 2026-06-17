'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, UserCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'

const CHECKS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8           },
  { label: 'Contains a number',     test: (p: string) => /\d/.test(p)            },
  { label: 'Uppercase letter',      test: (p: string) => /[A-Z]/.test(p)         },
  { label: 'Special character',     test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
]

function PasswordStrength({ password }: { password: string }) {
  const score    = CHECKS.filter((c) => c.test(password)).length
  const barColor = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-amber-400' : score === 3 ? 'bg-brand-cyan' : 'bg-emerald-500'
  return (
    <div className="space-y-2.5 mt-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-300 ${score >= level ? barColor : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {CHECKS.map((c) => {
          const pass = c.test(password)
          return (
            <div key={c.label} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${pass ? 'bg-emerald-400' : 'bg-white/15'}`} />
              <span className={`font-mono text-[10px] transition-colors ${pass ? 'text-emerald-400' : 'text-[#929095]'}`}>{c.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AcceptInviteForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token  = params.get('token') ?? 'demo'

  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  // In a real app you'd fetch invite details from the backend using the token.
  // For demo purposes, we show a generic invitation.
  const inviteEmail = params.get('email') ?? 'invitee@sonicrise.rw'
  const inviteRole  = params.get('role')  ?? 'Editor'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim())   { setError('Please enter your full name.'); return }
    const score = CHECKS.filter((c) => c.test(password)).length
    if (score < 3)      { setError('Password is too weak. Meet at least 3 requirements.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await api.auth.acceptInvite(token, name.trim(), password)
      setDone(true)
      toast.success('Account activated! You can now sign in.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to activate account.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-sm">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Invalid or expired invitation link.
        </div>
        <Link href="/admin/login" className="mt-4 block text-center font-mono text-sm text-brand-cyan hover:opacity-70 transition-opacity">
          Back to login →
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="max-w-sm"
    >
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center">
          <UserCheck size={14} className="text-brand-purple" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-brand-purple">Team Invitation</span>
      </div>

      {done ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-white mb-2 tracking-tight">
            Welcome to SonicRise!
          </h1>
          <p className="text-[#929095] text-sm mb-8 leading-relaxed">
            Your account is active. You can now sign in as <span className="text-[#C8C5CB] font-mono">{inviteEmail}</span> with the password you just set.
          </p>
          <Link href="/admin/login" className="btn-primary w-full py-3.5 text-base text-center flex items-center justify-center">
            Sign in to Dashboard →
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Invite summary */}
          <div className="p-4 rounded-xl bg-brand-purple/10 border border-brand-purple/20 mb-8">
            <p className="font-mono text-[10px] text-brand-purple uppercase tracking-widest mb-2">Your Invitation</p>
            <p className="text-[#E4E1EC] text-sm font-medium">{inviteEmail}</p>
            <p className="text-[#929095] text-xs font-mono mt-0.5">Role: <span className="text-[#C8C5CB]">{inviteRole}</span></p>
          </div>

          <h1 className="font-headline text-3xl font-extrabold text-white mb-2 tracking-tight">
            Set Up Your Account
          </h1>
          <p className="text-[#929095] text-sm mb-8 leading-relaxed">
            You've been invited to join the SonicRise production suite. Create a password to activate your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                className="input-studio text-sm w-full"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                readOnly
                className="input-studio text-sm w-full opacity-60 cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="input-studio text-sm pr-10 w-full"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] hover:text-[#C8C5CB] transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`input-studio text-sm pr-10 w-full ${
                    confirm && confirm !== password ? 'border-red-500/50' : confirm && confirm === password ? 'border-emerald-500/50' : ''
                  }`}
                />
                <button type="button" onClick={() => setShowConf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] hover:text-[#C8C5CB] transition-colors">
                  {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirm && (
                <p className={`font-mono text-[10px] ${confirm === password ? 'text-emerald-400' : 'text-red-400'}`}>
                  {confirm === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Activating…
                </span>
              ) : 'Activate Account'}
            </button>
          </form>
        </>
      )}
    </motion.div>
  )
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex bg-[#0B0B0F]">

      {/* ── Left: cinematic panel ───────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-[48%] xl:w-[52%] relative shrink-0">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9t5QBmlLCjikxI7WmRJMQLGJNo_6z9pBo4nsYfLA0oofw093a_P233hCK90ogT_9HwNdQonK-YnXHi1WfzfZbWhqyI24ZdoB4UczEj9Svm-EucafrJo4KZih8opWzQUnWyPp_XuIf5n5_L66K99HqKs-LGQ4o2XwCJRxYhu4YV2PAUZoRHKkQSbkjaxquYz_xadnnUTpxFdUkginX75Zs24y4ckHo8bEVa1nH46ho4qRFIHruoaOYHUxK_Vz8LRimRWH-ipYklrA"
          alt="SonicRise studio" fill className="object-cover opacity-45" unoptimized priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0B0B0F]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/20 to-transparent" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-purple/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 flex flex-col p-12">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <SonicRiseMark className="w-8 h-8 text-brand-purple" />
            <span className="font-headline font-bold text-xl tracking-tight text-white">SonicRise</span>
          </Link>
          <div className="mt-auto">
            <span className="font-mono text-[10px] tracking-widest text-brand-cyan uppercase mb-3 block">
              You're Invited
            </span>
            <h2 className="font-headline text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-[-0.03em] mb-4">
              Join the<br />Production Suite
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Set up your account to start managing sessions, assets and projects at SonicRise Cinematic Studio.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: form panel ───────────────────────────────────────────── */}
      <div className="flex-1 bg-[#0D0E15] flex flex-col min-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 shrink-0">
          <Link href="/admin/login" className="flex items-center gap-2 text-[#929095] hover:text-[#C8C5CB] transition-colors text-sm">
            <ArrowLeft size={14} /> Back to login
          </Link>
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <SonicRiseMark className="w-6 h-6 text-brand-purple" />
            <span className="font-headline font-bold text-base tracking-tight text-white">SonicRise</span>
          </Link>
        </div>

        <div className="flex-1 px-8 md:px-16 lg:px-20 py-12">
          <Suspense fallback={
            <div className="max-w-sm">
              <div className="h-8 bg-white/5 rounded-lg animate-pulse mb-6 w-48" />
              <div className="h-12 bg-white/5 rounded-lg animate-pulse mb-4" />
              <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
            </div>
          }>
            <AcceptInviteForm />
          </Suspense>
        </div>

        <div className="px-8 md:px-16 lg:px-20 py-6 border-t border-white/5 shrink-0">
          <p className="font-mono text-[10px] text-[#929095]/50 uppercase tracking-widest">
            © 2024 SonicRise Studios · Kigali, Rwanda
          </p>
        </div>
      </div>
    </div>
  )
}
