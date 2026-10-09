'use client'

import Link from 'next/link'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'

export default function AboutPage() {
  const studio = useRequiredStudio()
  const { t } = useI18n()
  const c = studio.content ?? {}
  return (
    <div className="container-studio py-16 grid gap-10 lg:grid-cols-2 items-start">
      <div>
        <h1 className="font-headline text-4xl font-bold">{c.aboutTitle || studio.name}</h1>
        {c.aboutBody ? (
          <div className="mt-6 space-y-4 text-text-muted leading-relaxed">
            {c.aboutBody.split(/\n\s*\n/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
          </div>
        ) : (
          <p className="mt-6 text-text-muted">{studio.tagline}</p>
        )}
        <Link href="/booking" className="btn-primary mt-8">{t('home.bookCta')}</Link>
      </div>
      {c.aboutImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded image
        <img src={c.aboutImageUrl} alt="" className="w-full rounded-2xl object-cover" />
      )}
    </div>
  )
}
