'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Globe, Menu, X } from 'lucide-react'
import { useStudio } from '@/context/StudioContext'
import { useAuth, homeFor } from '@/context/AuthContext'
import { LOCALES, useI18n } from '@/lib/i18n'
import type { MessageKey } from '@/lib/i18n'
import { Loading } from '../ui'
import { SoundMark } from './Logo'

export function StudioMark({ size = 32 }: { size?: number }) {
  const { studio } = useStudio()
  if (!studio) return null
  if (studio.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded logo
    return <img src={studio.logoUrl} alt={studio.name} style={{ height: size }} className="w-auto object-contain" />
  }
  return (
    <span className="flex items-center gap-2.5">
      <SoundMark className="text-brand-purple shrink-0" style={{ width: size * 0.9, height: size * 0.9 }} />
      <span className="font-headline font-extrabold text-xl tracking-tight text-text-primary">{studio.name}</span>
    </span>
  )
}

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  return (
    <label className="relative flex items-center gap-1 text-text-muted hover:text-text-primary text-sm">
      <Globe size={15} aria-hidden />
      <span className="sr-only">{t('nav.language')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        className="bg-transparent appearance-none pr-4 cursor-pointer focus:outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-bg-surface">
            {l.code.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-0 pointer-events-none" aria-hidden />
    </label>
  )
}

export function Navbar() {
  const { studio } = useStudio()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links: { href: string; key: MessageKey; show: boolean }[] = [
    { href: '/#services', key: 'nav.services', show: true },
    { href: '/portfolio', key: 'nav.portfolio', show: true },
    { href: '/blog', key: 'nav.blog', show: true },
    { href: '/about', key: 'nav.about', show: !!studio?.content?.aboutBody },
    { href: '/contact', key: 'nav.contact', show: true },
  ]

  const authButtons = user ? (
    <>
      <Link href={homeFor(user)} className="btn-glass text-sm py-2 px-4">
        {user.role === 'CLIENT' ? t('nav.myAccount') : t('nav.dashboard')}
      </Link>
      <button onClick={logout} className="text-sm text-text-muted hover:text-text-primary">
        {t('nav.logout')}
      </button>
    </>
  ) : (
    <>
      <Link href={pathname === '/' ? '/login' : `/login?next=${encodeURIComponent(pathname)}`} className="text-sm text-text-muted hover:text-text-primary px-2">
        {t('nav.login')}
      </Link>
      <Link href="/register" className="btn-glass text-sm py-2 px-4">
        {t('nav.register')}
      </Link>
    </>
  )

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-bg-main/80 backdrop-blur-xl border-b border-white/5">
      <div className="container-studio h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 min-w-0" onClick={() => setOpen(false)}>
          <StudioMark />
        </Link>
        <nav className="hidden lg:flex items-center gap-7" aria-label="Main">
          {links.filter((l) => l.show).map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-text-muted hover:text-text-primary transition-colors">
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher />
          {authButtons}
          <Link href="/booking" className="btn-primary text-sm py-2 px-4">
            {t('nav.book')}
          </Link>
        </div>
        <button className="lg:hidden text-text-primary" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-white/5 bg-bg-main">
          <nav className="container-studio py-4 flex flex-col gap-3" aria-label="Mobile">
            {links.filter((l) => l.show).map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-text-primary py-1">
                {t(l.key)}
              </Link>
            ))}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
              {authButtons}
              <LanguageSwitcher />
            </div>
            <Link href="/booking" onClick={() => setOpen(false)} className="btn-primary text-sm">
              {t('nav.book')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

export function Footer() {
  const { studio } = useStudio()
  const { t } = useI18n()
  if (!studio) return null
  const socials = Object.entries(studio.socials ?? {}).filter(([, url]) => !!url)
  const contact = [studio.address, studio.city].filter(Boolean).join(', ')
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="container-studio py-12 grid gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <StudioMark />
          {studio.tagline && <p className="text-sm text-text-muted max-w-xs">{studio.tagline}</p>}
        </div>
        <div className="space-y-1.5 text-sm text-text-muted">
          {contact && <p>{contact}</p>}
          {studio.phone && <p><a href={`tel:${studio.phone}`} className="hover:text-text-primary">{studio.phone}</a></p>}
          {studio.email && <p><a href={`mailto:${studio.email}`} className="hover:text-text-primary">{studio.email}</a></p>}
        </div>
        {socials.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm md:justify-end">
            {socials.map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary capitalize">
                {name === 'x' ? 'X' : name}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="container-studio py-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-between text-xs text-outline">
        <p>© {new Date().getFullYear()} {studio.name}. {t('footer.rights')}</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-text-primary">{t('footer.privacy')}</Link>
          <Link href="/terms" className="hover:text-text-primary">{t('footer.terms')}</Link>
        </div>
      </div>
    </footer>
  )
}

/** Shown when the address isn't a studio. */
export function StudioNotFound() {
  const { t } = useI18n()
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('studio.notFound')}</h1>
        <p className="text-text-muted mt-2">{t('studio.notFoundSub')}</p>
      </div>
    </main>
  )
}

/** Public pages: navbar + footer, once the studio is known. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const { studio, isLoading, notFound, slug } = useStudio()
  if (isLoading) return <Loading />
  if (notFound || (slug && !studio)) return <StudioNotFound />
  if (!studio) return <PlatformLanding />
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-[70vh]">{children}</main>
      <Footer />
    </>
  )
}

/** The bare platform domain (no studio): sign-in for platform admins only. */
function PlatformLanding() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="space-y-4">
        <h1 className="font-headline text-3xl font-bold">Studio platform</h1>
        <p className="text-text-muted">Each studio has its own address. Platform administrators can sign in here.</p>
        <Link href="/platform/login" className="btn-primary">Platform sign-in</Link>
      </div>
    </main>
  )
}
