'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useI18n, type MessageKey } from '@/lib/i18n'
import { Navbar } from '@/components/site/SiteShell'
import { Loading } from '../ui'

const NAV: { href: string; key: MessageKey }[] = [
  { href: '/portal', key: 'portal.overview' },
  { href: '/portal/bookings', key: 'portal.bookings' },
  { href: '/portal/projects', key: 'portal.projects' },
  { href: '/portal/billing', key: 'portal.billing' },
  { href: '/portal/account', key: 'portal.account' },
]

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isStaff } = useAuth()
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    else if (isStaff) router.replace('/admin')
  }, [user, isLoading, isStaff, pathname, router])

  if (isLoading || !user || isStaff) return <Loading />

  return (
    <>
      <Navbar />
      <div className="pt-16 container-studio py-10">
        <h1 className="font-headline text-3xl font-bold mt-6">{t('portal.title')}</h1>
        <p className="text-sm text-text-muted mt-1">{user.name}</p>
        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 mt-6 mb-8" aria-label="Account">
          {NAV.map((n) => {
            const active = n.href === '/portal' ? pathname === '/portal' : pathname.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px ${
                  active ? 'border-brand-purple text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {t(n.key)}
              </Link>
            )
          })}
        </nav>
        {children}
      </div>
    </>
  )
}
