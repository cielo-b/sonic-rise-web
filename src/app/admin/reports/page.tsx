'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { money } from '@/lib/format'
import { METHOD_LABEL, PURPOSE_LABEL } from '@/lib/labels'
import { addDays, studioDateTime, studioToday } from '@/lib/time'
import { Card, EmptyState, Loading, PageHeader, Select } from '@/components/ui'

const RANGES = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 365, label: 'Last 12 months' },
]

function Bars({ rows, value, label, format }: { rows: Record<string, unknown>[]; value: string; label: string; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[value])))
  if (!rows.length) return <p className="text-sm text-text-muted">No data in this period.</p>
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={i}>
          <div className="flex justify-between text-sm mb-1"><span>{String(r[label])}</span><span className="font-mono">{format(Number(r[value]))}</span></div>
          <div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-brand-purple" style={{ width: `${(Number(r[value]) / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}

export default function ReportsPage() {
  const studio = useRequiredStudio()
  const [days, setDays] = useState(30)
  const today = studioToday(studio.timezone)
  const from = studioDateTime(addDays(today, -days + 1), '00:00', studio.timezone)
  const to = studioDateTime(addDays(today, 1), '00:00', studio.timezone)
  const q = useQuery({ queryKey: ['reports', days], queryFn: () => api.reports.overview(from, to) })
  const r = q.data
  const m = (n: number) => money(n, studio.currency)
  const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="From real payments and bookings."
        actions={<Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-auto">{RANGES.map((x) => <option key={x.days} value={x.days}>{x.label}</option>)}</Select>}
      />
      {!r ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5"><p className="font-headline text-2xl font-bold">{m(r.revenue.total)}</p><p className="text-xs text-text-muted">Received ({r.revenue.payments} payments)</p></Card>
            <Card className="p-5"><p className="font-headline text-2xl font-bold">{r.bookings.total}</p><p className="text-xs text-text-muted">Sessions in period</p></Card>
            <Card className="p-5"><p className="font-headline text-2xl font-bold">{pct(r.bookings.noShowRate)}</p><p className="text-xs text-text-muted">No-show rate</p></Card>
            <Card className="p-5"><p className="font-headline text-2xl font-bold">{pct(r.bookings.cancellationRate)}</p><p className="text-xs text-text-muted">Cancellation rate</p></Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6"><p className="font-headline font-semibold mb-4">Revenue by room</p><Bars rows={r.revenueByRoom} value="revenue" label="name" format={m} /></Card>
            <Card className="p-6"><p className="font-headline font-semibold mb-4">Revenue by engineer</p><Bars rows={r.revenueByEngineer} value="revenue" label="name" format={m} /></Card>
            <Card className="p-6"><p className="font-headline font-semibold mb-4">Revenue by service</p><Bars rows={r.revenueByPackage} value="revenue" label="name" format={m} /></Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <p className="font-headline font-semibold mb-1">Room utilisation</p>
              <p className="text-xs text-text-muted mb-4">Booked hours ÷ opening hours</p>
              {r.utilization.length === 0 ? (
                <p className="text-sm text-text-muted">No rooms.</p>
              ) : r.utilization[0].openHours === null ? (
                <>
                  <p className="text-xs text-amber-300 mb-3">Set opening hours in Settings to see utilisation rates.</p>
                  <Bars rows={r.utilization} value="bookedHours" label="name" format={(n) => `${n} h`} />
                </>
              ) : (
                <ul className="space-y-2.5">
                  {r.utilization.map((u) => (
                    <li key={u.id}>
                      <div className="flex justify-between text-sm mb-1"><span>{u.name}</span><span className="font-mono">{pct(u.rate)} · {u.bookedHours}/{u.openHours} h</span></div>
                      <div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-brand-cyan" style={{ width: `${(u.rate ?? 0) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-6"><p className="font-headline font-semibold mb-4">Top clients</p><Bars rows={r.topClients} value="paid" label="name" format={m} /></Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <p className="font-headline font-semibold mb-4">Money in by type</p>
              <Bars rows={r.revenueByPurpose.map((x) => ({ ...x, name: PURPOSE_LABEL[x.purpose] }))} value="total" label="name" format={m} />
              <p className="font-headline font-semibold mt-6 mb-4">By method</p>
              <Bars rows={r.revenueByMethod.map((x) => ({ ...x, name: METHOD_LABEL[x.method] }))} value="total" label="name" format={m} />
            </Card>
            <Card className="p-6">
              <p className="font-headline font-semibold mb-4">Last 12 months</p>
              {r.monthly.length === 0 ? (
                <EmptyState title="No activity yet" />
              ) : (
                <div className="flex items-end gap-2 h-48">
                  {r.monthly.map((mo) => {
                    const max = Math.max(1, ...r.monthly.map((x) => x.revenue))
                    return (
                      <div key={mo.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${mo.month}: ${m(mo.revenue)} · ${mo.bookings} sessions`}>
                        <div className="w-full rounded-t bg-brand-purple/70" style={{ height: `${Math.max(2, (mo.revenue / max) * 100)}%` }} />
                        <span className="text-[10px] font-mono text-outline">{mo.month.slice(5)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
