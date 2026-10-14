'use client'

import { useMemo, useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { api, type Booking } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDate, formatTime } from '@/lib/format'
import { addDays, hhmm, minutesOf, studioDateTime, studioToday, toStudioInputs, weekday } from '@/lib/time'
import { Button, EmptyState, Loading, PageHeader, Select, Tabs, errorMessage } from '@/components/ui'
import { BookingForm, type BookingDraft } from '@/components/admin/BookingForm'
import { BookingPanel } from '@/components/admin/BookingPanel'
import { CalendarSyncModal } from '@/components/admin/CalendarSyncModal'

const HOUR_PX = 56
const VISIBLE = ['PENDING_DEPOSIT', 'PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW']

export default function CalendarPage() {
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const qc = useQueryClient()
  const tz = studio.timezone
  const [view, setView] = useState<'day' | 'week'>('day')
  const [date, setDate] = useState(() => studioToday(tz))
  const [engineerId, setEngineerId] = useState('')
  const [draft, setDraft] = useState<BookingDraft | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [showSyncModal, setShowSyncModal] = useState(false)

  // Drag-and-drop state
  const [draggingBooking, setDraggingBooking] = useState<{
    id: string
    durationMin: number
    name: string
  } | null>(null)
  const [dragOverRoomId, setDragOverRoomId] = useState<string | null>(null)
  const [dragOverMin, setDragOverMin] = useState<number | null>(null)

  // Resizing state
  const [resizingBooking, setResizingBooking] = useState<{
    id: string
    startMin: number
    originalEndMin: number
    currentEndMin: number
    date: string
  } | null>(null)

  const rangeStart = view === 'day' ? date : addDays(date, -((weekday(date) + 6) % 7)) // weeks start Monday
  const days = view === 'day' ? 1 : 7
  const from = studioDateTime(rangeStart, '00:00', tz)
  const to = studioDateTime(addDays(rangeStart, days), '00:00', tz)

  const rooms = useQuery({ queryKey: ['rooms', 'all'], queryFn: api.rooms.all })
  const engineers = useQuery({ queryKey: ['engineers'], queryFn: api.engineers.list })
  const bookingsQueryKey = ['bookings', 'range', from, to, engineerId]
  const bookings = useQuery({
    queryKey: bookingsQueryKey,
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
    let eMin = e.date === date ? minutesOf(e.time) : endMin

    // If currently being dynamically resized
    if (resizingBooking && resizingBooking.id === b.id) {
      eMin = resizingBooking.currentEndMin
    }

    return {
      top: ((Math.max(sMin, startMin) - startMin) / 60) * HOUR_PX,
      height: Math.max(26, ((Math.min(eMin, endMin) - Math.max(sMin, startMin)) / 60) * HOUR_PX),
    }
  }

  // Handle Drag & Drop Rescheduling
  async function handleDropOnRoom(roomId: string, roomName: string, clientY: number, columnTop: number) {
    if (!draggingBooking) return
    const offsetY = Math.max(0, clientY - columnTop)
    const rawMin = (offsetY / HOUR_PX) * 60
    // Snap to nearest 15 minutes
    const snappedDelta = Math.round(rawMin / 15) * 15
    const targetStartMin = Math.min(endMin - 30, Math.max(startMin, startMin + snappedDelta))
    const targetEndMin = targetStartMin + draggingBooking.durationMin

    const newStartTime = hhmm(targetStartMin)
    const newEndTime = hhmm(targetEndMin)
    const startsAt = studioDateTime(date, newStartTime, tz)
    const endsAt = studioDateTime(date, newEndTime, tz)

    const bookingId = draggingBooking.id
    setDraggingBooking(null)
    setDragOverRoomId(null)
    setDragOverMin(null)

    try {
      await api.bookings.update(bookingId, { roomId, startsAt, endsAt })
      toast.success(`Rescheduled ${draggingBooking.name} to ${newStartTime} in ${roomName}`)
      void qc.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  // Handle Duration Resizing
  function startResizing(e: React.MouseEvent, b: Booking) {
    e.stopPropagation()
    const s = toStudioInputs(b.startsAt, tz)
    const eTime = toStudioInputs(b.endsAt, tz)
    const sMin = minutesOf(s.time)
    const origEndMin = minutesOf(eTime.time)

    setResizingBooking({
      id: b.id,
      startMin: sMin,
      originalEndMin: origEndMin,
      currentEndMin: origEndMin,
      date: s.date,
    })

    const startY = e.clientY

    function onMouseMove(moveEvent: MouseEvent) {
      const deltaPx = moveEvent.clientY - startY
      const deltaMin = Math.round(((deltaPx / HOUR_PX) * 60) / 15) * 15
      const newEnd = Math.max(sMin + 15, origEndMin + deltaMin)
      setResizingBooking((prev) => (prev ? { ...prev, currentEndMin: newEnd } : null))
    }

    async function onMouseUp(upEvent: MouseEvent) {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)

      const deltaPx = upEvent.clientY - startY
      const deltaMin = Math.round(((deltaPx / HOUR_PX) * 60) / 15) * 15
      const finalEndMin = Math.max(sMin + 15, origEndMin + deltaMin)

      setResizingBooking(null)

      if (finalEndMin !== origEndMin) {
        const newEndTime = hhmm(finalEndMin)
        const endsAt = studioDateTime(s.date, newEndTime, tz)
        try {
          await api.bookings.update(b.id, { endsAt })
          toast.success(`Booking duration updated to ${formatTime(b.startsAt, tz)}–${newEndTime}`)
          void qc.invalidateQueries({ queryKey: ['bookings'] })
        } catch (err) {
          toast.error(errorMessage(err))
        }
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const step = view === 'day' ? 1 : 7
  return (
    <>
      <PageHeader
        title="Calendar"
        actions={
          <>
            <Button
              variant="glass"
              onClick={() => setShowSyncModal(true)}
              title="Sync with Google Calendar or Apple iCal"
            >
              <CalendarIcon size={16} className="text-brand-cyan" /> Sync Calendar
            </Button>
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
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${activeRooms.length}, minmax(180px, 1fr))` }}>
            <div className="h-10 border-b border-white/10" />
            {activeRooms.map((r) => (
              <div key={r.id} className="h-10 px-3 flex items-center justify-between border-b border-l border-white/10 text-sm font-medium">
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                  {r.name}
                </span>
                <span className="text-[10px] text-text-muted font-mono">Lane</span>
              </div>
            ))}

            {/* Time labels column */}
            <div className="relative">
              {hours.map((h) => (
                <div key={h} className="text-[11px] text-outline font-mono pr-2 text-right border-b border-white/5" style={{ height: HOUR_PX }}>
                  {hhmm(h)}
                </div>
              ))}
            </div>

            {/* Room Lanes with interactive drag & drop */}
            {activeRooms.map((r) => (
              <div
                key={r.id}
                className={`relative border-l border-white/10 transition-colors ${
                  dragOverRoomId === r.id ? 'bg-brand-cyan/[0.05]' : ''
                }`}
                style={{ height: hours.length * HOUR_PX }}
                onDragOver={(e) => {
                  if (!can('bookings.write') || !draggingBooking) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverRoomId(r.id)
                  const rect = e.currentTarget.getBoundingClientRect()
                  const offsetY = e.clientY - rect.top
                  const min = startMin + Math.round(((offsetY / HOUR_PX) * 60) / 15) * 15
                  setDragOverMin(min)
                }}
                onDragLeave={() => {
                  if (dragOverRoomId === r.id) {
                    setDragOverRoomId(null)
                    setDragOverMin(null)
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const rect = e.currentTarget.getBoundingClientRect()
                  void handleDropOnRoom(r.id, r.name, e.clientY, rect.top)
                }}
              >
                {/* Background grid buttons for clicking to book */}
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

                {/* Ghost Drop Preview */}
                {dragOverRoomId === r.id && dragOverMin !== null && draggingBooking && (
                  <div
                    className="absolute left-1 right-1 rounded-md border-2 border-dashed border-brand-cyan bg-brand-cyan/20 pointer-events-none z-20 flex items-center justify-center text-xs font-mono font-bold text-brand-cyan"
                    style={{
                      top: ((dragOverMin - startMin) / 60) * HOUR_PX,
                      height: (draggingBooking.durationMin / 60) * HOUR_PX,
                    }}
                  >
                    Move here: {hhmm(dragOverMin)}
                  </div>
                )}

                {/* Bookings cards */}
                {list.filter((b) => b.roomId === r.id).map((b) => {
                  const pos = position(b)
                  const s = toStudioInputs(b.startsAt, tz)
                  const e = toStudioInputs(b.endsAt, tz)
                  const durationMin = Math.max(15, minutesOf(e.time) - minutesOf(s.time))
                  const canDrag = can('bookings.write')

                  return (
                    <div
                      key={b.id}
                      draggable={canDrag}
                      onDragStart={(evt) => {
                        if (!canDrag) return
                        evt.dataTransfer.setData('text/plain', b.id)
                        evt.dataTransfer.effectAllowed = 'move'
                        setDraggingBooking({
                          id: b.id,
                          durationMin,
                          name: b.client?.name ?? b.guestName ?? 'Booking',
                        })
                      }}
                      onDragEnd={() => {
                        setDraggingBooking(null)
                        setDragOverRoomId(null)
                        setDragOverMin(null)
                      }}
                      onClick={() => setOpenId(b.id)}
                      className={`group absolute left-1 right-1 rounded-md px-2 py-1 text-left text-xs overflow-hidden border select-none transition-shadow ${
                        canDrag ? 'cursor-grab active:cursor-grabbing hover:shadow-lg hover:brightness-110' : 'cursor-pointer'
                      }`}
                      style={{
                        top: pos.top,
                        height: pos.height,
                        background: `color-mix(in srgb, ${r.color} 25%, transparent)`,
                        borderColor: `color-mix(in srgb, ${r.color} 60%, transparent)`,
                        opacity: ['PENDING', 'PENDING_DEPOSIT'].includes(b.status) ? 0.75 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold truncate text-text-primary">
                          {b.client?.name ?? b.guestName}
                        </p>
                        {canDrag && (
                          <span className="opacity-0 group-hover:opacity-60 text-white transition-opacity">
                            <GripVertical size={12} />
                          </span>
                        )}
                      </div>
                      <p className="truncate text-text-muted">
                        {formatTime(b.startsAt, tz)}–{formatTime(b.endsAt, tz)} · {b.package.name}
                      </p>
                      {b.engineer && <p className="truncate text-text-muted">{b.engineer.name}</p>}

                      {/* Bottom Resize Handle */}
                      {canDrag && (
                        <div
                          onMouseDown={(evt) => startResizing(evt, b)}
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-brand-cyan/40 transition-colors"
                          title="Drag to resize duration"
                        />
                      )}
                    </div>
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
      <CalendarSyncModal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        engineers={engineers.data ?? []}
      />
    </>
  )
}
