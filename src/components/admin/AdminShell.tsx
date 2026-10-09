'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  Users,
  UserCog,
  Film,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useStudio } from '@/context/StudioContext'
import { StudioMark } from '@/components/site/SiteShell'
import type { Permission } from '@/lib/roles'
import { ROLE_LABEL } from '@/lib/labels'
import { Avatar, Loading } from '../ui'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  /** Any of these grants access. */
  any: Permission[]
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Studio',
    items: [
      { href: '/admin', label: 'Today', icon: LayoutDashboard, any: ['bookings.read'] },
      { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays, any: ['bookings.read'] },
      { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList, any: ['bookings.read'] },
      { href: '/admin/clients', label: 'Clients', icon: Users, any: ['clients.read'] },
      { href: '/admin/projects', label: 'Projects & files', icon: FolderKanban, any: ['projects.read'] },
      { href: '/admin/billing', label: 'Quotes & invoices', icon: Receipt, any: ['finance.read'] },
      { href: '/admin/inquiries', label: 'Inquiries', icon: Inbox, any: ['clients.read'] },
    ],
  },
  {
    section: 'Business',
    items: [
      { href: '/admin/services', label: 'Services, rooms & gear', icon: Package, any: ['resources.manage'] },
      { href: '/admin/reports', label: 'Reports', icon: BarChart3, any: ['reports.read'] },
      { href: '/admin/team', label: 'Team', icon: UserCog, any: ['staff.manage'] },
    ],
  },
  {
    section: 'Website',
    items: [
      { href: '/admin/website', label: 'Site content', icon: Globe, any: ['studio.settings'] },
      { href: '/admin/portfolio', label: 'Portfolio', icon: Film, any: ['content.write'] },
      { href: '/admin/blog', label: 'Blog', icon: BookOpen, any: ['content.write'] },
      { href: '/admin/media', label: 'Media library', icon: ImageIcon, any: ['content.write'] },
    ],
  },
]

/** Path prefixes that require a permission beyond being staff. */
export function allowedPath(pathname: string, can: (p: Permission) => boolean): boolean {
  const item = NAV.flatMap((s) => s.items)
    .filter((i) => i.href !== '/admin' && pathname.startsWith(i.href))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/account')) return true
  if (!item) return can('bookings.read')
  return item.any.some(can)
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isStaff, can, logout } = useAuth()
  const { studio } = useStudio()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    else if (!isStaff) router.replace('/portal')
  }, [user, isLoading, isStaff, pathname, router])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile menu on navigation
  useEffect(() => setOpen(false), [pathname])

  if (isLoading || !user || !isStaff) return <Loading />

  const sidebar = (
    <aside className="w-64 h-full bg-surface-container-lowest border-r border-white/5 flex flex-col">
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/5">
        <Link href="/admin" className="min-w-0 truncate"><StudioMark size={28} /></Link>
        <button className="md:hidden text-text-muted" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Admin">
        {NAV.map((section) => {
          const items = section.items.filter((i) => i.any.some(can))
          if (!items.length) return null
          return (
            <div key={section.section}>
              <p className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-outline">{section.section}</p>
              {items.map((i) => {
                const active = i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)
                const Icon = i.icon
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active ? 'bg-brand-purple/20 text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} /> {i.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/5">
          <ExternalLink size={16} /> View website
        </Link>
        <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/5">
          <Settings size={16} /> Settings
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name={user.name} url={user.avatarUrl} size={30} />
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{user.name}</p>
            <p className="text-[11px] text-outline">{ROLE_LABEL[user.role]}</p>
          </div>
          <button
            onClick={() => { logout(); router.replace('/login') }}
            className="text-text-muted hover:text-text-primary"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:block fixed inset-y-0 left-0 z-30">{sidebar}</div>
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)}>
          <div className="h-full w-64" onClick={(e) => e.stopPropagation()}>{sidebar}</div>
        </div>
      )}
      <div className="flex-1 min-w-0 md:ml-64">
        <header className="md:hidden sticky top-0 z-20 h-14 flex items-center gap-3 px-4 bg-bg-main/90 backdrop-blur border-b border-white/5">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <span className="font-headline font-semibold truncate">{studio?.name}</span>
        </header>
        <main className="p-4 md:p-8 max-w-[1400px]">
          {allowedPath(pathname, can) ? children : (
            <div className="text-center py-20">
              <p className="font-headline text-xl font-semibold">You don’t have access to this page</p>
              <p className="text-sm text-text-muted mt-2">Ask the studio owner if you need it.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
