'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { formatDateTime, formatTime, money } from '@/lib/format'
import { Badge, Button, Card, ErrorState, Field, Loading, Modal, Textarea, errorMessage } from '@/components/ui'
import { Price } from '@/components/site/Price'
import { PayMobileMoney } from '@/components/PayMobileMoney'

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isNew = useSearchParams().get('new') === '1'
  const studio = useRequiredStudio()
  const { t, locale } = useI18n()
  const q = useQuery({ queryKey: ['booking', id], queryFn: () => api.bookings.get(id) })
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (q.isLoading) return <Loading />
  const b = q.data
  if (!b) return <ErrorState error={q.error} onRetry={() => q.refetch()} />

  const active = ['PENDING_DEPOSIT', 'PENDING', 'CONFIRMED'].includes(b.status)
  const late = new Date(b.startsAt).getTime() - Date.now() < studio.cancellationHours * 3_600_000
  const depositDue = Math.max(0, b.depositAmount - b.amountPaid)
  const balanceDue = Math.max(0, b.totalAmount - b.amountPaid)

  async function cancel() {
    setBusy(true)
    try {
      await api.bookings.cancel(id, reason.trim() || undefined)
      setCancelOpen(false)
      await q.refetch()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        {isNew && (
          <div className="flex items-center gap-2 text-emerald-300 text-sm">
            <CheckCircle2 size={18} /> {b.status === 'PENDING_DEPOSIT' ? t('booking.depositDue') : t('booking.noDeposit')}
          </div>
        )}
        <Card className="p-6 space-y-3">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-xs font-mono text-outline">{b.reference}</p>
              <h2 className="font-headline text-2xl font-bold">{b.package.name}</h2>
            </div>
            <Badge status={b.status} />
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-text-muted">{t('common.date')}</dt>
            <dd>{formatDateTime(b.startsAt, studio.timezone, locale)}–{formatTime(b.endsAt, studio.timezone, locale)}</dd>
            <dt className="text-text-muted">{t('booking.room')}</dt>
            <dd>{b.room.name}</dd>
            {b.engineer && (<><dt className="text-text-muted">{t('booking.engineer')}</dt><dd>{b.engineer.name}</dd></>)}
            {b.equipment.length > 0 && (<><dt className="text-text-muted">{t('booking.gear')}</dt><dd>{b.equipment.map((e) => e.name).join(', ')}</dd></>)}
            <dt className="text-text-muted">{t('common.total')}</dt>
            <dd><Price amount={b.totalAmount} className="font-mono" /></dd>
            <dt className="text-text-muted">{t('common.paid')}</dt>
            <dd className="font-mono">{money(b.amountPaid, b.currency, locale)}</dd>
          </dl>
          {b.notes && <p className="text-sm text-text-muted whitespace-pre-line border-t border-white/10 pt-3">{b.notes}</p>}
          {b.cancelReason && <p className="text-sm text-red-300">{b.cancelReason}</p>}
        </Card>
        {active && new Date(b.startsAt) > new Date() && (
          <Button variant="danger" onClick={() => setCancelOpen(true)}>{t('portal.cancelBooking')}</Button>
        )}
      </div>

      {active && (depositDue > 0 || balanceDue > 0) && (
        <aside>
          <Card className="p-5 space-y-3">
            <p className="font-headline font-semibold">{depositDue > 0 && b.status === 'PENDING_DEPOSIT' ? t('portal.payDeposit') : t('portal.payBalance')}</p>
            {studio.onlinePayments ? (
              <PayMobileMoney
                purpose={depositDue > 0 && b.status === 'PENDING_DEPOSIT' ? 'DEPOSIT' : 'BOOKING_BALANCE'}
                targetId={b.id}
                amount={depositDue > 0 && b.status === 'PENDING_DEPOSIT' ? depositDue : balanceDue}
                currency={b.currency}
                onPaid={() => q.refetch()}
              />
            ) : (
              <p className="text-sm text-text-muted">{t('pay.notSetUp')}</p>
            )}
          </Card>
        </aside>
      )}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t('portal.cancelConfirm')}
        footer={
          <>
            <Button variant="glass" onClick={() => setCancelOpen(false)}>{t('common.back')}</Button>
            <Button variant="danger" loading={busy} onClick={cancel}>{t('portal.cancelBooking')}</Button>
          </>
        }
      >
        {late && b.amountPaid > 0 && <p className="text-sm text-amber-300">{t('portal.lateCancel')}</p>}
        {studio.cancellationPolicy && <p className="text-sm text-text-muted whitespace-pre-line">{studio.cancellationPolicy}</p>}
        <Field label={t('common.notes')}><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </div>
  )
}
