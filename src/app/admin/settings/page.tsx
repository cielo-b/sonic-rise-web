'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type Locale, type OpeningHours, type StudioSettings } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { STUDIO_QUERY_KEY } from '@/context/StudioContext'
import { LOCALES } from '@/lib/i18n'
import { Button, Card, Checkbox, Field, ImageUpload, Input, Loading, PageHeader, Select, Tabs, Textarea, errorMessage } from '@/components/ui'
import { AccountSettings } from '@/components/AccountSettings'

type Tab = 'studio' | 'hours' | 'booking' | 'payments' | 'account'
const DAYS = [1, 2, 3, 4, 5, 6, 0] as const
const DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function useStudioForm() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['studio', 'settings'], queryFn: api.studio.settings })
  const [busy, setBusy] = useState(false)
  async function save(data: Partial<StudioSettings>) {
    setBusy(true)
    try {
      await api.studio.update(data)
      await qc.invalidateQueries({ queryKey: STUDIO_QUERY_KEY })
      await q.refetch()
      toast.success('Saved')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return { settings: q.data, busy, save }
}

function StudioProfile() {
  const { settings, busy, save } = useStudioForm()
  const [f, setF] = useState<Partial<StudioSettings>>({})
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load saved values
  useEffect(() => { if (settings) setF(settings) }, [settings])
  if (!settings) return <Loading />
  const v = (k: keyof StudioSettings) => (f[k] as string | null | undefined) ?? ''
  const set = (k: keyof StudioSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  return (
    <form
      className="space-y-4 max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault()
        void save({
          name: v('name').trim(),
          tagline: v('tagline').trim() || undefined,
          email: v('email').trim() || undefined,
          phone: v('phone').trim() || undefined,
          address: v('address').trim() || undefined,
          city: v('city').trim() || undefined,
          primaryColor: f.primaryColor,
          accentColor: f.accentColor,
          defaultLocale: f.defaultLocale,
          ...(f.logoUrl ? { logoUrl: f.logoUrl } : {}),
        } as Partial<StudioSettings>)
      }}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Studio name"><Input required value={v('name')} onChange={set('name')} /></Field>
        <Field label="Tagline"><Input value={v('tagline')} onChange={set('tagline')} /></Field>
        <Field label="Email" hint="Booking emails reply here; website messages are sent here"><Input type="email" value={v('email')} onChange={set('email')} /></Field>
        <Field label="Phone"><Input type="tel" value={v('phone')} onChange={set('phone')} /></Field>
        <Field label="Address"><Input value={v('address')} onChange={set('address')} /></Field>
        <Field label="City"><Input value={v('city')} onChange={set('city')} /></Field>
      </div>
      <Field label="Logo"><ImageUpload value={f.logoUrl ?? null} onChange={(url) => setF({ ...f, logoUrl: url })} /></Field>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Main colour"><input type="color" value={f.primaryColor ?? '#7C3AED'} onChange={set('primaryColor')} className="h-10 w-full rounded-lg bg-transparent cursor-pointer" /></Field>
        <Field label="Accent colour"><input type="color" value={f.accentColor ?? '#00D4FF'} onChange={set('accentColor')} className="h-10 w-full rounded-lg bg-transparent cursor-pointer" /></Field>
        <Field label="Default website language">
          <Select value={f.defaultLocale ?? 'en'} onChange={(e) => setF({ ...f, defaultLocale: e.target.value as Locale })}>
            {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </Select>
        </Field>
      </div>
      <p className="text-xs text-outline">Website address: {settings.slug}</p>
      <Button type="submit" loading={busy}>Save</Button>
    </form>
  )
}

function Hours() {
  const { settings, busy, save } = useStudioForm()
  const [hours, setHours] = useState<OpeningHours>({})
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load saved values
  useEffect(() => { if (settings) setHours(settings.openingHours ?? {}) }, [settings])
  if (!settings) return <Loading />
  return (
    <div className="space-y-3 max-w-xl">
      <p className="text-sm text-text-muted">Clients can only book online inside these hours. Your team can book any time. Leave all days closed to allow any time.</p>
      {DAYS.map((d) => {
        const key = String(d) as keyof OpeningHours
        const w = hours[key]
        return (
          <Card key={d} className="p-3 flex flex-wrap items-center gap-3">
            <span className="w-28 text-sm">{DAY_NAME[d]}</span>
            <Checkbox checked={!!w} onChange={(e) => setHours({ ...hours, [key]: e.target.checked ? { open: '09:00', close: '18:00' } : undefined })} label="Open" />
            {w && (
              <>
                <input type="time" className="input-studio text-sm w-auto" value={w.open} onChange={(e) => setHours({ ...hours, [key]: { ...w, open: e.target.value } })} />
                <span className="text-text-muted">–</span>
                <input type="time" className="input-studio text-sm w-auto" value={w.close} onChange={(e) => setHours({ ...hours, [key]: { ...w, close: e.target.value } })} />
              </>
            )}
          </Card>
        )
      })}
      <Button
        loading={busy}
        onClick={() => save({ openingHours: Object.fromEntries(Object.entries(hours).filter(([, w]) => !!w)) as OpeningHours })}
      >
        Save hours
      </Button>
    </div>
  )
}

function BookingRules() {
  const { settings, busy, save } = useStudioForm()
  const [f, setF] = useState({ depositPercent: 0, cancellationHours: 24, bufferMinutes: 0, usdRate: '', cancellationPolicy: '', timezone: 'Africa/Kigali' })
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load saved values
    if (settings) setF({ depositPercent: settings.depositPercent, cancellationHours: settings.cancellationHours, bufferMinutes: settings.bufferMinutes, usdRate: settings.usdRate ? String(settings.usdRate) : '', cancellationPolicy: settings.cancellationPolicy ?? '', timezone: settings.timezone })
  }, [settings])
  if (!settings) return <Loading />
  return (
    <form
      className="space-y-4 max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault()
        void save({
          depositPercent: Number(f.depositPercent),
          cancellationHours: Number(f.cancellationHours),
          bufferMinutes: Number(f.bufferMinutes),
          usdRate: f.usdRate ? Number(f.usdRate) : null,
          cancellationPolicy: f.cancellationPolicy.trim() || undefined,
          timezone: f.timezone,
        } as Partial<StudioSettings>)
      }}
    >
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Deposit for online bookings (%)" hint="0 = no deposit"><Input type="number" min={0} max={100} value={f.depositPercent} onChange={(e) => setF({ ...f, depositPercent: Number(e.target.value) })} /></Field>
        <Field label="Free cancellation until (hours before)"><Input type="number" min={0} max={720} value={f.cancellationHours} onChange={(e) => setF({ ...f, cancellationHours: Number(e.target.value) })} /></Field>
        <Field label="Gap between sessions (minutes)" hint="Setup / turnaround time per room"><Input type="number" min={0} max={240} value={f.bufferMinutes} onChange={(e) => setF({ ...f, bufferMinutes: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Cancellation & refund policy" hint="Shown when booking and cancelling"><Textarea rows={4} value={f.cancellationPolicy} onChange={(e) => setF({ ...f, cancellationPolicy: e.target.value })} /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={`RWF per 1 USD`} hint="Shows approximate USD prices to international clients. Leave empty to hide."><Input type="number" min={1} step="any" value={f.usdRate} onChange={(e) => setF({ ...f, usdRate: e.target.value })} /></Field>
        <Field label="Time zone"><Input value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })} /></Field>
      </div>
      <Button type="submit" loading={busy}>Save</Button>
    </form>
  )
}

function Payments() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['studio', 'settings'], queryFn: api.studio.settings })
  const [token, setToken] = useState('')
  const [sandbox, setSandbox] = useState(true)
  const [busy, setBusy] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load saved mode
  useEffect(() => { if (q.data) setSandbox(q.data.payments.sandbox) }, [q.data])
  if (!q.data) return <Loading />
  const callback = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/payments/pawapay/callback`
  async function save(apiToken: string) {
    setBusy(true)
    try {
      await api.studio.setPayments({ apiToken, sandbox })
      setToken('')
      await q.refetch()
      await qc.invalidateQueries({ queryKey: STUDIO_QUERY_KEY })
      toast.success(apiToken ? 'pawaPay connected' : 'pawaPay disconnected')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="p-5 space-y-2 text-sm">
        <p className="font-headline font-semibold">Mobile money with pawaPay</p>
        <p className="text-text-muted">Clients pay deposits, invoices and file downloads with MTN MoMo or Airtel Money. Money goes straight to your pawaPay account.</p>
        <ol className="list-decimal pl-5 text-text-muted space-y-1">
          <li>Open a merchant account at <a href="https://dashboard.pawapay.io" target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline">dashboard.pawapay.io</a>.</li>
          <li>Create an API token and paste it below.</li>
          <li>In the pawaPay dashboard, set the deposit callback URL to:<br /><code className="text-xs break-all">{callback}</code></li>
        </ol>
        <p>Status: {q.data.payments.configured ? <span className="chip chip-success">Connected · {q.data.payments.sandbox ? 'sandbox' : 'live'}</span> : <span className="chip chip-warning">Not connected</span>}</p>
      </Card>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void save(token.trim()) }}>
        <Field label="pawaPay API token" hint="Stored encrypted. It is never shown again after saving."><Input type="password" autoComplete="off" required value={token} onChange={(e) => setToken(e.target.value)} /></Field>
        <Checkbox checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} label="Sandbox (test money) — untick when you go live" />
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>{q.data.payments.configured ? 'Replace token' : 'Connect'}</Button>
          {q.data.payments.configured && <Button type="button" variant="danger" onClick={() => save('')}>Disconnect</Button>}
        </div>
      </form>
    </div>
  )
}

function Settings() {
  const { can } = useAuth()
  const initial = (useSearchParams().get('tab') as Tab) || (can('studio.settings') ? 'studio' : 'account')
  const [tab, setTab] = useState<Tab>(initial)
  const tabs = [
    ...(can('studio.settings')
      ? [
          { value: 'studio' as Tab, label: 'Studio & branding' },
          { value: 'hours' as Tab, label: 'Opening hours' },
          { value: 'booking' as Tab, label: 'Booking rules' },
        ]
      : []),
    ...(can('studio.billing') ? [{ value: 'payments' as Tab, label: 'Payments' }] : []),
    { value: 'account' as Tab, label: 'My account' },
  ]
  return (
    <>
      <PageHeader title="Settings" />
      <Tabs value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'studio' && <StudioProfile />}
      {tab === 'hours' && <Hours />}
      {tab === 'booking' && <BookingRules />}
      {tab === 'payments' && <Payments />}
      {tab === 'account' && <AccountSettings showPrivacy={false} />}
    </>
  )
}

export default function SettingsPage() {
  return <Suspense><Settings /></Suspense>
}
