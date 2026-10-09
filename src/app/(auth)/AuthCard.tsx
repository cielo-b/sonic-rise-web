'use client'

import Link from 'next/link'
import { useStudio } from '@/context/StudioContext'
import { StudioMark, StudioNotFound } from '@/components/site/SiteShell'
import { Loading } from '@/components/ui'
import { Equalizer, Orbs } from '@/components/site/SoundFx'

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { studio } = useStudio()
  const image = studio?.content?.heroImageUrl || studio?.content?.aboutImageUrl
  return (
    <main className="min-h-screen flex">
      <div className="hidden lg:flex relative w-1/2 overflow-hidden items-end">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded image
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        )}
        <Orbs />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/30 to-transparent" />
        <div className="relative p-12 pb-40 space-y-4">
          <StudioMark size={44} />
          {(studio?.content?.heroSubtitle || studio?.tagline) && (
            <p className="text-text-muted text-lg max-w-md">{studio?.content?.heroSubtitle || studio?.tagline}</p>
          )}
        </div>
        <Equalizer bars={48} className="absolute bottom-0 inset-x-0 h-28 opacity-70" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="w-full max-w-md">
          <Link href="/" className="flex justify-center mb-8 lg:hidden"><StudioMark size={40} /></Link>
          <div className="glass-card rounded-2xl p-8">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-text-muted mt-1.5 mb-6">{subtitle}</p>}
            <div className={subtitle ? '' : 'mt-6'}>{children}</div>
          </div>
          {footer && <div className="text-center text-sm text-text-muted mt-6">{footer}</div>}
        </div>
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
