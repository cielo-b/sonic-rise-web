'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api, type Client, type ClientDetail } from '@/lib/api'
import { Button, Field, Input, Modal, Textarea, errorMessage } from '../ui'

export function ClientForm({
  open,
  onClose,
  client,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  client?: Client | ClientDetail | null
  onSaved: (c: Client) => void
}) {
  const empty = { name: '', email: '', phone: '', company: '', category: '', notes: '' }
  const [f, setF] = useState(empty)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when opened
    if (open) setF(client ? { name: client.name, email: client.email, phone: client.phone ?? '', company: client.company ?? '', category: client.category ?? '', notes: client.notes ?? '' } : empty)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on open only
  }, [open, client?.id])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const data = {
        name: f.name.trim(),
        email: f.email.trim(),
        phone: f.phone.trim() || undefined,
        company: f.company.trim() || undefined,
        category: f.category.trim() || undefined,
        notes: f.notes.trim() || undefined,
      }
      const saved = client ? await api.clients.update(client.id, data) : await api.clients.create(data)
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
      title={client ? 'Edit client' : 'New client'}
      footer={<><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" form="client-form" loading={busy}>Save</Button></>}
    >
      <form id="client-form" onSubmit={save} className="grid sm:grid-cols-2 gap-3">
        <Field label="Name"><Input required minLength={2} value={f.name} onChange={set('name')} /></Field>
        <Field label="Email"><Input type="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone"><Input type="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Company / label"><Input value={f.company} onChange={set('company')} /></Field>
        <Field label="Type" hint="e.g. Artist, Label, Agency, Corporate"><Input value={f.category} onChange={set('category')} /></Field>
        <Field label="Team notes" className="sm:col-span-2"><Textarea rows={3} value={f.notes} onChange={set('notes')} /></Field>
      </form>
    </Modal>
  )
}
