'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { Badge, EmptyState, Loading } from '@/components/ui'
import { Price } from '@/components/site/Price'

export default function MyBilling() {
  const studio = useRequiredStudio()
  const { t, locale } = useI18n()
  const invoices = useQuery({ queryKey: ['invoices', 'mine'], queryFn: api.invoices.list })
  const quotes = useQuery({ queryKey: ['quotes', 'mine'], queryFn: api.quotes.list })
  if (invoices.isLoading || quotes.isLoading) return <Loading />
  const empty = !invoices.data?.length && !quotes.data?.length
  if (empty) return <EmptyState title={t('common.empty')} />
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="font-headline text-lg font-semibold">Invoices</h2>
        {invoices.data?.map((i) => (
          <Link key={i.id} href={`/portal/invoices/${i.id}`} className="glass-card rounded-xl p-4 flex justify-between items-center gap-3 hover:border-brand-purple/40">
            <div>
              <p className="font-medium">{i.displayNumber} · {i.title}</p>
              <p className="text-xs text-text-muted">{i.issuedAt ? formatDate(i.issuedAt, studio.timezone, locale) : ''}{i.dueDate ? ` · due ${i.dueDate}` : ''}</p>
            </div>
            <div className="text-right space-y-1">
              <Price amount={i.total} className="font-mono text-sm block" />
              <Badge status={i.status} />
            </div>
          </Link>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="font-headline text-lg font-semibold">Quotes</h2>
        {quotes.data?.map((q) => (
          <Link key={q.id} href={`/portal/quotes/${q.id}`} className="glass-card rounded-xl p-4 flex justify-between items-center gap-3 hover:border-brand-purple/40">
            <p className="font-medium">{q.displayNumber} · {q.title}</p>
            <div className="text-right space-y-1">
              <Price amount={q.total} className="font-mono text-sm block" />
              <Badge status={q.status} />
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
