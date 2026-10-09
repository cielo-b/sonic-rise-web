'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, homeFor } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { RegisterForm } from '@/components/auth/AuthForms'
import { AuthCard } from '../AuthCard'

export default function RegisterPage() {
  const studio = useRequiredStudio()
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  useEffect(() => {
    if (user) router.replace(homeFor(user))
  }, [user, router])
  return (
    <AuthCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSub', { studio: studio.name })}
      footer={<>{t('auth.haveAccount')} <Link href="/login" className="text-brand-cyan hover:underline">{t('nav.login')}</Link></>}
    >
      <RegisterForm onDone={() => router.replace('/portal')} />
    </AuthCard>
  )
}
