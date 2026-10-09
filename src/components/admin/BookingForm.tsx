'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type Booking, type BookingStatus } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { duration, money } from '@/lib/format'
import { studioDateTime, studioToday, toStudioInputs } from '@/lib/time'
import { Button, Checkbox, Field, Input, Modal, Select, Tabs, Textarea, errorMessage } from '../ui'

export interface BookingDraft {
  date?: string
  time?: string
  roomId?: string
}

/** Create a booking for a client or walk-in, or reschedule/reassign an existing one. */
export function BookingForm({
  open,
  onClose,
  booking,
  draft,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  booking?: Booking | null
  draft?: BookingDraft
  onSaved?: (b: Booking) => void
}) {
  const studio = useRequiredStudio()
  const qc = useQueryClient()
  const editing = !!booking
  const packages = useQuery({ queryKey: ['packages', 'all'], queryFn: api.packages.all, enabled: open })
  const rooms = useQuery({ queryKey: ['rooms', 'all'], queryFn: api.rooms.all, enabled: open })
  const engineers = useQuery({ queryKey: ['engineers'], queryFn: api.engineers.list, enabled: open })
  const gear = useQuery({ queryKey: ['equipment', 'all'], queryFn: api.equipment.all, enabled: open })
  const clientProjects = useQuery({
    queryKey: ['projects', 'list', false],
    queryFn: () => api.projects.list(),
    enabled: open && editing && !!booking?.clientId,
  })
  const [clientSearch, setClientSearch] = useState('')
  const clients = useQuery({
    queryKey: ['clients', 'search', clientSearch],
    queryFn: () => api.clients.list(clientSearch || undefined),
    enabled: open && !editing,
  })

  const init = () => {
    const at = booking ? toStudioInputs(booking.startsAt, studio.timezone) : null
    return {
      who: 'client' as 'client' | 'walkin',
      clientId: '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      packageId: booking?.packageId ?? '',
      roomId: booking?.roomId ?? draft?.roomId ?? '',
      engineerId: booking?.engineerId ?? '',
      equipmentIds: booking?.equipment.map((e) => e.id) ?? ([] as string[]),
      date: at?.date ?? draft?.date ?? studioToday(studio.timezone),
      time: at?.time ?? draft?.time ?? '10:00',
      minutes: booking ? (new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) / 60_000 : 60,
      status: 'CONFIRMED' as BookingStatus,
      customPrice: false,
      price: booking ? String(booking.totalAmount) : '',
      notes: '',
      internalNotes: booking?.internalNotes ?? '',
      projectId: booking?.projectId ?? '',
    }
  }
  const [f, setF] = useState(init)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form each time it opens
    if (open) setF(init())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open
  }, [open, booking?.id])

  const pkg = packages.data?.find((p) => p.id === f.packageId)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- default length follows the package
    if (pkg && !editing) setF((s) => ({ ...s, minutes: pkg.durationMinutes }))
  }, [pkg, editing])

  const roomChoices = useMemo(
    () => (rooms.data ?? []).filter((r) => r.isActive && (!pkg || !pkg.roomIds.length || pkg.roomIds.includes(r.id))),
    [rooms.data, pkg],
  )
  const minutes = pkg?.pricingType === 'FIXED' ? pkg.durationMinutes : f.minutes
  const gearTotal = (gear.data ?? []).filter((g) => f.equipmentIds.includes(g.id)).reduce((s, g) => s + g.pricePerBooking, 0)
  const computed = pkg ? Math.round((pkg.pricingType === 'HOURLY' ? (pkg.price * minutes) / 60 : pkg.price) + gearTotal) : 0

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const startsAt = studioDateTime(f.date, f.time, studio.timezone)
      const endsAt = new Date(new Date(startsAt).getTime() + minutes * 60_000).toISOString()
      let saved: Booking
      if (editing) {
        saved = await api.bookings.update(booking!.id, {
          roomId: f.roomId,
          engineerId: f.engineerId || null,
          equipmentIds: f.equipmentIds,
          startsAt,
          endsAt,
          internalNotes: f.internalNotes,
          projectId: f.projectId || null,
          ...(f.customPrice && f.price !== '' ? { totalAmount: Number(f.price) } : {}),
        })
      } else {
        saved = await api.bookings.create({
          packageId: f.packageId,
          roomId: f.roomId || undefined,
          engineerId: f.engineerId || undefined,
          equipmentIds: f.equipmentIds.length ? f.equipmentIds : undefined,
          startsAt,
          endsAt: pkg?.pricingType === 'HOURLY' ? endsAt : undefined,
          ...(f.who === 'client'
            ? { clientId: f.clientId }
            : { guestName: f.guestName.trim(), guestEmail: f.guestEmail.trim() || undefined, guestPhone: f.guestPhone.trim() || undefined }),
          status: f.status,
          totalOverride: f.customPrice && f.price !== '' ? Number(f.price) : undefined,
          notes: f.notes.trim() || undefined,
          internalNotes: f.internalNotes.trim() || undefined,
        })
      }
      toast.success(editing ? 'Booking updated' : 'Booking created')
      void qc.invalidateQueries({ queryKey: ['bookings'] })
      void qc.invalidateQueries({ queryKey: ['today'] })
      onSaved?.(saved)
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const set = <K extends keyof ReturnType<typeof init>>(k: K, v: ReturnType<typeof init>[K]) => setF((s) => ({ ...s, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={editing ? `Edit ${booking!.reference}` : 'New booking'}
      footer={
        <>
          <Button variant="glass" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="booking-form" loading={busy}>{editing ? 'Save changes' : 'Create booking'}</Button>
        </>
      }
    >
      <form id="booking-form" onSubmit={save} className="space-y-4">
        {!editing && (
          <>
            <Tabs value={f.who} onChange={(v) => set('who', v)} tabs={[{ value: 'client', label: 'Client' }, { value: 'walkin', label: 'Walk-in' }]} />
            {f.who === 'client' ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Search clients"><Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Name, email, phone" /></Field>
                <Field label="Client">
                  <Select required value={f.clientId} onChange={(e) => set('clientId', e.target.value)}>
                    <option value="">Choose…</option>
                    {clients.data?.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
                  </Select>
                </Field>
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Name"><Input required value={f.guestName} onChange={(e) => set('guestName', e.target.value)} /></Field>
                <Field label="Email" hint="For the confirmation email"><Input type="email" value={f.guestEmail} onChange={(e) => set('guestEmail', e.target.value)} /></Field>
                <Field label="Phone"><Input type="tel" value={f.guestPhone} onChange={(e) => set('guestPhone', e.target.value)} /></Field>
              </div>
            )}
          </>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Service">
            <Select required value={f.packageId} onChange={(e) => set('packageId', e.target.value)} disabled={editing}>
              <option value="">Choose…</option>
              {packages.data?.filter((p) => p.isActive || p.id === f.packageId).map((p) => (
                <option key={p.id} value={p.id}>{p.name} · {money(p.price, studio.currency)}{p.pricingType === 'HOURLY' ? '/h' : ''}</option>
              ))}
            </Select>
          </Field>
          <Field label="Room">
            <Select required={editing} value={f.roomId} onChange={(e) => set('roomId', e.target.value)}>
              {!editing && <option value="">First free room</option>}
              {roomChoices.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Date"><input type="date" required className="input-studio text-sm" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><input type="time" required step={900} className="input-studio text-sm" value={f.time} onChange={(e) => set('time', e.target.value)} /></Field>
            <Field label="Length">
              {pkg?.pricingType === 'FIXED' ? (
                <Input value={duration(pkg.durationMinutes)} disabled />
              ) : (
                <Select value={f.minutes} onChange={(e) => set('minutes', Number(e.target.value))}>
                  {Array.from({ length: 24 }, (_, i) => (i + 1) * 30).filter((m) => !pkg || m >= pkg.durationMinutes).map((m) => (
                    <option key={m} value={m}>{duration(m)}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <Field label="Engineer">
            <Select value={f.engineerId} onChange={(e) => set('engineerId', e.target.value)}>
              <option value="">None</option>
              {engineers.data?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Field>
          {!editing && (
            <Field label="Status">
              <Select value={f.status} onChange={(e) => set('status', e.target.value as BookingStatus)}>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Awaiting confirmation</option>
              </Select>
            </Field>
          )}
        </div>

        {(gear.data?.filter((g) => g.isActive).length ?? 0) > 0 && (
          <fieldset>
            <legend className="text-xs font-medium text-text-muted mb-2">Equipment</legend>
            <div className="flex flex-wrap gap-2">
              {gear.data!.filter((g) => g.isActive).map((g) => {
                const on = f.equipmentIds.includes(g.id)
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => set('equipmentIds', on ? f.equipmentIds.filter((x) => x !== g.id) : [...f.equipmentIds, g.id])}
                    className={`chip ${on ? 'chip-purple' : 'bg-white/5 text-text-muted'}`}
                  >
                    {g.name}{g.pricePerBooking > 0 ? ` +${money(g.pricePerBooking, studio.currency)}` : ''}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <div className="glass-card rounded-lg p-4 space-y-3">
          <p className="text-sm flex justify-between">
            <span className="text-text-muted">Price from the service</span>
            <span className="font-mono">{pkg ? money(computed, studio.currency) : '—'}</span>
          </p>
          <Checkbox checked={f.customPrice} onChange={(e) => set('customPrice', e.target.checked)} label="Agreed a different price" />
          {f.customPrice && (
            <Field label={`Price (${studio.currency})`}><Input type="number" min={0} required value={f.price} onChange={(e) => set('price', e.target.value)} /></Field>
          )}
        </div>

        {editing && booking?.clientId && (
          <Field label="Project" hint="Shows this session on the project page">
            <Select value={f.projectId} onChange={(e) => set('projectId', e.target.value)}>
              <option value="">None</option>
              {clientProjects.data?.filter((p) => p.clientId === booking.clientId).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </Field>
        )}
        {!editing && <Field label="Notes for the client"><Textarea rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>}
        <Field label="Team notes" hint="Never shown to the client"><Textarea rows={2} value={f.internalNotes} onChange={(e) => set('internalNotes', e.target.value)} /></Field>
      </form>
    </Modal>
  )
}
