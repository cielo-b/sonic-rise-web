'use client'

import { Suspense, useState } from 'react'
import { useNow } from '@/lib/time'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { api, type BookingStatus } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDateTime, formatTime, money } from '@/lib/format'
import { Badge, Button, EmptyState, Input, Loading, PageHeader, Tabs } from '@/components/ui'
import { BookingForm } from '@/components/admin/BookingForm'
import { BookingPanel } from '@/components/admin/BookingPanel'

type Filter = 'upcoming' | 'PENDING' | 'past' | 'CANCELLED' | 'all'

function Bookings() {
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const initial = useSearchParams().get('status') === 'PENDING' ? 'PENDING' : 'upcoming'
  const [filter, setFilter] = useState<Filter>(initial)
  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const q = useQuery({ queryKey: ['bookings', 'all'], queryFn: () => api.bookings.list() })

  const now = useNow()
  const active: BookingStatus[] = ['PENDING_DEPOSIT', 'PENDING', 'CONFIRMED']
  const rows = (q.data ?? [])
    .filter((b) => {
      const end = new Date(b.endsAt).getTime()
      if (filter === 'upcoming') return active.includes(b.status) && end >= now
      if (filter === 'PENDING') return ['PENDING', 'PENDING_DEPOSIT'].includes(b.status)
      if (filter === 'past') return end < now && b.status !== 'CANCELLED'
      if (filter === 'CANCELLED') return b.status === 'CANCELLED'
      return true
    })
    .filter((b) => {
      const s = search.trim().toLowerCase()
      if (!s) return true
      return [b.reference, b.client?.name, b.client?.email, b.guestName, b.package.name, b.room.name].some((v) => v?.toLowerCase().includes(s))
    })
    .sort((a, b) => (filter === 'upcoming' || filter === 'PENDING' ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt)))

  const count = (f: Filter) =>
    (q.data ?? []).filter((b) =>
      f === 'PENDING' ? ['PENDING', 'PENDING_DEPOSIT'].includes(b.status) : f === 'upcoming' ? active.includes(b.status) && new Date(b.endsAt).getTime() >= now : false,
    ).length

  return (
    <>
      <PageHeader title="Bookings" actions={can('bookings.write') && <Button onClick={() => setNewOpen(true)}><Plus size={16} /> New booking</Button>} />
      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'upcoming', label: 'Upcoming', count: count('upcoming') },
          { value: 'PENDING', label: 'Needs confirmation', count: count('PENDING') },
          { value: 'past', label: 'Past' },
          { value: 'CANCELLED', label: 'Cancelled' },
          { value: 'all', label: 'All' },
        ]}
      />
      <Input placeholder="Search by client, reference, service or room" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md mb-4" />
      {q.isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="No bookings here" />
      ) : (
        <div className="glass-card rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-white/10">
                {['When', 'Client', 'Service', 'Room', 'Engineer', 'Total', 'Paid', 'Status'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} onClick={() => setOpenId(b.id)} className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(b.startsAt, studio.timezone)}–{formatTime(b.endsAt, studio.timezone)}</td>
                  <td className="px-4 py-3">{b.client?.name ?? <>{b.guestName} <span className="text-outline">(walk-in)</span></>}</td>
                  <td className="px-4 py-3">{b.package.name}</td>
                  <td className="px-4 py-3">{b.room.name}</td>
                  <td className="px-4 py-3">{b.engineer?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono">{money(b.totalAmount, b.currency)}</td>
                  <td className="px-4 py-3 font-mono">{money(b.amountPaid, b.currency)}</td>
                  <td className="px-4 py-3"><Badge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <BookingForm open={newOpen} onClose={() => setNewOpen(false)} />
      <BookingPanel id={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

export default function BookingsPage() {
  return <Suspense><Bookings /></Suspense>
}
