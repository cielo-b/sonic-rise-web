'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { EmptyState, Loading } from '@/components/ui'
import { BookingRow } from '../BookingRow'

export default function MyBookings() {
  const { t } = useI18n()
  const q = useQuery({ queryKey: ['bookings', 'mine'], queryFn: () => api.bookings.list() })
  if (q.isLoading) return <Loading />
  if (!q.data?.length) return <EmptyState title={t('common.empty')} action={<Link href="/booking" className="btn-primary">{t('nav.book')}</Link>} />
  return <div className="space-y-3">{q.data.map((b) => <BookingRow key={b.id} b={b} />)}</div>
}
