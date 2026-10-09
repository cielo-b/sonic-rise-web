'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, type Invoice, type LineItem, type Quote } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { money } from '@/lib/format'
import { Button, Field, Input, Modal, Select, Textarea, errorMessage } from '../ui'

type Kind = 'quote' | 'invoice'

/** Create or edit (while draft) a quote or invoice. Totals are recalculated by the API. */
export function DocumentEditor({
  kind,
  open,
  onClose,
  doc,
  defaultClientId,
  onSaved,
}: {
  kind: Kind
  open: boolean
  onClose: () => void
  doc?: Quote | Invoice | null
  defaultClientId?: string
  onSaved: (d: Quote | Invoice) => void
}) {
  const studio = useRequiredStudio()
  const clients = useQuery({ queryKey: ['clients', 'list', ''], queryFn: () => api.clients.list(), enabled: open })
  const packages = useQuery({ queryKey: ['packages', 'all'], queryFn: api.packages.all, enabled: open })
  const blank: LineItem = { description: '', quantity: 1, unitPrice: 0 }
  const [f, setF] = useState({ clientId: '', title: '', lines: [blank], discount: 0, notes: '', date: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when opened
    setF({
      clientId: doc?.clientId ?? defaultClientId ?? '',
      title: doc?.title ?? '',
      lines: doc?.lines.length ? doc.lines : [blank],
      discount: doc?.discount ?? 0,
      notes: doc?.notes ?? '',
      date: (doc && ('validUntil' in doc ? doc.validUntil : (doc as Invoice).dueDate)) ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on open only
  }, [open, doc?.id])

  const subtotal = f.lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0)
  const setLine = (i: number, patch: Partial<LineItem>) => setF((s) => ({ ...s, lines: s.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const lines = f.lines
        .filter((l) => l.description.trim())
        .map((l) => ({ description: l.description.trim(), quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) }))
      if (!lines.length) throw new Error('Add at least one line')
      const base = { clientId: f.clientId, title: f.title.trim(), lines, discount: Number(f.discount) || 0, notes: f.notes.trim() || undefined }
      const saved =
        kind === 'quote'
          ? doc
            ? await api.quotes.update(doc.id, { ...base, validUntil: f.date || undefined })
            : await api.quotes.create({ ...base, validUntil: f.date || undefined })
          : doc
            ? await api.invoices.update(doc.id, { ...base, dueDate: f.date || undefined })
            : await api.invoices.create({ ...base, dueDate: f.date || undefined })
      onSaved(saved)
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={`${doc ? 'Edit' : 'New'} ${kind}`}
      footer={<><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" form="doc-form" loading={busy}>Save draft</Button></>}
    >
      <form id="doc-form" onSubmit={save} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Client">
            <Select required value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
              <option value="">Choose…</option>
              {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
            </Select>
          </Field>
          <Field label="Title"><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. EP production" /></Field>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted">Lines</p>
          {f.lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_120px_32px] gap-2 items-center">
              <Input placeholder="Description" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
              <Input type="number" min={0.01} step="any" aria-label="Quantity" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value as unknown as number })} />
              <Input type="number" min={0} aria-label="Unit price" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value as unknown as number })} />
              <button type="button" aria-label="Remove line" className="text-outline hover:text-red-300" onClick={() => setF((s) => ({ ...s, lines: s.lines.filter((_, j) => j !== i) }))}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="quiet" onClick={() => setF((s) => ({ ...s, lines: [...s.lines, blank] }))}><Plus size={14} /> Line</Button>
            {(packages.data?.length ?? 0) > 0 && (
              <Select
                className="w-auto"
                value=""
                onChange={(e) => {
                  const p = packages.data!.find((x) => x.id === e.target.value)
                  if (p) setF((s) => ({ ...s, lines: [...s.lines.filter((l) => l.description.trim()), { description: p.name, quantity: 1, unitPrice: p.price }] }))
                }}
              >
                <option value="">Add a service…</option>
                {packages.data!.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label={`Discount (${studio.currency})`}><Input type="number" min={0} value={f.discount} onChange={(e) => setF({ ...f, discount: Number(e.target.value) })} /></Field>
          <Field label={kind === 'quote' ? 'Valid until' : 'Due date'}><input type="date" className="input-studio text-sm" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <div className="text-right self-end pb-2">
            <p className="text-xs text-text-muted">Total</p>
            <p className="font-mono font-bold text-lg">{money(Math.max(0, subtotal - f.discount), studio.currency)}</p>
          </div>
        </div>
        <Field label="Notes for the client"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </form>
    </Modal>
  )
}
