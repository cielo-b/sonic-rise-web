'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { formatDate, formatDateTime } from '@/lib/format'
import { Badge, Card, ErrorState, Loading } from '@/components/ui'
import { STAGE_LABEL, STAGES } from '@/lib/labels'

export default function MyProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const studio = useRequiredStudio()
  const { locale } = useI18n()
  const q = useQuery({ queryKey: ['project', id], queryFn: () => api.projects.get(id) })
  if (q.isLoading) return <Loading />
  const p = q.data
  if (!p) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const stageIndex = STAGES.indexOf(p.stage)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-2xl font-bold">{p.title}</h2>
        {p.description && <p className="text-sm text-text-muted mt-1 whitespace-pre-line">{p.description}</p>}
        {p.dueDate && <p className="text-xs text-outline mt-1">Due {formatDate(`${p.dueDate}T12:00:00Z`, 'UTC', locale)}</p>}
      </div>
      <ol className="flex gap-1 overflow-x-auto">
        {STAGES.map((s, i) => (
          <li key={s} className={`flex-1 min-w-24 text-center text-xs py-2 rounded ${i <= stageIndex ? 'bg-brand-purple/25 text-text-primary' : 'bg-white/5 text-outline'}`}>
            {STAGE_LABEL[s]}
          </li>
        ))}
      </ol>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="font-headline font-semibold">Files</h3>
          {p.deliverables.length === 0 && <p className="text-sm text-text-muted">No files yet.</p>}
          {p.deliverables.map((d) => (
            <Link key={d.id} href={`/portal/files/${d.id}`} className="glass-card rounded-xl p-4 flex justify-between items-center hover:border-brand-purple/40">
              <span>{d.title} {d.latestVersion > 0 && <span className="text-xs text-outline">v{d.latestVersion}</span>}</span>
              <Badge status={d.status} />
            </Link>
          ))}
        </section>
        <section className="space-y-3">
          <h3 className="font-headline font-semibold">Updates from the studio</h3>
          {p.notes.length === 0 && <p className="text-sm text-text-muted">No updates yet.</p>}
          {p.notes.map((n) => (
            <Card key={n.id} className="p-4">
              <p className="text-xs text-text-muted">{n.author?.name} · {formatDateTime(n.createdAt, studio.timezone, locale)}</p>
              <p className="text-sm mt-1 whitespace-pre-line">{n.body}</p>
            </Card>
          ))}
          {p.sessions.length > 0 && (
            <>
              <h3 className="font-headline font-semibold pt-3">Sessions</h3>
              {p.sessions.map((s) => (
                <Link key={s.id} href={`/portal/bookings/${s.id}`} className="glass-card rounded-xl p-3 flex justify-between text-sm hover:border-brand-purple/40">
                  <span>{s.package.name} · {formatDateTime(s.startsAt, studio.timezone, locale)}</span>
                  <Badge status={s.status} />
                </Link>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
