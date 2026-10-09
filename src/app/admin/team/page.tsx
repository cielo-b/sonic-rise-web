'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api, type Role } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { assignableRoles } from '@/lib/roles'
import { ROLE_HINT, ROLE_LABEL } from '@/lib/labels'
import { formatDateTime } from '@/lib/format'
import { Avatar, Button, Checkbox, ConfirmButton, CopyField, Field, Input, Loading, Modal, PageHeader, Select, errorMessage } from '@/components/ui'

export default function TeamPage() {
  const studio = useRequiredStudio()
  const { user } = useAuth()
  const q = useQuery({ queryKey: ['team'], queryFn: api.team.list })
  const roles = assignableRoles(user?.role)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ email: '', name: '', role: 'ENGINEER' as Role, isBookable: true })
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState<string | null>(null)

  async function update(id: string, data: Parameters<typeof api.team.update>[1]) {
    try {
      await api.team.update(id, data)
      void q.refetch()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader title="Team" subtitle="Who can sign in to the studio panel, and what they can do." actions={<Button onClick={() => { setLink(null); setOpen(true) }}><Plus size={16} /> Invite</Button>} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {(['OWNER', 'MANAGER', 'ENGINEER', 'FRONT_DESK'] as Role[]).map((r) => (
          <div key={r} className="glass-card rounded-lg p-3">
            <p className="text-sm font-medium">{ROLE_LABEL[r]}</p>
            <p className="text-xs text-text-muted">{ROLE_HINT[r]}</p>
          </div>
        ))}
      </div>
      {q.isLoading ? (
        <Loading />
      ) : (
        <div className="glass-card rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-white/10">
                {['Person', 'Role', 'Bookable', 'Last sign-in', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {q.data?.map((m) => {
                const editable = roles.includes(m.role) && m.id !== user?.id
                return (
                  <tr key={m.id} className={`border-b border-white/5 ${m.isActive || m.invitePending ? '' : 'opacity-50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} url={m.avatarUrl} />
                        <div>
                          <p className="font-medium">{m.name} {m.id === user?.id && <span className="text-xs text-outline">(you)</span>}</p>
                          <p className="text-xs text-text-muted">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editable ? (
                        <Select value={m.role} onChange={(e) => update(m.id, { role: e.target.value as Role })} className="w-auto">
                          {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </Select>
                      ) : (
                        ROLE_LABEL[m.role]
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="accent-[var(--brand)]" checked={m.isBookable} disabled={!roles.includes(m.role)} onChange={(e) => update(m.id, { isBookable: e.target.checked })} aria-label="Can be booked for sessions" />
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {m.invitePending ? <span className="chip chip-warning">Invite pending</span> : m.lastLoginAt ? formatDateTime(m.lastLoginAt, studio.timezone) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {editable && m.invitePending && (
                        <>
                          <Button variant="quiet" onClick={async () => { try { setLink((await api.team.resendInvite(m.id)).inviteUrl); setOpen(true) } catch (err) { toast.error(errorMessage(err)) } }}>Resend</Button>
                          <ConfirmButton variant="quiet" onConfirm={async () => { await api.team.withdraw(m.id); void q.refetch() }}>Withdraw</ConfirmButton>
                        </>
                      )}
                      {editable && !m.invitePending && (
                        m.isActive ? (
                          <ConfirmButton variant="quiet" onConfirm={() => update(m.id, { isActive: false })} confirmLabel="Remove access?">Deactivate</ConfirmButton>
                        ) : (
                          <Button variant="quiet" onClick={() => update(m.id, { isActive: true })}>Reactivate</Button>
                        )
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Invite a team member">
        {link ? (
          <div className="space-y-3">
            <p className="text-sm">Invitation emailed. You can also share this link (valid 7 days):</p>
            <CopyField value={link} />
            <Button variant="glass" onClick={() => { setLink(null); setF({ email: '', name: '', role: 'ENGINEER', isBookable: true }) }}>Invite someone else</Button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                const res = await api.auth.invite({ email: f.email.trim(), name: f.name.trim() || undefined, role: f.role, isBookable: f.isBookable })
                setLink(res.inviteUrl)
                void q.refetch()
              } catch (err) {
                toast.error(errorMessage(err))
              } finally {
                setBusy(false)
              }
            }}
          >
            <Field label="Email"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Role" hint={ROLE_HINT[f.role]}>
              <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role, isBookable: e.target.value === 'ENGINEER' })}>
                {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </Select>
            </Field>
            <Checkbox checked={f.isBookable} onChange={(e) => setF({ ...f, isBookable: e.target.checked })} label="Can be booked for sessions (engineer / producer)" />
            <Button type="submit" loading={busy}>Send invitation</Button>
          </form>
        )}
      </Modal>
    </>
  )
}
