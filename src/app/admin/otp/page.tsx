'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, KeyRound, AlertCircle, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'

export default function OTPPage() {
  const router    = useRouter()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [digits, setDigits]     = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [resent, setResent]     = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [email, setEmail]       = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('sr_reset_email')
    if (!stored) { router.replace('/admin/forgot-password'); return }
    setEmail(stored)
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [router])

  useEffect(() => {
    if (countdown === 0) return
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [countdown])

  function handleChange(i: number, val: string) {
    // Handle paste of full code
    if (val.length > 1) {
      const clean = val.replace(/\D/g, '').slice(0, 6)
      const next = Array(6).fill('')
      for (let j = 0; j < clean.length; j++) next[j] = clean[j]
      setDigits(next)
      inputRefs.current[Math.min(clean.length, 5)]?.focus()
      if (clean.length === 6) verify(clean)
      return
    }
    const digit = val.replace(/\D/, '').slice(-1)
    const next = [...digits]
    next[i] = digit
    setDigits(next)
    setError('')
    if (digit && i < 5) inputRefs.current[i + 1]?.focus()
    if (digit && i === 5) verify(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  async function verify(code?: string) {
    const otp = code ?? digits.join('')
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return }
    setLoading(true)
    try {
      const { resetToken } = await api.auth.verifyOtp(email, otp)
      sessionStorage.setItem('sr_reset_token', resetToken)
      router.push('/admin/set-password')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed.'
      setError(msg)
      toast.error(msg)
      setDigits(Array(6).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setCountdown(60)
    setDigits(Array(6).fill(''))
    setError('')
    try {
      await api.auth.forgotPassword(email)
      setResent(true)
      toast.success('New code sent to your email.')
      setTimeout(() => { setResent(false); inputRefs.current[0]?.focus() }, 2000)
    } catch {
      const msg = 'Failed to resend code. Please try again.'
      setError(msg)
      toast.error(msg)
    }
  }

  const filled = digits.filter(Boolean).length

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
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-gold/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 flex flex-col p-12">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <SonicRiseMark className="w-8 h-8 text-brand-purple" />
            <span className="font-headline font-bold text-xl tracking-tight text-white">SonicRise</span>
          </Link>
          <div className="mt-auto">
            <span className="font-mono text-[10px] tracking-widest text-brand-cyan uppercase mb-3 block">
              Step 2 of 3
            </span>
            <h2 className="font-headline text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-[-0.03em] mb-4">
              Verify<br />Your Identity
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Enter the 6-digit code from your email to confirm it's really you.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: form panel ───────────────────────────────────────────── */}
      <div className="flex-1 bg-[#0D0E15] flex flex-col min-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 shrink-0">
          <Link href="/admin/forgot-password" className="flex items-center gap-2 text-[#929095] hover:text-[#C8C5CB] transition-colors text-sm">
            <ArrowLeft size={14} /> Back
          </Link>
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <SonicRiseMark className="w-6 h-6 text-brand-purple" />
            <span className="font-headline font-bold text-base tracking-tight text-white">SonicRise</span>
          </Link>
        </div>

        <div className="flex-1 px-8 md:px-16 lg:px-20 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="max-w-sm"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center">
                <KeyRound size={14} className="text-brand-gold" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-brand-gold">Verification</span>
            </div>

            <h1 className="font-headline text-3xl font-extrabold text-white mb-2 tracking-tight">
              Enter the Code
            </h1>
            {email && (
              <p className="text-[#929095] text-sm mb-8 leading-relaxed">
                We sent a 6-digit code to{' '}
                <span className="text-[#C8C5CB] font-mono">{email}</span>
              </p>
            )}

            {/* OTP inputs */}
            <div className="flex gap-2 mb-6" onPaste={(e) => handleChange(0, e.clipboardData.getData('text'))}>
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digits[i]}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center font-mono text-xl font-bold rounded-xl border transition-all outline-none ${
                    digits[i]
                      ? 'bg-[#1B1B23] border-[#D2BBFF]/60 text-[#E4E1EC]'
                      : 'bg-[#1B1B23] border-white/10 text-[#E4E1EC] focus:border-brand-cyan'
                  } ${error ? 'border-red-500/60' : ''}`}
                />
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verify button */}
            <button
              onClick={() => verify()}
              disabled={loading || filled < 6}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verifying…
                </span>
              ) : `Verify Code ${filled > 0 ? `(${filled}/6)` : ''}`}
            </button>

            {/* Resend */}
            <div className="text-center">
              {resent ? (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="font-mono text-[11px] text-emerald-400"
                >
                  New code sent!
                </motion.p>
              ) : countdown > 0 ? (
                <p className="font-mono text-[11px] text-[#929095]">
                  Resend in <span className="text-[#C8C5CB]">{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="flex items-center gap-1.5 mx-auto font-mono text-[11px] text-brand-cyan hover:opacity-70 transition-opacity"
                >
                  <RotateCcw size={12} /> Resend code
                </button>
              )}
            </div>

          </motion.div>
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
