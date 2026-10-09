'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, homeFor } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { LoginForm } from '@/components/auth/AuthForms'
import { AuthCard } from '../AuthCard'
import type { Me } from '@/lib/api'

/** Only allow same-site relative redirects. */
function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

function Login() {
  const studio = useRequiredStudio()
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const next = safeNext(useSearchParams().get('next'))
  const go = (u: Me) => router.replace(next && next !== '/login' && (u.role === 'CLIENT' ? !next.startsWith('/admin') : true) ? next : homeFor(u))

  useEffect(() => {
    if (user) go(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect once when already signed in
  }, [user])

  return (
    <AuthCard
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSub', { studio: studio.name })}
      footer={<>{t('auth.noAccount')} <Link href="/register" className="text-brand-cyan hover:underline">{t('nav.register')}</Link></>}
    >
      <LoginForm onDone={go} />
    </AuthCard>
  )
}

export default function LoginPage() {
  return <Suspense><Login /></Suspense>
}
