'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, type ProjectStage } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDateTime, money } from '@/lib/format'
import { STAGES, STAGE_LABEL } from '@/lib/labels'
import { Avatar, Badge, Button, Card, Checkbox, ErrorState, Field, Input, Loading, Modal, Select, Textarea, errorMessage } from '@/components/ui'
import { BookingPanel } from '@/components/admin/BookingPanel'

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const studio = useRequiredStudio()
  const { user, can } = useAuth()
  const q = useQuery({ queryKey: ['project', id], queryFn: () => api.projects.get(id) })
  const team = useQuery({ queryKey: ['engineers'], queryFn: api.engineers.list })
  const [note, setNote] = useState('')
  const [shared, setShared] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [newFile, setNewFile] = useState(false)
  const [file, setFile] = useState({ title: '', description: '', price: '0' })
  const [openBooking, setOpenBooking] = useState<string | null>(null)

  if (q.isLoading) return <Loading />
  const p = q.data
  if (!p) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const write = can('projects.write')

  async function update(data: Parameters<typeof api.projects.update>[1]) {
    try {
      await api.projects.update(id, data)
      void q.refetch()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-text-muted">
            <Link href={`/admin/clients/${p.clientId}`} className="hover:text-brand-cyan">{p.client?.name}</Link>
          </p>
          <h1 className="font-headline text-2xl font-bold">{p.title}</h1>
          {p.description && <p className="text-sm text-text-muted mt-1 whitespace-pre-line max-w-2xl">{p.description}</p>}
        </div>
        {write && (
          <div className="flex flex-wrap gap-2 items-end">
            <Field label="Stage">
              <Select value={p.stage} onChange={(e) => update({ stage: e.target.value as ProjectStage })}>
                {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </Select>
            </Field>
            <Field label="Lead">
              <Select value={p.leadId ?? ''} onChange={(e) => update({ leadId: e.target.value })}>
                <option value="">—</option>
                {team.data?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Field label="Due"><input type="date" className="input-studio text-sm" value={p.dueDate ?? ''} onChange={(e) => update({ dueDate: e.target.value })} /></Field>
            <Button variant="glass" onClick={() => update({ isArchived: !p.isArchived })}>{p.isArchived ? 'Unarchive' : 'Archive'}</Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-headline font-semibold">Files for the client</h2>
              {can('deliverables.upload') && <Button variant="glass" onClick={() => setNewFile(true)}><Plus size={14} /> New deliverable</Button>}
            </div>
            {p.deliverables.length === 0 && <p className="text-sm text-text-muted">No deliverables yet. Create one, then upload versions for the client to review.</p>}
            <div className="space-y-2">
              {p.deliverables.map((d) => (
                <Link key={d.id} href={`/admin/files/${d.id}`} className="glass-card rounded-lg p-4 flex flex-wrap justify-between gap-3 hover:border-brand-purple/40">
                  <span>
                    <span className="font-medium">{d.title}</span>
                    <span className="text-xs text-outline ml-2">{d.latestVersion ? `v${d.latestVersion}` : 'no upload yet'}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    {d.price > 0 && <span className="font-mono">{money(d.price, d.currency)}{d.isPaid ? ' · paid' : ''}</span>}
                    <Badge status={d.status} />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-headline font-semibold mb-3">Sessions</h2>
            {p.sessions.length === 0 && <p className="text-sm text-text-muted">Link bookings to this project from the booking’s edit screen.</p>}
            {p.sessions.map((s) => (
              <button key={s.id} onClick={() => setOpenBooking(s.id)} className="w-full glass-card rounded-lg p-3 flex justify-between text-sm mb-2 text-left hover:border-brand-purple/40">
                <span>{formatDateTime(s.startsAt, studio.timezone)} · {s.package.name} · {s.room.name}{s.engineer ? ` · ${s.engineer.name}` : ''}</span>
                <Badge status={s.status} />
              </button>
            ))}
          </section>
        </div>

        <section>
          <h2 className="font-headline font-semibold mb-3">Notes</h2>
          {write && (
            <Card className="p-4 space-y-3 mb-4">
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Session notes, settings, to-dos…" />
              <Checkbox checked={shared} onChange={(e) => setShared(e.target.checked)} label="Show this note to the client" />
              <Button
                loading={busy === 'note'}
                disabled={!note.trim()}
                onClick={async () => {
                  setBusy('note')
                  try {
                    await api.projects.addNote(id, { body: note.trim(), visibleToClient: shared })
                    setNote('')
                    setShared(false)
                    void q.refetch()
                  } catch (err) {
                    toast.error(errorMessage(err))
                  } finally {
                    setBusy(null)
                  }
                }}
              >
                Add note
              </Button>
            </Card>
          )}
          <div className="space-y-3">
            {p.notes.map((n) => (
              <Card key={n.id} className="p-4">
                <div className="flex justify-between gap-2">
                  <p className="text-xs text-text-muted flex items-center gap-2">
                    <Avatar name={n.author?.name ?? '?'} url={n.author?.avatarUrl} size={20} /> {n.author?.name} · {formatDateTime(n.createdAt, studio.timezone)}
                    {n.visibleToClient && <span className="chip chip-info">Shared</span>}
                  </p>
                  {(n.author?.id === user?.id || can('staff.manage')) && (
                    <button aria-label="Delete note" className="text-outline hover:text-red-300" onClick={async () => { await api.projects.deleteNote(n.id); void q.refetch() }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm mt-2 whitespace-pre-line">{n.body}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <Modal
        open={newFile}
        onClose={() => setNewFile(false)}
        title="New deliverable"
        footer={
          <>
            <Button variant="glass" onClick={() => setNewFile(false)}>Cancel</Button>
            <Button
              loading={busy === 'file'}
              disabled={!file.title.trim()}
              onClick={async () => {
                setBusy('file')
                try {
                  const d = await api.projects.addDeliverable(id, { title: file.title.trim(), description: file.description.trim() || undefined, price: Number(file.price) || 0 })
                  window.location.href = `/admin/files/${d.id}`
                } catch (err) {
                  toast.error(errorMessage(err))
                  setBusy(null)
                }
              }}
            >
              Create and upload
            </Button>
          </>
        }
      >
        <Field label="Title" hint='e.g. "Track 1 – mix", "Final master", "Stems"'><Input value={file.title} onChange={(e) => setFile({ ...file, title: e.target.value })} /></Field>
        <Field label="Description"><Textarea rows={2} value={file.description} onChange={(e) => setFile({ ...file, description: e.target.value })} /></Field>
        <Field label={`Download price (${studio.currency})`} hint="0 = free once the client approves"><Input type="number" min={0} value={file.price} onChange={(e) => setFile({ ...file, price: e.target.value })} /></Field>
      </Modal>
      <BookingPanel id={openBooking} onClose={() => setOpenBooking(null)} />
    </>
  )
}
