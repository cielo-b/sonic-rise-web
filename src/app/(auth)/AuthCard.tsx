'use client'

import Link from 'next/link'
import { useStudio } from '@/context/StudioContext'
import { StudioMark, StudioNotFound } from '@/components/site/SiteShell'
import { Loading } from '@/components/ui'

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-hero-radial">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-8"><StudioMark size={40} /></Link>
        <div className="glass-card rounded-2xl p-8">
          <h1 className="font-headline text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted mt-1.5 mb-6">{subtitle}</p>}
          <div className={subtitle ? '' : 'mt-6'}>{children}</div>
        </div>
        {footer && <div className="text-center text-sm text-text-muted mt-6">{footer}</div>}
      </div>
    </main>
  )
}

/** Auth pages belong to a studio. */
export function RequireStudio({ children }: { children: React.ReactNode }) {
  const { studio, isLoading, notFound, slug } = useStudio()
  if (isLoading) return <Loading />
  if (notFound || !slug || !studio) return <StudioNotFound />
  return <>{children}</>
}
