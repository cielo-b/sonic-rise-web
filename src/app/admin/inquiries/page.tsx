'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDateTime } from '@/lib/format'
import { Button, Card, EmptyState, Loading, PageHeader } from '@/components/ui'

export default function InquiriesPage() {
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const q = useQuery({ queryKey: ['inquiries'], queryFn: api.inquiries.list })
  return (
    <>
      <PageHeader title="Inquiries" subtitle="Messages from the contact form on your website." />
      {q.isLoading ? (
        <Loading />
      ) : !q.data?.length ? (
        <EmptyState title="No messages yet" />
      ) : (
        <div className="space-y-3">
          {q.data.map((m) => (
            <Card key={m.id} className={`p-5 ${m.isHandled ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-medium">{m.subject || 'No subject'}</p>
                  <p className="text-sm text-text-muted">
                    {m.name} · <a href={`mailto:${m.email}`} className="text-brand-cyan hover:underline">{m.email}</a>
                    {m.phone && <> · <a href={`tel:${m.phone}`}>{m.phone}</a></>} · {formatDateTime(m.createdAt, studio.timezone)}
                  </p>
                </div>
                {can('clients.write') && (
                  <Button variant="glass" onClick={async () => { await api.inquiries.setHandled(m.id, !m.isHandled); void q.refetch() }}>
                    {m.isHandled ? 'Mark as new' : 'Mark handled'}
                  </Button>
                )}
              </div>
              <p className="text-sm mt-3 whitespace-pre-line">{m.message}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
