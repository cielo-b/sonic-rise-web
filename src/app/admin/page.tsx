'use client'

import { useState } from 'react'
import { useNow } from '@/lib/time'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDate, formatTime, money } from '@/lib/format'
import { Badge, Button, Card, Loading, PageHeader } from '@/components/ui'
import { BookingForm } from '@/components/admin/BookingForm'
import { BookingPanel } from '@/components/admin/BookingPanel'

/** Real setup progress for a new studio, from its own data. */
function GettingStarted() {
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const rooms = useQuery({ queryKey: ['rooms', 'all'], queryFn: api.rooms.all, enabled: can('resources.manage') })
  const packages = useQuery({ queryKey: ['packages', 'all'], queryFn: api.packages.all, enabled: can('resources.manage') })
  const settings = useQuery({ queryKey: ['studio', 'settings'], queryFn: api.studio.settings, enabled: can('studio.settings') })
  if (!can('resources.manage') || !can('studio.settings') || !rooms.data || !packages.data || !settings.data) return null
  const steps = [
    { done: rooms.data.length > 0, label: 'Add your rooms', href: '/admin/services?tab=rooms' },
    { done: packages.data.length > 0, label: 'Add services and prices', href: '/admin/services' },
    { done: Object.keys(settings.data.openingHours ?? {}).length > 0, label: 'Set opening hours', href: '/admin/settings' },
    { done: !!(studio.content?.heroTitle || studio.content?.aboutBody), label: 'Write your website text', href: '/admin/website' },
    { done: !!studio.content?.privacyPolicy, label: 'Publish your privacy policy', href: '/admin/website?tab=legal' },
    { done: settings.data.payments.configured, label: 'Connect pawaPay for mobile money', href: '/admin/settings?tab=payments', optional: !can('studio.billing') },
  ].filter((s) => !s.optional)
  if (steps.every((s) => s.done)) return null
  return (
    <Card className="p-6 mb-6">
      <p className="font-headline font-semibold">Get your studio ready</p>
      <p className="text-sm text-text-muted mt-1">{steps.filter((s) => s.done).length} of {steps.length} done</p>
      <ul className="mt-4 grid sm:grid-cols-2 gap-2">
        {steps.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`flex items-center gap-2 text-sm ${s.done ? 'text-outline line-through' : 'hover:text-brand-cyan'}`}>
              {s.done ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} />} {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Stat({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="glass-card rounded-xl p-5 hover:border-brand-purple/40">
      <p className="font-headline text-2xl font-bold">{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </Link>
  )
}

export default function Today() {
  const studio = useRequiredStudio()
  const { user, can } = useAuth()
  const today = useQuery({ queryKey: ['today'], queryFn: api.reports.today, refetchInterval: 60_000 })
  const now = useNow()
  const monthAgo = new Date(now - 30 * 86_400_000).toISOString()
  const report = useQuery({ queryKey: ['reports', '30d'], queryFn: () => api.reports.overview(monthAgo), enabled: can('reports.read') })
  const [newOpen, setNewOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <PageHeader
        title={`Hello, ${user!.name.split(' ')[0]}`}
        subtitle={today.data ? formatDate(`${today.data.date}T12:00:00Z`, 'UTC', 'en', { weekday: 'long' }) : undefined}
        actions={can('bookings.write') && <Button onClick={() => setNewOpen(true)}><Plus size={16} /> New booking</Button>}
      />
      <GettingStarted />
      {!today.data ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Requests waiting" value={today.data.pendingRequests} href="/admin/bookings?status=PENDING" />
            {can('finance.read') && <Stat label={`Unpaid invoices · ${money(today.data.unpaidInvoices.due, today.data.currency)}`} value={today.data.unpaidInvoices.count} href="/admin/billing?tab=invoices" />}
            <Stat label="Files waiting for clients" value={today.data.filesAwaitingClient} href="/admin/projects" />
            {can('clients.read') && <Stat label="New inquiries" value={today.data.openInquiries} href="/admin/inquiries" />}
          </div>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="font-headline font-semibold">Today’s sessions</p>
              <Link href="/admin/calendar" className="text-sm text-brand-cyan hover:underline">Calendar</Link>
            </div>
            {today.data.sessions.length === 0 ? (
              <p className="text-sm text-text-muted">No sessions today.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {today.data.sessions.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => setOpenId(s.id)} className="w-full text-left py-3 flex flex-wrap items-center gap-3 hover:bg-white/[0.02]">
                      <span className="font-mono text-sm w-28">{formatTime(s.startsAt, studio.timezone)}–{formatTime(s.endsAt, studio.timezone)}</span>
                      <span className="w-2 h-2 rounded-full" style={{ background: s.roomColor }} />
                      <span className="text-sm flex-1 min-w-40">
                        <span className="font-medium">{s.client ?? s.guestName}</span>
                        <span className="text-text-muted"> · {s.package} · {s.room}{s.engineer ? ` · ${s.engineer}` : ''}</span>
                      </span>
                      <Badge status={s.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {report.data && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="font-headline font-semibold">Last 30 days</p>
                <Link href="/admin/reports" className="text-sm text-brand-cyan hover:underline">Reports</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="font-headline text-xl font-bold">{money(report.data.revenue.total, report.data.currency)}</p><p className="text-text-muted text-xs">Received</p></div>
                <div><p className="font-headline text-xl font-bold">{report.data.bookings.total}</p><p className="text-text-muted text-xs">Sessions</p></div>
                <div><p className="font-headline text-xl font-bold">{report.data.bookings.noShowRate === null ? '—' : `${Math.round(report.data.bookings.noShowRate * 100)}%`}</p><p className="text-text-muted text-xs">No-show rate</p></div>
                <div><p className="font-headline text-xl font-bold">{report.data.bookings.cancellationRate === null ? '—' : `${Math.round(report.data.bookings.cancellationRate * 100)}%`}</p><p className="text-text-muted text-xs">Cancelled</p></div>
              </div>
            </Card>
          )}
        </div>
      )}
      <BookingForm open={newOpen} onClose={() => setNewOpen(false)} />
      <BookingPanel id={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
