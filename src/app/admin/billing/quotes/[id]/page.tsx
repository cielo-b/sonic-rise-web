'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Badge, Button, Card, ConfirmButton, ErrorState, Loading, errorMessage } from '@/components/ui'
import { DocumentLines } from '@/components/DocumentLines'
import { DocumentEditor } from '@/components/admin/DocumentEditor'

export default function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { can } = useAuth()
  const router = useRouter()
  const q = useQuery({ queryKey: ['quote', id], queryFn: () => api.quotes.get(id) })
  const [edit, setEdit] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  if (q.isLoading) return <Loading />
  const quote = q.data
  if (!quote) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const write = can('finance.write')

  async function run(name: string, fn: () => Promise<unknown>) {
    setBusy(name)
    try {
      await fn()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-text-muted"><Link href={`/admin/clients/${quote.clientId}`} className="hover:text-brand-cyan">{quote.client.name}</Link></p>
          <h1 className="font-headline text-2xl font-bold">{quote.displayNumber} · {quote.title}</h1>
          {quote.validUntil && <p className="text-xs text-outline">Valid until {quote.validUntil}</p>}
        </div>
        <div className="flex flex-wrap gap-2 items-start">
          <Badge status={quote.status} />
          {write && ['DRAFT', 'SENT'].includes(quote.status) && <Button variant="glass" onClick={() => setEdit(true)}>Edit</Button>}
          {write && ['DRAFT', 'SENT'].includes(quote.status) && (
            <Button loading={busy === 'send'} onClick={() => run('send', async () => { await api.quotes.send(id); toast.success('Sent to the client'); void q.refetch() })}>
              {quote.status === 'SENT' ? 'Send again' : 'Send to client'}
            </Button>
          )}
          {write && ['SENT', 'ACCEPTED', 'DRAFT'].includes(quote.status) && (
            <Button variant="glass" loading={busy === 'convert'} onClick={() => run('convert', async () => { const inv = await api.quotes.convert(id); router.push(`/admin/billing/invoices/${inv.id}`) })}>
              Convert to invoice
            </Button>
          )}
          {quote.invoiceId && <Link href={`/admin/billing/invoices/${quote.invoiceId}`} className="btn-glass">View invoice</Link>}
          {write && quote.status === 'DRAFT' && (
            <ConfirmButton onConfirm={async () => { await api.quotes.remove(id); router.push('/admin/billing?tab=quotes') }}>Delete</ConfirmButton>
          )}
        </div>
      </div>
      <Card className="p-6 space-y-4 max-w-3xl">
        <DocumentLines doc={quote} />
        {quote.notes && <p className="text-sm text-text-muted whitespace-pre-line">{quote.notes}</p>}
      </Card>
      <DocumentEditor kind="quote" open={edit} onClose={() => setEdit(false)} doc={quote} onSaved={() => void q.refetch()} />
    </>
  )
}
