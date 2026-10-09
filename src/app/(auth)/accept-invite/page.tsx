'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useAuth, homeFor } from '@/context/AuthContext'
import { Button, Checkbox, EmptyState, Field, Input, Loading, errorMessage } from '@/components/ui'
import { AuthCard } from '../AuthCard'
import Link from 'next/link'

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  ENGINEER: 'Engineer',
  FRONT_DESK: 'Front desk',
  CLIENT: 'Client',
}

function Accept() {
  const { t } = useI18n()
  const router = useRouter()
  const { login } = useAuth()
  const token = useSearchParams().get('token') ?? ''
  const invite = useQuery({ queryKey: ['invite', token], queryFn: () => api.auth.describeInvite(token), enabled: !!token, retry: false })
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [accept, setAccept] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill once the invite loads
    if (invite.data) setName(invite.data.name)
  }, [invite.data])

  if (!token || invite.isError) {
    return <AuthCard title={t('auth.activate')}><EmptyState title="This invitation is invalid or has expired">Ask the studio to send a new one.</EmptyState></AuthCard>
  }
  if (!invite.data) return <Loading />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.auth.acceptInvite(token, name.trim(), password)
      const res = await login(invite.data!.email, password, true)
      if ('requires2FA' in res) router.replace('/login')
      else router.replace(homeFor(res.user))
    } catch (err) {
      toast.error(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthCard title={t('auth.inviteTitle', { studio: invite.data.studio })} subtitle={t('auth.inviteSub')}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm">
          {invite.data.email} · <span className="chip chip-purple">{ROLE_LABEL[invite.data.role] ?? invite.data.role}</span>
        </p>
        <Field label={t('common.name')}><Input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t('common.password')} hint={t('auth.passwordHint')}>
          <Input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Checkbox
          checked={accept}
          onChange={(e) => setAccept(e.target.checked)}
          label={<>I agree to the <Link href="/privacy" target="_blank" className="text-brand-cyan hover:underline">{t('auth.privacyLink')}</Link>.</>}
        />
        <Button type="submit" loading={busy} disabled={!accept} className="w-full">{t('auth.activate')}</Button>
      </form>
    </AuthCard>
  )
}

export default function AcceptInvitePage() {
  return <Suspense><Accept /></Suspense>
}
