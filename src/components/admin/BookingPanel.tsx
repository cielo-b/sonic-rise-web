'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type BookingStatus, type PaymentMethod } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime, formatTime, money } from '@/lib/format'
import { METHOD_LABEL, PURPOSE_LABEL } from '@/lib/labels'
import { Badge, Button, ConfirmButton, Field, Input, Loading, Modal, Select, errorMessage } from '../ui'
import { BookingForm } from './BookingForm'

export function BookingPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['booking', id], queryFn: () => api.bookings.get(id!), enabled: !!id })
  const payments = useQuery({
    queryKey: ['payments', 'booking', id],
    queryFn: () => api.payments.list({ bookingId: id! }),
    enabled: !!id && can('finance.read'),
  })
  const [editOpen, setEditOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [pay, setPay] = useState({ amount: '', method: 'CASH' as PaymentMethod, note: '' })
  const [busy, setBusy] = useState<string | null>(null)
  const b = q.data

  const refresh = () => {
    void q.refetch()
    void payments.refetch()
    void qc.invalidateQueries({ queryKey: ['bookings'] })
    void qc.invalidateQueries({ queryKey: ['today'] })
  }

  async function setStatus(status: BookingStatus) {
    setBusy(status)
    try {
      await api.bookings.update(id!, { status })
      toast.success('Updated — the client has been emailed')
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!b) return
    setBusy('pay')
    try {
      await api.payments.record({
        purpose: b.amountPaid < b.depositAmount ? 'DEPOSIT' : 'BOOKING_BALANCE',
        targetId: b.id,
        amount: Number(pay.amount),
        method: pay.method,
        note: pay.note.trim() || undefined,
      })
      toast.success('Payment recorded')
      setPayOpen(false)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const due = b ? Math.max(0, b.totalAmount - b.amountPaid) : 0
  const active = b && ['PENDING_DEPOSIT', 'PENDING', 'CONFIRMED'].includes(b.status)

  return (
    <>
      <Modal open={!!id && !editOpen && !payOpen} onClose={onClose} title={b ? `${b.reference} · ${b.package.name}` : 'Booking'} wide>
        {!b ? (
          <Loading />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <Badge status={b.status} />
              <span className="text-xs text-outline">{b.source === 'WEB' ? 'Booked online' : 'Booked by the team'}</span>
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-text-muted">Client</dt>
              <dd>
                {b.client ? (
                  can('clients.read') ? <Link href={`/admin/clients/${b.client.id}`} className="text-brand-cyan hover:underline">{b.client.name}</Link> : b.client.name
                ) : (
                  <>{b.guestName} <span className="text-outline">(walk-in)</span></>
                )}
                {(b.client?.phone ?? b.guestPhone) && <span className="text-outline"> · {b.client?.phone ?? b.guestPhone}</span>}
              </dd>
              <dt className="text-text-muted">When</dt>
              <dd>{formatDateTime(b.startsAt, studio.timezone)}–{formatTime(b.endsAt, studio.timezone)}</dd>
              <dt className="text-text-muted">Room</dt>
              <dd>{b.room.name}</dd>
              <dt className="text-text-muted">Engineer</dt>
              <dd>{b.engineer?.name ?? '—'}</dd>
              {b.equipment.length > 0 && (<><dt className="text-text-muted">Equipment</dt><dd>{b.equipment.map((e) => e.name).join(', ')}</dd></>)}
              <dt className="text-text-muted">Total</dt>
              <dd className="font-mono">{money(b.totalAmount, b.currency)}</dd>
              <dt className="text-text-muted">Deposit</dt>
              <dd className="font-mono">{money(b.depositAmount, b.currency)}</dd>
              <dt className="text-text-muted">Paid</dt>
              <dd className="font-mono">{money(b.amountPaid, b.currency)}{due > 0 && <span className="text-amber-300"> · {money(due, b.currency)} due</span>}</dd>
            </dl>
            {b.notes && <div className="text-sm"><p className="text-text-muted text-xs mb-1">Client notes</p><p className="whitespace-pre-line">{b.notes}</p></div>}
            {b.internalNotes && <div className="text-sm"><p className="text-text-muted text-xs mb-1">Team notes</p><p className="whitespace-pre-line">{b.internalNotes}</p></div>}
            {b.cancelReason && <p className="text-sm text-red-300">{b.cancelReason}</p>}

            {(payments.data?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-2">Payments</p>
                <ul className="text-sm space-y-1">
                  {payments.data!.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3">
                      <span>{PURPOSE_LABEL[p.purpose]} · {METHOD_LABEL[p.method]} · {formatDateTime(p.paidAt ?? p.createdAt, studio.timezone)}</span>
                      <span className="flex items-center gap-2 font-mono">{money(p.amount, p.currency)} <Badge status={p.status} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {can('bookings.write') && (
              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {(b.status === 'PENDING' || b.status === 'PENDING_DEPOSIT') && (
                  <Button loading={busy === 'CONFIRMED'} onClick={() => setStatus('CONFIRMED')}>Confirm</Button>
                )}
                {b.status === 'CONFIRMED' && new Date(b.startsAt) <= new Date() && (
                  <>
                    <Button loading={busy === 'COMPLETED'} onClick={() => setStatus('COMPLETED')}>Mark completed</Button>
                    <Button variant="glass" loading={busy === 'NO_SHOW'} onClick={() => setStatus('NO_SHOW')}>No-show</Button>
                  </>
                )}
                {active && <Button variant="glass" onClick={() => setEditOpen(true)}>Edit / reschedule</Button>}
                {can('finance.write') && due > 0 && b.status !== 'CANCELLED' && (
                  <Button variant="glass" onClick={() => { setPay({ amount: String(b.amountPaid < b.depositAmount ? b.depositAmount - b.amountPaid : due), method: 'CASH', note: '' }); setPayOpen(true) }}>
                    Record payment
                  </Button>
                )}
                {can('finance.write') && b.clientId && due > 0 && b.status !== 'CANCELLED' && (
                  <Button
                    variant="glass"
                    loading={busy === 'invoice'}
                    onClick={async () => {
                      setBusy('invoice')
                      try {
                        const inv = await api.invoices.fromBooking(b.id)
                        router.push(`/admin/billing/invoices/${inv.id}`)
                      } catch (err) {
                        toast.error(errorMessage(err))
                        setBusy(null)
                      }
                    }}
                  >
                    Invoice the balance
                  </Button>
                )}
                {active && (
                  <ConfirmButton onConfirm={() => setStatus('CANCELLED')} confirmLabel="Cancel booking?">Cancel</ConfirmButton>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <BookingForm open={editOpen} onClose={() => setEditOpen(false)} booking={b} onSaved={refresh} />

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record a payment"
        footer={
          <>
            <Button variant="glass" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button type="submit" form="pay-form" loading={busy === 'pay'}>Record</Button>
          </>
        }
      >
        <form id="pay-form" onSubmit={recordPayment} className="space-y-3">
          <Field label={`Amount (${b?.currency})`}><Input type="number" min={1} max={due} required value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Method">
            <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as PaymentMethod })}>
              {(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD'] as PaymentMethod[]).map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
            </Select>
          </Field>
          <Field label="Reference / note" hint="e.g. MoMo transaction ID or receipt number"><Input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></Field>
        </form>
      </Modal>
    </>
  )
}
