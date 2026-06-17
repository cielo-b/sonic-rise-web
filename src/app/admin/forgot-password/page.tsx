'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [sent, setSent]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email address.'); return }
    setLoading(true)
    try {
      await api.auth.forgotPassword(email)
      sessionStorage.setItem('sr_reset_email', email)
      setSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-cyan/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 flex flex-col p-12">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <SonicRiseMark className="w-8 h-8 text-brand-purple" />
            <span className="font-headline font-bold text-xl tracking-tight text-white">SonicRise</span>
          </Link>
          <div className="mt-auto">
            <span className="font-mono text-[10px] tracking-widest text-brand-cyan uppercase mb-3 block">
              Account Recovery
            </span>
            <h2 className="font-headline text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-[-0.03em] mb-4">
              Regain<br />Access
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              We'll send a one-time verification code to your registered email address.
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="max-w-sm"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center">
                <Mail size={14} className="text-brand-cyan" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-brand-cyan">Password Reset</span>
            </div>

            {sent ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-8">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 text-sm font-medium">Code sent!</p>
                    <p className="text-emerald-400/70 text-xs mt-0.5 font-mono">{email}</p>
                  </div>
                </div>
                <h1 className="font-headline text-3xl font-extrabold text-white mb-2 tracking-tight">
                  Check your inbox
                </h1>
                <p className="text-[#929095] text-sm mb-8 leading-relaxed">
                  A 6-digit verification code has been sent to your email. Open it and enter the code on the next screen.
                </p>
                <button
                  onClick={() => router.push('/admin/otp')}
                  className="btn-primary w-full py-3.5 text-base"
                >
                  Enter Verification Code →
                </button>
                <button
                  onClick={() => { setSent(false); setError('') }}
                  className="w-full mt-4 text-center font-mono text-[10px] text-[#929095] hover:text-[#C8C5CB] transition-colors uppercase tracking-wider"
                >
                  Use a different email
                </button>
              </motion.div>
            ) : (
              <>
                <h1 className="font-headline text-3xl font-extrabold text-white mb-2 tracking-tight">
                  Forgot Password?
                </h1>
                <p className="text-[#929095] text-sm mb-8 leading-relaxed">
                  Enter the email address on your account and we'll send you a 6-digit reset code.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@sonicrise.rw"
                      autoComplete="email"
                      className="input-studio text-sm w-full"
                    />
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
                        Sending code…
                      </span>
                    ) : 'Send Reset Code'}
                  </button>
                </form>

              </>
            )}
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
