'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDate, money } from '@/lib/format'
import { Avatar, Button, EmptyState, Input, Loading, PageHeader } from '@/components/ui'
import { ClientForm } from '@/components/admin/ClientForm'

export default function ClientsPage() {
  const studio = useRequiredStudio()
  const { can } = useAuth()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const q = useQuery({ queryKey: ['clients', 'list', search], queryFn: () => api.clients.list(search || undefined) })

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={q.data ? `${q.data.length} client${q.data.length === 1 ? '' : 's'}` : undefined}
        actions={can('clients.write') && <Button onClick={() => setOpen(true)}><Plus size={16} /> New client</Button>}
      />
      <Input placeholder="Search name, email, company or phone" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md mb-4" />
      {q.isLoading ? (
        <Loading />
      ) : !q.data?.length ? (
        <EmptyState title={search ? 'No matches' : 'No clients yet'}>Clients appear here when they sign up or book online, or when you add them.</EmptyState>
      ) : (
        <div className="glass-card rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-white/10">
                {['Client', 'Contact', 'Sessions', ...(can('finance.read') ? ['Paid'] : []), 'Last session', 'Portal'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {q.data.map((c) => (
                <tr key={c.id} className={`border-b border-white/5 hover:bg-white/[0.03] ${c.isActive ? '' : 'opacity-50'}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3 hover:text-brand-cyan">
                      <Avatar name={c.name} url={c.avatarUrl} />
                      <span>
                        <span className="font-medium block">{c.name}</span>
                        <span className="text-xs text-outline">{[c.company, c.category].filter(Boolean).join(' · ')}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{c.email}<br />{c.phone}</td>
                  <td className="px-4 py-3">{c.bookingCount}</td>
                  {can('finance.read') && <td className="px-4 py-3 font-mono">{money(c.totalPaid, studio.currency)}</td>}
                  <td className="px-4 py-3 text-text-muted">{c.lastSessionAt ? formatDate(c.lastSessionAt, studio.timezone) : '—'}</td>
                  <td className="px-4 py-3">{c.hasPortalAccess ? <span className="chip chip-success">Active</span> : <span className="chip bg-white/5 text-outline">No login</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ClientForm open={open} onClose={() => setOpen(false)} onSaved={() => void q.refetch()} />
    </>
  )
}
