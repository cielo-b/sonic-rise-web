'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { Badge, Button, Card, ErrorState, Loading } from '@/components/ui'
import { DocumentLines } from '@/components/DocumentLines'
import { PayMobileMoney } from '@/components/PayMobileMoney'

export default function MyInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const studio = useRequiredStudio()
  const { t, locale } = useI18n()
  const q = useQuery({ queryKey: ['invoice', id], queryFn: () => api.invoices.get(id) })
  if (q.isLoading) return <Loading />
  const inv = q.data
  if (!inv) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const due = inv.total - inv.amountPaid
  const payable = ['ISSUED', 'PARTIALLY_PAID'].includes(inv.status) && due > 0

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="p-6 space-y-5 print:bg-white print:text-black">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="font-headline text-xl font-bold">{studio.name}</p>
            <p className="text-xs text-text-muted">{[studio.address, studio.city, studio.phone, studio.email].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold">{inv.displayNumber}</p>
            {inv.issuedAt && <p className="text-xs text-text-muted">{formatDate(inv.issuedAt, studio.timezone, locale)}</p>}
            {inv.dueDate && <p className="text-xs text-text-muted">Due {inv.dueDate}</p>}
            <Badge status={inv.status} />
          </div>
        </div>
        <p className="font-medium">{inv.title}</p>
        <p className="text-sm text-text-muted">Billed to {inv.client.name}</p>
        <DocumentLines doc={inv} />
        {inv.notes && <p className="text-sm text-text-muted whitespace-pre-line">{inv.notes}</p>}
        <Button variant="glass" onClick={() => window.print()} className="print:hidden">Print / save as PDF</Button>
      </Card>
      {payable && (
        <aside className="print:hidden">
          <Card className="p-5 space-y-3">
            <p className="font-headline font-semibold">{t('common.pay')}</p>
            {studio.onlinePayments ? (
              <PayMobileMoney purpose="INVOICE" targetId={inv.id} amount={due} currency={inv.currency} onPaid={() => q.refetch()} />
            ) : (
              <p className="text-sm text-text-muted">{t('pay.notSetUp')}</p>
            )}
          </Card>
        </aside>
      )}
    </div>
  )
}
