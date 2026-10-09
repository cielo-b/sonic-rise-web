'use client'

import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'

export default function LegalPage() {
  const studio = useRequiredStudio()
  const { t } = useI18n()
  const text = studio.content?.termsOfService
  return (
    <div className="container-studio max-w-3xl py-16">
      <h1 className="font-headline text-4xl font-bold">{t('legal.termsTitle')}</h1>
      <p className="text-sm text-text-muted mt-2">{studio.name}</p>
      {text ? (
        <div className="mt-8 space-y-4 text-text-muted leading-relaxed">
          {text.split(/\n\s*\n/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
      ) : (
        <p className="mt-8 text-text-muted">{t('legal.notPublished')}</p>
      )}
    </div>
  )
}
