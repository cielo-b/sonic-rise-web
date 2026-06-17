'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'

const DEMO_PASSWORD = 'sonicrise2024'
const DEMO_USERS = [
  { email: 'admin@sonicrise.rw',  label: 'Super Admin', color: 'text-[#D2BBFF]'  },
  { email: 'jl@sonicrise.rw',    label: 'Admin',       color: 'text-brand-cyan' },
  { email: 'marie@sonicrise.rw', label: 'Editor',      color: 'text-amber-400'  },
  { email: 'sam@sonicrise.rw',   label: 'Viewer',      color: 'text-[#929095]'  },
]

export default function AdminLoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    try {
      await login(email.trim(), password, remember)
      router.push('/admin')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.'
      setError(msg)
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0B0B0F]">

      {/* ── Left: cinematic brand panel ─────────────────────────────────── */}
      <div className="hidden lg:block lg:w-[48%] xl:w-[52%] relative shrink-0">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9t5QBmlLCjikxI7WmRJMQLGJNo_6z9pBo4nsYfLA0oofw093a_P233hCK90ogT_9HwNdQonK-YnXHi1WfzfZbWhqyI24ZdoB4UczEj9Svm-EucafrJo4KZih8opWzQUnWyPp_XuIf5n5_L66K99HqKs-LGQ4o2XwCJRxYhu4YV2PAUZoRHKkQSbkjaxquYz_xadnnUTpxFdUkginX75Zs24y4ckHo8bEVa1nH46ho4qRFIHruoaOYHUxK_Vz8LRimRWH-ipYklrA"
          alt="SonicRise studio"
          fill
          className="object-cover opacity-45"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0B0B0F]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/20 to-transparent" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-purple/25 rounded-full blur-[100px] pointer-events-none" />

        {/* Content pinned inside the panel */}
        <div className="absolute inset-0 flex flex-col p-12">
          {/* Logo top-left */}
          <Link href="/" className="flex items-center gap-3 w-fit">
            <SonicRiseMark className="w-8 h-8 text-brand-purple" />
            <span className="font-headline font-bold text-xl tracking-tight text-white">SonicRise</span>
          </Link>

          {/* Tagline bottom-left */}
          <div className="mt-auto">
            <span className="font-mono text-[10px] tracking-widest text-brand-cyan uppercase mb-3 block">
              Production Suite v2.0
            </span>
            <h2 className="font-headline text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-[-0.03em] mb-4">
              Where Sound<br />Meets Vision
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Rwanda&apos;s premier creative studio — audio engineering, visual storytelling and cinematic production.
            </p>
            <div className="flex gap-8 mt-8 pt-8 border-t border-white/10">
              {[
                { value: '500+', label: 'Projects' },
                { value: '142',  label: 'Clients'  },
                { value: '2018', label: 'Founded'  },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-headline text-2xl font-bold text-white">{s.value}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: form panel ───────────────────────────────────────────── */}
      <div className="flex-1 bg-[#0D0E15] flex flex-col min-h-screen overflow-y-auto">

        {/* Top bar with back link */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 shrink-0">
          <Link href="/" className="flex items-center gap-2 text-[#929095] hover:text-[#C8C5CB] transition-colors text-sm">
            <ArrowLeft size={14} />
            Back to site
          </Link>
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <SonicRiseMark className="w-6 h-6 text-brand-purple" />
            <span className="font-headline font-bold text-base tracking-tight text-white">SonicRise</span>
          </Link>
        </div>

        {/* Form area — padded, left-aligned, not floating */}
        <div className="flex-1 px-8 md:px-16 lg:px-20 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="max-w-sm"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center">
                <ShieldCheck size={14} className="text-brand-purple" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-brand-purple">Secure Access</span>
            </div>

            <h1 className="font-headline text-3xl font-extrabold text-white mb-2 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-[#929095] text-sm mb-8">
              Sign in to manage bookings, clients, and media.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sonicrise.rw"
                  autoComplete="email"
                  className="input-studio text-sm w-full"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">
                    Password
                  </label>
                  <Link href="/admin/forgot-password" className="font-mono text-[10px] text-brand-cyan hover:opacity-70 transition-opacity">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="input-studio text-sm pr-10 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] hover:text-[#C8C5CB] transition-colors"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-3 cursor-pointer group w-fit">
                <div
                  onClick={() => setRemember((v) => !v)}
                  className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded flex items-center justify-center border transition-all shrink-0 ${
                    remember
                      ? 'bg-brand-purple border-brand-purple'
                      : 'bg-transparent border-white/20 group-hover:border-white/40'
                  }`}
                >
                  {remember && (
                    <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[#929095] group-hover:text-[#C8C5CB] transition-colors select-none">
                  Keep me signed in
                </span>
              </label>

              {/* Submit */}
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
                    Signing in…
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/8 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">
                Demo Accounts — password: <span className="text-brand-cyan">{DEMO_PASSWORD}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); setError('') }}
                    className="p-2.5 rounded-lg bg-[#1B1B23] border border-white/8 text-left hover:border-white/20 transition-all"
                  >
                    <p className={`font-mono text-[10px] font-bold ${u.color}`}>{u.label}</p>
                    <p className="text-[#929095] text-[10px] truncate mt-0.5">{u.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-8 md:px-16 lg:px-20 py-6 border-t border-white/5 shrink-0">
          <p className="font-mono text-[10px] text-[#929095]/50 uppercase tracking-widest">
            © 2024 SonicRise Studios · Kigali, Rwanda
          </p>
        </div>
      </div>
    </div>
  )
}
