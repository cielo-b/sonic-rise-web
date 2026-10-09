'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { Badge, Button, Card, ErrorState, Loading, errorMessage } from '@/components/ui'
import { DocumentLines } from '@/components/DocumentLines'

export default function MyQuote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const studio = useRequiredStudio()
  const { t } = useI18n()
  const q = useQuery({ queryKey: ['quote', id], queryFn: () => api.quotes.get(id) })
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null)
  if (q.isLoading) return <Loading />
  const quote = q.data
  if (!quote) return <ErrorState error={q.error} onRetry={() => q.refetch()} />

  async function respond(accept: boolean) {
    setBusy(accept ? 'yes' : 'no')
    try {
      await api.quotes.respond(id, accept)
      await q.refetch()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="p-6 space-y-5 max-w-3xl">
      <div className="flex justify-between gap-4">
        <div>
          <p className="text-xs text-text-muted">{studio.name}</p>
          <p className="font-headline text-xl font-bold">{quote.displayNumber} · {quote.title}</p>
          {quote.validUntil && <p className="text-xs text-text-muted">Valid until {quote.validUntil}</p>}
        </div>
        <Badge status={quote.status} />
      </div>
      <DocumentLines doc={quote} />
      {quote.notes && <p className="text-sm text-text-muted whitespace-pre-line">{quote.notes}</p>}
      {quote.status === 'SENT' && (
        <div className="flex gap-2">
          <Button loading={busy === 'yes'} onClick={() => respond(true)}>{t('portal.acceptQuote')}</Button>
          <Button variant="glass" loading={busy === 'no'} onClick={() => respond(false)}>{t('portal.declineQuote')}</Button>
        </div>
      )}
    </Card>
  )
}
