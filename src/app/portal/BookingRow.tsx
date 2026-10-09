'use client'

import Link from 'next/link'
import type { Booking } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { formatDateTime, formatTime } from '@/lib/format'
import { Badge } from '@/components/ui'
import { Price } from '@/components/site/Price'

export function BookingRow({ b }: { b: Booking }) {
  const studio = useRequiredStudio()
  const { locale } = useI18n()
  return (
    <Link href={`/portal/bookings/${b.id}`} className="glass-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 hover:border-brand-purple/40">
      <div>
        <p className="font-medium">{b.package.name}</p>
        <p className="text-sm text-text-muted">
          {formatDateTime(b.startsAt, studio.timezone, locale)}–{formatTime(b.endsAt, studio.timezone, locale)} · {b.room.name}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Price amount={b.totalAmount} className="text-sm font-mono" />
        <Badge status={b.status} />
      </div>
    </Link>
  )
}
