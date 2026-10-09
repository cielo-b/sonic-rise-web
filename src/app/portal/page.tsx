'use client'

import Link from 'next/link'
import { useNow } from '@/lib/time'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Badge, Card, Loading } from '@/components/ui'
import { Price } from '@/components/site/Price'
import { BookingRow } from './BookingRow'

export default function PortalHome() {
  const { t } = useI18n()
  const bookings = useQuery({ queryKey: ['bookings', 'mine'], queryFn: () => api.bookings.list() })
  const projects = useQuery({ queryKey: ['projects', 'mine'], queryFn: () => api.projects.list() })
  const invoices = useQuery({ queryKey: ['invoices', 'mine'], queryFn: api.invoices.list })
  const quotes = useQuery({ queryKey: ['quotes', 'mine'], queryFn: api.quotes.list })

  const now = useNow()
  if (bookings.isLoading) return <Loading />
  const upcoming = (bookings.data ?? [])
    .filter((b) => ['PENDING_DEPOSIT', 'PENDING', 'CONFIRMED'].includes(b.status) && new Date(b.endsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const review = (projects.data ?? []).filter((p) => (p.inReviewCount ?? 0) > 0)
  const unpaid = (invoices.data ?? []).filter((i) => ['ISSUED', 'PARTIALLY_PAID'].includes(i.status))
  const openQuotes = (quotes.data ?? []).filter((q) => q.status === 'SENT')

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg font-semibold">{t('portal.upcoming')}</h2>
          <Link href="/booking" className="text-sm text-brand-cyan hover:underline">{t('nav.book')}</Link>
        </div>
        {upcoming.length === 0 ? <p className="text-sm text-text-muted">{t('portal.noUpcoming')}</p> : upcoming.map((b) => <BookingRow key={b.id} b={b} />)}
      </section>

      <section className="space-y-3">
        <h2 className="font-headline text-lg font-semibold">{t('portal.toReview')}</h2>
        {review.length === 0 ? (
          <p className="text-sm text-text-muted">{t('portal.nothingToReview')}</p>
        ) : (
          review.map((p) => (
            <Link key={p.id} href={`/portal/projects/${p.id}`} className="glass-card rounded-xl p-4 flex justify-between hover:border-brand-purple/40">
              <span>{p.title}</span>
              <span className="chip chip-warning">{p.inReviewCount}</span>
            </Link>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-headline text-lg font-semibold">{t('portal.unpaid')}</h2>
        {unpaid.length === 0 ? (
          <p className="text-sm text-text-muted">{t('portal.allPaid')}</p>
        ) : (
          unpaid.map((i) => (
            <Link key={i.id} href={`/portal/invoices/${i.id}`} className="glass-card rounded-xl p-4 flex justify-between items-center hover:border-brand-purple/40">
              <span>{i.displayNumber} · {i.title}</span>
              <Price amount={i.total - i.amountPaid} className="font-mono text-sm" />
            </Link>
          ))
        )}
      </section>

      {openQuotes.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-headline text-lg font-semibold">Quotes to answer</h2>
          {openQuotes.map((q) => (
            <Link key={q.id} href={`/portal/quotes/${q.id}`}>
              <Card className="p-4 flex justify-between items-center hover:border-brand-purple/40">
                <span>{q.displayNumber} · {q.title}</span>
                <Badge status={q.status} />
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
