'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { api, type Me } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { Button, Checkbox, Field, Input, errorMessage } from '../ui'

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export function LoginForm({ onDone, platform = false }: { onDone: (user: Me) => void; platform?: boolean }) {
  const { login, completeTwoFactor } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function finish() {
    onDone(await api.me.get())
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (tempToken) {
        await completeTwoFactor(tempToken, code.trim(), remember)
        await finish()
      } else {
        const res = await login(email.trim(), password, remember, platform)
        if ('requires2FA' in res) setTempToken(res.tempToken)
        else await finish()
      }
    } catch (err) {
      setError(errorMessage(err))
      if (tempToken && /session/i.test(errorMessage(err))) {
        setTempToken(null)
        setCode('')
      }
    } finally {
      setBusy(false)
    }
  }

  if (tempToken) {
    return (
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="font-headline font-semibold">{t('auth.twoFaTitle')}</p>
          <p className="text-sm text-text-muted mt-1">{t('auth.twoFaSub')}</p>
        </div>
        <Input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="text-center font-mono text-xl tracking-[0.5em]"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" loading={busy} disabled={code.length !== 6} className="w-full">{t('auth.verify')}</Button>
        <Button type="button" variant="quiet" className="w-full" onClick={() => { setTempToken(null); setCode(''); setError(null) }}>
          {t('common.back')}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t('common.email')}>
        <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={t('common.password')}>
        <PasswordInput autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <div className="flex items-center justify-between gap-3">
        <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} label={t('auth.remember')} />
        {!platform && <Link href="/forgot-password" className="text-sm text-brand-cyan hover:underline shrink-0">{t('auth.forgot')}</Link>}
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button type="submit" loading={busy} className="w-full">{t('nav.login')}</Button>
    </form>
  )
}

export function RegisterForm({ onDone }: { onDone: (user: Me) => void }) {
  const { signIn } = useAuth()
  const { studio } = useStudio()
  const { t, locale } = useI18n()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [accept, setAccept] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await api.auth.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        acceptPrivacy: accept,
        marketingOptIn: marketing,
        locale,
      })
      await signIn(res, true)
      onDone(await api.me.get())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const [before, after] = t('auth.acceptPrivacy', { studio: studio?.name ?? '' }).split('{link}')
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t('common.name')}><Input autoComplete="name" required minLength={2} value={form.name} onChange={set('name')} /></Field>
      <Field label={t('common.email')}><Input type="email" autoComplete="email" required value={form.email} onChange={set('email')} /></Field>
      <Field label={t('common.phone')} hint="MTN / Airtel — used for mobile money payments">
        <Input type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+250 7XX XXX XXX" />
      </Field>
      <Field label={t('common.password')} hint={t('auth.passwordHint')}>
        <PasswordInput autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
      </Field>
      <Checkbox
        checked={accept}
        onChange={(e) => setAccept(e.target.checked)}
        label={
          <>
            {before}
            <Link href="/privacy" target="_blank" className="text-brand-cyan hover:underline">{t('auth.privacyLink')}</Link>
            {after}
          </>
        }
      />
      <Checkbox checked={marketing} onChange={(e) => setMarketing(e.target.checked)} label={t('auth.marketing')} />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button type="submit" loading={busy} disabled={!accept} className="w-full">{t('nav.register')}</Button>
    </form>
  )
}
