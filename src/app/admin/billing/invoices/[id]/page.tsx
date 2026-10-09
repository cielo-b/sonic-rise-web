'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type PaymentMethod } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDate, formatDateTime, money } from '@/lib/format'
import { METHOD_LABEL } from '@/lib/labels'
import { Badge, Button, Card, ConfirmButton, ErrorState, Field, Input, Loading, Modal, Select, errorMessage } from '@/components/ui'
import { DocumentLines } from '@/components/DocumentLines'
import { DocumentEditor } from '@/components/admin/DocumentEditor'

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const q = useQuery({ queryKey: ['invoice', id], queryFn: () => api.invoices.get(id) })
  const payments = useQuery({ queryKey: ['payments', 'invoice', id], queryFn: () => api.payments.list({ invoiceId: id }) })
  const [edit, setEdit] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [pay, setPay] = useState({ amount: '', method: 'CASH' as PaymentMethod, note: '' })
  const [busy, setBusy] = useState<string | null>(null)
  if (q.isLoading) return <Loading />
  const inv = q.data
  if (!inv) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const write = can('finance.write')
  const due = inv.total - inv.amountPaid

  async function run(name: string, fn: () => Promise<unknown>) {
    setBusy(name)
    try {
      await fn()
      void q.refetch()
      void payments.refetch()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 mb-6 print:hidden">
        <div>
          <p className="text-sm text-text-muted"><Link href={`/admin/clients/${inv.clientId}`} className="hover:text-brand-cyan">{inv.client.name}</Link></p>
          <h1 className="font-headline text-2xl font-bold">{inv.displayNumber} · {inv.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-start">
          <Badge status={inv.status} />
          {write && inv.status === 'DRAFT' && <Button variant="glass" onClick={() => setEdit(true)}>Edit</Button>}
          {write && inv.status === 'DRAFT' && (
            <Button loading={busy === 'issue'} onClick={() => run('issue', async () => { await api.invoices.issue(id); toast.success('Issued and emailed to the client') })}>Issue & send</Button>
          )}
          {write && ['ISSUED', 'PARTIALLY_PAID'].includes(inv.status) && (
            <Button variant="glass" onClick={() => { setPay({ amount: String(due), method: 'CASH', note: '' }); setPayOpen(true) }}>Record payment</Button>
          )}
          <Button variant="glass" onClick={() => window.print()}>Print</Button>
          {write && inv.amountPaid === 0 && inv.status !== 'VOID' && (
            <ConfirmButton onConfirm={() => run('void', () => api.invoices.void(id))} confirmLabel="Void invoice?">Void</ConfirmButton>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-headline text-xl font-bold">{studio.name}</p>
              <p className="text-xs text-text-muted">{[studio.address, studio.city, studio.phone, studio.email].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-mono font-bold">{inv.displayNumber}</p>
              {inv.issuedAt && <p className="text-text-muted">Issued {formatDate(inv.issuedAt, studio.timezone)}</p>}
              {inv.dueDate && <p className="text-text-muted">Due {inv.dueDate}</p>}
            </div>
          </div>
          <p className="text-sm">Billed to <span className="font-medium">{inv.client.name}</span> · {inv.client.email}</p>
          <DocumentLines doc={inv} />
          {inv.notes && <p className="text-sm text-text-muted whitespace-pre-line">{inv.notes}</p>}
        </Card>
        <aside className="print:hidden">
          <Card className="p-5 space-y-2">
            <p className="font-headline font-semibold">Payments</p>
            {!payments.data?.length && <p className="text-sm text-text-muted">None yet.</p>}
            {payments.data?.map((p) => (
              <div key={p.id} className="flex justify-between text-sm gap-3">
                <span>{METHOD_LABEL[p.method]} · {formatDateTime(p.paidAt ?? p.createdAt, studio.timezone)}</span>
                <span className="font-mono">{money(p.amount, p.currency)}</span>
              </div>
            ))}
          </Card>
        </aside>
      </div>
      <DocumentEditor kind="invoice" open={edit} onClose={() => setEdit(false)} doc={inv} onSaved={() => void q.refetch()} />
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record a payment"
        footer={
          <>
            <Button variant="glass" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button
              loading={busy === 'pay'}
              onClick={() =>
                run('pay', async () => {
                  await api.payments.record({ purpose: 'INVOICE', targetId: id, amount: Number(pay.amount), method: pay.method, note: pay.note.trim() || undefined })
                  setPayOpen(false)
                  toast.success('Payment recorded')
                })
              }
            >
              Record
            </Button>
          </>
        }
      >
        <Field label={`Amount (${inv.currency})`}><Input type="number" min={1} max={due} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
        <Field label="Method">
          <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as PaymentMethod })}>
            {(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD'] as PaymentMethod[]).map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
          </Select>
        </Field>
        <Field label="Reference / note"><Input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></Field>
      </Modal>
    </>
  )
}
