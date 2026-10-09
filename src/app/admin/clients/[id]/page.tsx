'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDate, formatDateTime, money } from '@/lib/format'
import { STAGE_LABEL } from '@/lib/labels'
import { Avatar, Badge, Button, Card, ConfirmButton, CopyField, ErrorState, Field, Input, Loading, Modal, Textarea, errorMessage } from '@/components/ui'
import { ClientForm } from '@/components/admin/ClientForm'
import { BookingPanel } from '@/components/admin/BookingPanel'

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const q = useQuery({ queryKey: ['client', id], queryFn: () => api.clients.get(id) })
  const [editOpen, setEditOpen] = useState(false)
  const [msgOpen, setMsgOpen] = useState(false)
  const [msg, setMsg] = useState({ subject: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [openBooking, setOpenBooking] = useState<string | null>(null)

  if (q.isLoading) return <Loading />
  const c = q.data
  if (!c) return <ErrorState error={q.error} onRetry={() => q.refetch()} />

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={c.name} url={c.avatarUrl} size={56} />
          <div>
            <h1 className="font-headline text-2xl font-bold">{c.name} {!c.isActive && <span className="chip chip-error ml-2">Inactive</span>}</h1>
            <p className="text-sm text-text-muted">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
            <p className="text-xs text-outline">{[c.company, c.category].filter(Boolean).join(' · ')} · client since {formatDate(c.createdAt, studio.timezone)}</p>
          </div>
        </div>
        {can('clients.write') && (
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant="glass" onClick={() => setMsgOpen(true)}>Email</Button>
            {!c.hasPortalAccess && c.isActive && (
              <Button
                variant="glass"
                onClick={async () => {
                  try {
                    setInviteUrl((await api.clients.invite(c.id)).inviteUrl)
                  } catch (err) {
                    toast.error(errorMessage(err))
                  }
                }}
              >
                Invite to portal
              </Button>
            )}
            {c.isActive ? (
              <ConfirmButton onConfirm={async () => { await api.clients.deactivate(c.id); void q.refetch() }} confirmLabel="Deactivate?">Deactivate</ConfirmButton>
            ) : (
              <Button variant="glass" onClick={async () => { await api.clients.reactivate(c.id); void q.refetch() }}>Reactivate</Button>
            )}
          </div>
        )}
      </div>

      {inviteUrl && (
        <Card className="p-4 mb-6 space-y-2">
          <p className="text-sm">Invitation emailed. You can also share this link (valid 7 days):</p>
          <CopyField value={inviteUrl} />
        </Card>
      )}
      {c.notes && <Card className="p-4 mb-6 text-sm whitespace-pre-line"><p className="text-xs text-text-muted mb-1">Team notes</p>{c.notes}</Card>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-headline font-semibold mb-3">Sessions ({c.bookings.length})</h2>
          {c.bookings.length === 0 && <p className="text-sm text-text-muted">No sessions yet.</p>}
          <ul className="space-y-2">
            {c.bookings.map((b) => (
              <li key={b.id}>
                <button onClick={() => setOpenBooking(b.id)} className="w-full glass-card rounded-lg p-3 flex justify-between gap-3 text-sm text-left hover:border-brand-purple/40">
                  <span>{formatDateTime(b.startsAt, studio.timezone)} · {b.package.name} · {b.room.name}</span>
                  <span className="flex items-center gap-2"><span className="font-mono">{money(b.totalAmount, b.currency)}</span><Badge status={b.status} /></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-6">
          <div>
            <h2 className="font-headline font-semibold mb-3">Projects</h2>
            {c.projects.length === 0 && <p className="text-sm text-text-muted">No projects.</p>}
            {c.projects.map((p) => (
              <Link key={p.id} href={`/admin/projects/${p.id}`} className="glass-card rounded-lg p-3 flex justify-between text-sm mb-2 hover:border-brand-purple/40">
                <span>{p.title}</span><span className="text-text-muted">{STAGE_LABEL[p.stage]}</span>
              </Link>
            ))}
          </div>
          {can('finance.read') && (
            <div>
              <h2 className="font-headline font-semibold mb-3">Invoices</h2>
              {c.invoices.length === 0 && <p className="text-sm text-text-muted">No invoices.</p>}
              {c.invoices.map((i) => (
                <Link key={i.id} href={`/admin/billing/invoices/${i.id}`} className="glass-card rounded-lg p-3 flex justify-between text-sm mb-2 hover:border-brand-purple/40">
                  <span>{i.displayNumber} · {i.title}</span>
                  <span className="flex items-center gap-2"><span className="font-mono">{money(i.total, i.currency)}</span><Badge status={i.status} /></span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <ClientForm open={editOpen} onClose={() => setEditOpen(false)} client={c} onSaved={() => void q.refetch()} />
      <BookingPanel id={openBooking} onClose={() => { setOpenBooking(null); void q.refetch() }} />
      <Modal
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        title={`Email ${c.name}`}
        footer={
          <>
            <Button variant="glass" onClick={() => setMsgOpen(false)}>Cancel</Button>
            <Button
              loading={busy}
              disabled={!msg.subject.trim() || !msg.message.trim()}
              onClick={async () => {
                setBusy(true)
                try {
                  await api.clients.message(c.id, msg.subject.trim(), msg.message.trim())
                  toast.success('Email sent')
                  setMsg({ subject: '', message: '' })
                  setMsgOpen(false)
                } catch (err) {
                  toast.error(errorMessage(err))
                } finally {
                  setBusy(false)
                }
              }}
            >
              Send
            </Button>
          </>
        }
      >
        <Field label="Subject"><Input value={msg.subject} onChange={(e) => setMsg({ ...msg, subject: e.target.value })} /></Field>
        <Field label="Message"><Textarea rows={6} value={msg.message} onChange={(e) => setMsg({ ...msg, message: e.target.value })} /></Field>
      </Modal>
    </>
  )
}
