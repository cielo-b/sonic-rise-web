'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { api, type Invoice, type Quote } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDate, formatDateTime, money } from '@/lib/format'
import { METHOD_LABEL, PURPOSE_LABEL } from '@/lib/labels'
import { Badge, Button, EmptyState, Loading, PageHeader, Tabs } from '@/components/ui'
import { DocumentEditor } from '@/components/admin/DocumentEditor'

type Tab = 'invoices' | 'quotes' | 'payments'

function DocTable({ rows, kind }: { rows: (Quote | Invoice)[]; kind: 'quotes' | 'invoices' }) {
  const studio = useRequiredStudio()
  const router = useRouter()
  if (!rows.length) return <EmptyState title={`No ${kind} yet`} />
  return (
    <div className="glass-card rounded-xl overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-white/10">
            {['Number', 'Client', 'Title', 'Date', 'Total', ...(kind === 'invoices' ? ['Paid'] : []), 'Status'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} onClick={() => router.push(`/admin/billing/${kind}/${d.id}`)} className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer">
              <td className="px-4 py-3 font-mono">{d.displayNumber}</td>
              <td className="px-4 py-3">{d.client.name}</td>
              <td className="px-4 py-3">{d.title}</td>
              <td className="px-4 py-3 text-text-muted">{formatDate(d.createdAt, studio.timezone)}</td>
              <td className="px-4 py-3 font-mono">{money(d.total, d.currency)}</td>
              {kind === 'invoices' && <td className="px-4 py-3 font-mono">{money((d as Invoice).amountPaid, d.currency)}</td>}
              <td className="px-4 py-3"><Badge status={d.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Billing() {
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const router = useRouter()
  const initial = (useSearchParams().get('tab') as Tab) || 'invoices'
  const [tab, setTab] = useState<Tab>(initial)
  const [editor, setEditor] = useState<'quote' | 'invoice' | null>(null)
  const quotes = useQuery({ queryKey: ['quotes', 'all'], queryFn: api.quotes.list })
  const invoices = useQuery({ queryKey: ['invoices', 'all'], queryFn: api.invoices.list })
  const payments = useQuery({ queryKey: ['payments', 'all'], queryFn: () => api.payments.list(), enabled: tab === 'payments' })

  return (
    <>
      <PageHeader
        title="Quotes & invoices"
        actions={
          can('finance.write') && (
            <>
              <Button variant="glass" onClick={() => setEditor('quote')}><Plus size={16} /> Quote</Button>
              <Button onClick={() => setEditor('invoice')}><Plus size={16} /> Invoice</Button>
            </>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'invoices', label: 'Invoices', count: invoices.data?.length },
          { value: 'quotes', label: 'Quotes', count: quotes.data?.length },
          { value: 'payments', label: 'Payments' },
        ]}
      />
      {tab === 'invoices' && (invoices.isLoading ? <Loading /> : <DocTable rows={invoices.data ?? []} kind="invoices" />)}
      {tab === 'quotes' && (quotes.isLoading ? <Loading /> : <DocTable rows={quotes.data ?? []} kind="quotes" />)}
      {tab === 'payments' &&
        (payments.isLoading ? (
          <Loading />
        ) : !payments.data?.length ? (
          <EmptyState title="No payments yet" />
        ) : (
          <div className="glass-card rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-white/10">
                  {['Date', 'For', 'Method', 'Amount', 'Status', 'Reference'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payments.data.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="px-4 py-3">{formatDateTime(p.paidAt ?? p.createdAt, studio.timezone)}</td>
                    <td className="px-4 py-3">{PURPOSE_LABEL[p.purpose]}</td>
                    <td className="px-4 py-3">{METHOD_LABEL[p.method]}{p.provider === 'PAWAPAY' ? ' (online)' : ''}</td>
                    <td className="px-4 py-3 font-mono">{money(p.amount, p.currency)}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{p.note ?? p.phone ?? p.failureReason ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      <DocumentEditor
        kind={editor ?? 'invoice'}
        open={!!editor}
        onClose={() => setEditor(null)}
        onSaved={(d) => router.push(`/admin/billing/${editor === 'quote' ? 'quotes' : 'invoices'}/${d.id}`)}
      />
    </>
  )
}

export default function BillingPage() {
  return <Suspense><Billing /></Suspense>
}
