'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { EmptyState, Loading } from '@/components/ui'
import { STAGE_LABEL } from '@/lib/labels'

export default function MyProjects() {
  const { t } = useI18n()
  const q = useQuery({ queryKey: ['projects', 'mine'], queryFn: () => api.projects.list() })
  if (q.isLoading) return <Loading />
  if (!q.data?.length) return <EmptyState title={t('common.empty')}>Projects appear here when the studio starts working on your music or video.</EmptyState>
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {q.data.map((p) => (
        <Link key={p.id} href={`/portal/projects/${p.id}`} className="glass-card rounded-xl p-5 hover:border-brand-purple/40">
          <p className="font-headline font-semibold">{p.title}</p>
          <p className="text-sm text-text-muted mt-1">{STAGE_LABEL[p.stage]}{p.lead ? ` · ${p.lead.name}` : ''}</p>
          {(p.inReviewCount ?? 0) > 0 && <span className="chip chip-warning mt-3">{p.inReviewCount} to review</span>}
        </Link>
      ))}
    </div>
  )
}
