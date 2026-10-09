'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio, useStudio } from '@/context/StudioContext'
import { LOCALES, useI18n } from '@/lib/i18n'
import { formatDateTime } from '@/lib/format'
import { Button, Card, Checkbox, ConfirmButton, Field, ImageUpload, Input, Modal, Select, errorMessage } from './ui'

function Profile() {
  const { user, refresh } = useAuth()
  const { t, setLocale } = useI18n()
  const [form, setForm] = useState({
    name: user!.name,
    phone: user!.phone ?? '',
    company: user!.company ?? '',
    preferredLocale: user!.preferredLocale ?? '',
    marketingOptIn: user!.marketingOptIn,
    avatarUrl: user!.avatarUrl,
  })
  const [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.me.update({
        name: form.name,
        phone: form.phone || undefined,
        company: form.company || undefined,
        preferredLocale: (form.preferredLocale || undefined) as never,
        marketingOptIn: form.marketingOptIn,
        ...(form.avatarUrl ? { avatarUrl: form.avatarUrl } : {}),
      })
      if (form.preferredLocale) setLocale(form.preferredLocale as never)
      refresh()
      toast.success(t('common.save'))
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card className="p-6">
      <form onSubmit={save} className="space-y-4">
        <h2 className="font-headline font-semibold">{t('portal.profile')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('common.name')}><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={t('common.email')}><Input value={user!.email} disabled /></Field>
          <Field label={t('common.phone')}><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
          <Field label={t('nav.language')}>
            <Select value={form.preferredLocale} onChange={(e) => setForm({ ...form, preferredLocale: e.target.value })}>
              <option value="">—</option>
              {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Photo"><ImageUpload value={form.avatarUrl} onChange={(url) => setForm({ ...form, avatarUrl: url })} /></Field>
        <Checkbox checked={form.marketingOptIn} onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })} label={t('auth.marketing')} />
        <Button type="submit" loading={busy}>{t('common.save')}</Button>
      </form>
    </Card>
  )
}

function Password() {
  const { t } = useI18n()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.me.update({ password: next, currentPassword: current })
      setCurrent('')
      setNext('')
      toast.success('Password changed')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <Field label={t('portal.currentPassword')}><Input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
      <Field label={t('auth.newPassword')} hint={t('auth.passwordHint')}><Input type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
      <Button type="submit" variant="glass" loading={busy}>{t('common.save')}</Button>
    </form>
  )
}

function TwoFactor() {
  const { user, refresh } = useAuth()
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  async function run(fn: () => Promise<void>) {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-3 border-t border-white/10 pt-5">
      <p className="font-medium">Two-step verification {user!.twoFaEnabled && <span className="chip chip-success ml-2">On</span>}</p>
      {!user!.twoFaEnabled && !setup && (
        <Button variant="glass" loading={busy} onClick={() => run(async () => setSetup(await api.auth.twoFaSetup()))}>Set up with an authenticator app</Button>
      )}
      {setup && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL */}
          <img src={setup.qrDataUrl} alt="QR code for your authenticator app" className="w-40 h-40 bg-white p-2 rounded-lg" />
          <p className="text-xs text-text-muted">Or enter this key: <code className="font-mono">{setup.secret}</code></p>
          <div className="flex gap-2">
            <Input inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="max-w-40" />
            <Button loading={busy} disabled={code.length !== 6} onClick={() => run(async () => { await api.auth.twoFaEnable(code); setSetup(null); setCode(''); refresh(); toast.success('Two-step verification is on') })}>Turn on</Button>
          </div>
        </div>
      )}
      {user!.twoFaEnabled && (
        <div className="flex gap-2">
          <Input inputMode="numeric" maxLength={6} placeholder="Code to turn off" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="max-w-48" />
          <Button variant="danger" loading={busy} disabled={code.length !== 6} onClick={() => run(async () => { await api.auth.twoFaDisable(code); setCode(''); refresh(); toast.success('Two-step verification is off') })}>Turn off</Button>
        </div>
      )}
    </div>
  )
}

function Sessions() {
  const { studio } = useStudio()
  const { locale } = useI18n()
  const q = useQuery({ queryKey: ['sessions'], queryFn: api.auth.sessions })
  const tz = studio?.timezone ?? 'Africa/Kigali'
  return (
    <div className="space-y-3 border-t border-white/10 pt-5">
      <p className="font-medium">Signed-in devices</p>
      <ul className="space-y-2 text-sm">
        {q.data?.map((s) => (
          <li key={s.id} className="flex justify-between gap-3">
            <span>{s.device ?? 'Device'} <span className="text-outline text-xs">{s.ipAddress} · {formatDateTime(s.createdAt, tz, locale)}</span></span>
            <Button variant="quiet" onClick={async () => { await api.auth.revokeSession(s.id); void q.refetch() }}>Sign out</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Privacy() {
  const studio = useRequiredStudio()
  const { logout } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Card className="p-6 space-y-4">
      <h2 className="font-headline font-semibold">{t('portal.privacy')}</h2>
      <p className="text-sm text-text-muted">{studio.name} keeps your details to manage your bookings, projects and payments.</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="glass"
          onClick={async () => {
            try {
              const data = await api.me.export()
              const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
              const a = document.createElement('a')
              a.href = url
              a.download = `my-data-${studio.slug}.json`
              a.click()
              URL.revokeObjectURL(url)
            } catch (err) {
              toast.error(errorMessage(err))
            }
          }}
        >
          {t('portal.export')}
        </Button>
        <Button variant="danger" onClick={() => setOpen(true)}>{t('portal.deleteAccount')}</Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('portal.deleteAccount')}
        footer={
          <>
            <Button variant="glass" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="danger"
              loading={busy}
              disabled={!password}
              onClick={async () => {
                setBusy(true)
                try {
                  await api.me.delete(password)
                  logout()
                  window.location.href = '/'
                } catch (err) {
                  toast.error(errorMessage(err))
                  setBusy(false)
                }
              }}
            >
              {t('portal.deleteAccount')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">{t('portal.deleteWarn')}</p>
        <Field label={t('portal.currentPassword')}><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      </Modal>
    </Card>
  )
}

export function AccountSettings({ showPrivacy = true }: { showPrivacy?: boolean }) {
  const { t } = useI18n()
  const { logout } = useAuth()
  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <Profile />
      <div className="space-y-6">
        <Card className="p-6 space-y-5">
          <h2 className="font-headline font-semibold">{t('portal.security')}</h2>
          <Password />
          <TwoFactor />
          <Sessions />
          <ConfirmButton variant="glass" onConfirm={async () => { logout(); window.location.href = '/login' }}>
            Sign out of all devices
          </ConfirmButton>
        </Card>
        {showPrivacy && <Privacy />}
      </div>
    </div>
  )
}
