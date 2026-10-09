'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { api, type Booking } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDate, formatTime } from '@/lib/format'
import { addDays, hhmm, minutesOf, studioDateTime, studioToday, toStudioInputs, weekday } from '@/lib/time'
import { Button, EmptyState, Loading, PageHeader, Select, Tabs } from '@/components/ui'
import { BookingForm, type BookingDraft } from '@/components/admin/BookingForm'
import { BookingPanel } from '@/components/admin/BookingPanel'

const HOUR_PX = 56
const VISIBLE = ['PENDING_DEPOSIT', 'PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW']

export default function CalendarPage() {
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const tz = studio.timezone
  const [view, setView] = useState<'day' | 'week'>('day')
  const [date, setDate] = useState(() => studioToday(tz))
  const [engineerId, setEngineerId] = useState('')
  const [draft, setDraft] = useState<BookingDraft | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const rangeStart = view === 'day' ? date : addDays(date, -((weekday(date) + 6) % 7)) // weeks start Monday
  const days = view === 'day' ? 1 : 7
  const from = studioDateTime(rangeStart, '00:00', tz)
  const to = studioDateTime(addDays(rangeStart, days), '00:00', tz)

  const rooms = useQuery({ queryKey: ['rooms', 'all'], queryFn: api.rooms.all })
  const engineers = useQuery({ queryKey: ['engineers'], queryFn: api.engineers.list })
  const bookings = useQuery({
    queryKey: ['bookings', 'range', from, to, engineerId],
    queryFn: () => api.bookings.list({ from, to, engineerId: engineerId || undefined }),
  })
  const activeRooms = (rooms.data ?? []).filter((r) => r.isActive)
  const list = (bookings.data ?? []).filter((b) => VISIBLE.includes(b.status))

  // Visible hours: the day's opening hours, else 07:00–23:00.
  const window = studio.openingHours?.[String(weekday(date)) as '0']
  const startMin = window ? Math.floor(minutesOf(window.open) / 60) * 60 : 7 * 60
  const endMin = window ? (window.close === '00:00' ? 24 * 60 : Math.ceil(minutesOf(window.close) / 60) * 60) : 23 * 60
  const hours = useMemo(() => Array.from({ length: (endMin - startMin) / 60 }, (_, i) => startMin + i * 60), [startMin, endMin])

  function position(b: Booking) {
    const s = toStudioInputs(b.startsAt, tz)
    const e = toStudioInputs(b.endsAt, tz)
    const sMin = s.date === date ? minutesOf(s.time) : startMin
    const eMin = e.date === date ? minutesOf(e.time) : endMin
    return { top: ((Math.max(sMin, startMin) - startMin) / 60) * HOUR_PX, height: Math.max(22, ((Math.min(eMin, endMin) - Math.max(sMin, startMin)) / 60) * HOUR_PX) }
  }

  const step = view === 'day' ? 1 : 7
  return (
    <>
      <PageHeader
        title="Calendar"
        actions={
          <>
            {(engineers.data?.length ?? 0) > 0 && (
              <Select value={engineerId} onChange={(e) => setEngineerId(e.target.value)} className="w-auto">
                <option value="">Everyone</option>
                {engineers.data!.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            )}
            {can('bookings.write') && <Button onClick={() => setDraft({ date })}><Plus size={16} /> New booking</Button>}
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button variant="glass" onClick={() => setDate(addDays(date, -step))} aria-label="Previous"><ChevronLeft size={16} /></Button>
        <Button variant="glass" onClick={() => setDate(studioToday(tz))}>Today</Button>
        <Button variant="glass" onClick={() => setDate(addDays(date, step))} aria-label="Next"><ChevronRight size={16} /></Button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="input-studio text-sm w-auto" />
        <span className="font-headline font-semibold">
          {view === 'day'
            ? formatDate(`${date}T12:00:00Z`, 'UTC', 'en', { weekday: 'long' })
            : `${formatDate(`${rangeStart}T12:00:00Z`, 'UTC')} – ${formatDate(`${addDays(rangeStart, 6)}T12:00:00Z`, 'UTC')}`}
        </span>
      </div>
      <Tabs value={view} onChange={setView} tabs={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} />

      {rooms.isLoading || bookings.isLoading ? (
        <Loading />
      ) : activeRooms.length === 0 ? (
        <EmptyState title="No rooms yet">Add your rooms under Services, rooms & gear to start taking bookings.</EmptyState>
      ) : view === 'day' ? (
        <div className="glass-card rounded-xl overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${activeRooms.length}, minmax(160px, 1fr))` }}>
            <div className="h-10 border-b border-white/10" />
            {activeRooms.map((r) => (
              <div key={r.id} className="h-10 px-3 flex items-center gap-2 border-b border-l border-white/10 text-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} /> {r.name}
              </div>
            ))}
            <div className="relative">
              {hours.map((h) => (
                <div key={h} className="text-[11px] text-outline font-mono pr-2 text-right border-b border-white/5" style={{ height: HOUR_PX }}>
                  {hhmm(h)}
                </div>
              ))}
            </div>
            {activeRooms.map((r) => (
              <div key={r.id} className="relative border-l border-white/10" style={{ height: hours.length * HOUR_PX }}>
                {hours.map((h) => (
                  <button
                    key={h}
                    disabled={!can('bookings.write')}
                    onClick={() => setDraft({ date, time: hhmm(h), roomId: r.id })}
                    className="block w-full border-b border-white/5 hover:bg-white/[0.03] disabled:hover:bg-transparent"
                    style={{ height: HOUR_PX }}
                    aria-label={`New booking in ${r.name} at ${hhmm(h)}`}
                  />
                ))}
                {list.filter((b) => b.roomId === r.id).map((b) => {
                  const pos = position(b)
                  return (
                    <button
                      key={b.id}
                      onClick={() => setOpenId(b.id)}
                      className="absolute left-1 right-1 rounded-md px-2 py-1 text-left text-xs overflow-hidden border"
                      style={{
                        top: pos.top,
                        height: pos.height,
                        background: `color-mix(in srgb, ${r.color} 25%, transparent)`,
                        borderColor: `color-mix(in srgb, ${r.color} 60%, transparent)`,
                        opacity: ['PENDING', 'PENDING_DEPOSIT'].includes(b.status) ? 0.75 : 1,
                      }}
                    >
                      <p className="font-medium truncate">{b.client?.name ?? b.guestName}</p>
                      <p className="truncate text-text-muted">{formatTime(b.startsAt, tz)}–{formatTime(b.endsAt, tz)} · {b.package.name}</p>
                      {b.engineer && <p className="truncate text-text-muted">{b.engineer.name}</p>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: 7 }, (_, i) => addDays(rangeStart, i)).map((d) => {
            const dayList = list.filter((b) => toStudioInputs(b.startsAt, tz).date === d).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
            return (
              <div key={d} className="glass-card rounded-xl p-4">
                <button className="font-headline font-semibold text-sm hover:text-brand-cyan" onClick={() => { setDate(d); setView('day') }}>
                  {formatDate(`${d}T12:00:00Z`, 'UTC', 'en', { weekday: 'long' })}
                </button>
                {dayList.length === 0 ? (
                  <p className="text-sm text-outline mt-2">No sessions</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {dayList.map((b) => (
                      <li key={b.id}>
                        <button onClick={() => setOpenId(b.id)} className="w-full text-left text-sm flex items-center gap-3 hover:text-brand-cyan">
                          <span className="font-mono w-28 shrink-0">{formatTime(b.startsAt, tz)}–{formatTime(b.endsAt, tz)}</span>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.room.color }} />
                          <span className="truncate">{b.client?.name ?? b.guestName} · {b.package.name} · {b.room.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
      <BookingForm open={!!draft} onClose={() => setDraft(null)} draft={draft ?? undefined} />
      <BookingPanel id={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
