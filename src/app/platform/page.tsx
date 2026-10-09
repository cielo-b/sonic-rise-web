'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, CopyField, EmptyState, Field, Input, Loading, PageHeader, errorMessage } from '@/components/ui'

export default function PlatformPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!isLoading && user?.role !== 'PLATFORM_ADMIN') router.replace('/platform/login')
  }, [user, isLoading, router])

  const q = useQuery({ queryKey: ['platform', 'studios'], queryFn: api.platform.studios, enabled: user?.role === 'PLATFORM_ADMIN' })
  const [f, setF] = useState({ name: '', slug: '', ownerEmail: '', ownerName: '' })
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState<string | null>(null)
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN

  if (isLoading || user?.role !== 'PLATFORM_ADMIN') return <Loading />

  return (
    <main className="container-studio max-w-5xl py-10">
      <PageHeader title="Studios" subtitle="Onboard studios onto the platform." actions={<Button variant="glass" onClick={() => { logout(); router.replace('/platform/login') }}>Sign out</Button>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          {q.isLoading ? (
            <Loading />
          ) : !q.data?.length ? (
            <EmptyState title="No studios yet" />
          ) : (
            <div className="glass-card rounded-xl divide-y divide-white/5">
              {q.data.map((s) => (
                <div key={s.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${s.isActive ? '' : 'opacity-50'}`}>
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-text-muted font-mono">{base ? `${s.slug}.${base}` : s.slug}</p>
                  </div>
                  <Button variant="glass" onClick={async () => { await api.platform.setActive(s.id, !s.isActive); void q.refetch() }}>
                    {s.isActive ? 'Suspend' : 'Reactivate'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
        <Card className="p-6 h-fit">
          <p className="font-headline font-semibold mb-4">New studio</p>
          {invite ? (
            <div className="space-y-3">
              <p className="text-sm">Created. The owner was emailed an invitation; you can also share this link:</p>
              <CopyField value={invite} />
              <Button variant="glass" onClick={() => { setInvite(null); setF({ name: '', slug: '', ownerEmail: '', ownerName: '' }) }}>Add another</Button>
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault()
                setBusy(true)
                try {
                  const res = await api.platform.createStudio({ name: f.name.trim(), slug: f.slug.trim(), ownerEmail: f.ownerEmail.trim(), ownerName: f.ownerName.trim() || undefined })
                  setInvite(res.inviteUrl)
                  void q.refetch()
                } catch (err) {
                  toast.error(errorMessage(err))
                } finally {
                  setBusy(false)
                }
              }}
            >
              <Field label="Studio name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })} /></Field>
              <Field label="Web address" hint={base ? `${f.slug || 'name'}.${base}` : 'Lowercase letters, digits and dashes'}>
                <Input required pattern="[a-z0-9][a-z0-9-]{1,61}[a-z0-9]" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase() })} />
              </Field>
              <Field label="Owner email"><Input type="email" required value={f.ownerEmail} onChange={(e) => setF({ ...f, ownerEmail: e.target.value })} /></Field>
              <Field label="Owner name"><Input value={f.ownerName} onChange={(e) => setF({ ...f, ownerName: e.target.value })} /></Field>
              <Button type="submit" loading={busy} className="w-full">Create & invite owner</Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  )
}
