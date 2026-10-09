'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api, type ProjectStage } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { STAGES, STAGE_LABEL } from '@/lib/labels'
import { Avatar, Button, Checkbox, EmptyState, Field, Input, Loading, Modal, PageHeader, Select, Textarea, errorMessage } from '@/components/ui'

function NewProject({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const clients = useQuery({ queryKey: ['clients', 'list', ''], queryFn: () => api.clients.list(), enabled: open })
  const team = useQuery({ queryKey: ['engineers'], queryFn: api.engineers.list, enabled: open })
  const [f, setF] = useState({ clientId: '', title: '', description: '', stage: 'DEMO' as ProjectStage, leadId: '', dueDate: '' })
  const [busy, setBusy] = useState(false)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      footer={<><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" form="project-form" loading={busy}>Create</Button></>}
    >
      <form
        id="project-form"
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            const p = await api.projects.create({
              clientId: f.clientId,
              title: f.title.trim(),
              description: f.description.trim() || undefined,
              stage: f.stage,
              leadId: f.leadId || undefined,
              dueDate: f.dueDate || undefined,
            })
            router.push(`/admin/projects/${p.id}`)
          } catch (err) {
            toast.error(errorMessage(err))
            setBusy(false)
          }
        }}
      >
        <Field label="Client">
          <Select required value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">Choose…</option>
            {clients.data?.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
          </Select>
        </Field>
        <Field label="Title" hint='e.g. "Debut EP", "Music video – Umutima"'><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Description"><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Stage">
            <Select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as ProjectStage })}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </Select>
          </Field>
          <Field label="Lead">
            <Select value={f.leadId} onChange={(e) => setF({ ...f, leadId: e.target.value })}>
              <option value="">—</option>
              {team.data?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Due"><input type="date" className="input-studio text-sm" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
        </div>
      </form>
    </Modal>
  )
}

export default function ProjectsPage() {
  const { can } = useAuth()
  const [archived, setArchived] = useState(false)
  const [open, setOpen] = useState(false)
  const q = useQuery({ queryKey: ['projects', 'list', archived], queryFn: () => api.projects.list(archived) })
  const byStage = STAGES.map((s) => ({ stage: s, items: (q.data ?? []).filter((p) => p.stage === s && (archived || !p.isArchived)) })).filter((c) => c.items.length)

  return (
    <>
      <PageHeader
        title="Projects & files"
        actions={
          <>
            <Checkbox checked={archived} onChange={(e) => setArchived(e.target.checked)} label="Show archived" />
            {can('projects.write') && <Button onClick={() => setOpen(true)}><Plus size={16} /> New project</Button>}
          </>
        }
      />
      {q.isLoading ? (
        <Loading />
      ) : !q.data?.length ? (
        <EmptyState title="No projects yet">Create a project to track a client’s work from demo to release, share notes and deliver files for approval.</EmptyState>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {byStage.map((col) => (
            <div key={col.stage} className="w-72 shrink-0 space-y-2">
              <p className="text-xs font-mono uppercase tracking-wider text-text-muted px-1">{STAGE_LABEL[col.stage]} · {col.items.length}</p>
              {col.items.map((p) => (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className={`block glass-card rounded-xl p-4 hover:border-brand-purple/40 ${p.isArchived ? 'opacity-50' : ''}`}>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-text-muted mt-1">{p.client?.name}</p>
                  <div className="flex items-center justify-between mt-3">
                    {p.lead ? <Avatar name={p.lead.name} url={p.lead.avatarUrl} size={24} /> : <span />}
                    <span className="text-xs text-outline">
                      {p.deliverableCount ?? 0} files{(p.inReviewCount ?? 0) > 0 && <span className="text-amber-300"> · {p.inReviewCount} in review</span>}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
      <NewProject open={open} onClose={() => setOpen(false)} />
    </>
  )
}
