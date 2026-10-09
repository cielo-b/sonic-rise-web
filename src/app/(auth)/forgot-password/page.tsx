'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Button, Field, Input, errorMessage } from '@/components/ui'
import { AuthCard } from '../AuthCard'

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSub')}
      footer={<Link href="/login" className="text-brand-cyan hover:underline">{t('common.back')}</Link>}
    >
      {step === 'email' && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(async () => { await api.auth.forgotPassword(email.trim()); toast.success(t('auth.codeSent')); setStep('code') }) }}>
          <Field label={t('common.email')}><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" loading={busy} className="w-full">{t('auth.sendCode')}</Button>
        </form>
      )}
      {step === 'code' && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(async () => { const r = await api.auth.verifyOtp(email.trim(), code); setResetToken(r.resetToken); setStep('password') }) }}>
          <p className="text-sm text-text-muted">{t('auth.codeSent')}</p>
          <Field label={t('auth.code')}>
            <Input inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="text-center font-mono text-xl tracking-[0.5em]" />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" loading={busy} disabled={code.length !== 6} className="w-full">{t('auth.verify')}</Button>
        </form>
      )}
      {step === 'password' && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(async () => { await api.auth.resetPassword(resetToken, password); toast.success(t('auth.resetDone')); router.replace('/login') }) }}>
          <Field label={t('auth.newPassword')} hint={t('auth.passwordHint')}>
            <Input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" loading={busy} className="w-full">{t('common.save')}</Button>
        </form>
      )}
    </AuthCard>
  )
}
