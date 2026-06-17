'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FolderOpen, CalendarDays,
  Users, Settings, Plus, X, LogOut, UserCog, BookOpen,
} from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import { useAuth } from '@/context/AuthContext'
import { useMe } from '@/lib/queries'
import { toRole, type ApiRole } from '@/lib/roles'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'

const NAV_LINKS = [
  { label: 'Analytics',     href: '/admin',          icon: LayoutDashboard },
  { label: 'Media Manager', href: '/admin/media',     icon: FolderOpen      },
  { label: 'Bookings',      href: '/admin/bookings',  icon: CalendarDays    },
  { label: 'Clients',       href: '/admin/clients',   icon: Users           },
  { label: 'Blog',          href: '/admin/blog',      icon: BookOpen        },
  { label: 'Team & Users',  href: '/admin/users',     icon: UserCog         },
  { label: 'Settings',      href: '/admin/settings',  icon: Settings        },
]

interface Props {
  /** Called when the mobile close button is tapped */
  onClose?: () => void
}

export function AdminSidebar({ onClose }: Props) {
  const pathname      = usePathname()
  const router        = useRouter()
  const { can, role }       = useRole()
  const { logout }    = useAuth()
  const { data: me }  = useMe()
  
  const isSuperAdmin = role === 'Super Admin'
  const visibleLinks  = NAV_LINKS.filter((l) => {
    if (!isSuperAdmin) {
      return ['Analytics', 'Media Manager', 'Bookings', 'Settings'].includes(l.label)
    }
    return l.href !== '/admin/users' || can('users:manage')
  })

  function handleLogout() {
    logout()
    router.push('/admin/login')
  }

  const displayName    = me?.name ?? sessionStorage.getItem('sr_admin_name') ?? 'Admin User'
  const displayRole    = me ? toRole(me.role as ApiRole) : (sessionStorage.getItem('sr_admin_role') ?? 'Admin')
  const displayInitials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <aside className="h-screen w-64 flex flex-col bg-[#0D0E15] border-r border-[#47464B]/50">

      {/* ── Logo row ────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 border-b border-[#47464B]/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center text-[#D2BBFF]">
            <SonicRiseMark className="w-5 h-5" />
          </div>
          <div>
            <span className="font-headline text-[#E4E1EC] font-semibold text-[15px] leading-tight tracking-tight">
              SonicRise
            </span>
            <p className="font-mono text-[10px] text-[#929095] tracking-widest uppercase mt-0.5">
              Production Suite v2.0
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg glass-card text-[#929095] hover:text-[#E4E1EC] transition-colors ml-2 shrink-0"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {visibleLinks.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-[#6001D1] text-[#C9AEFF]'
                  : 'text-[#C8C5CB] hover:bg-[#1F1F27] hover:text-[#E4E1EC]'
              }`}
            >
              <Icon size={17} className={active ? 'text-[#D2BBFF]' : 'text-[#929095]'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom ──────────────────────────────────────────────────────── */}
      <div className="px-3 pb-6 pt-4 border-t border-[#47464B]/30 space-y-3">
        <button
          onClick={() => {
            sessionStorage.setItem('sr_open_new_booking', '1')
            router.push('/admin/bookings')
          }}
          className="btn-primary w-full text-sm gap-2 py-2.5"
        >
          <Plus size={15} />
          New Project
        </button>

        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1F1F27] transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6001D1] flex items-center justify-center shrink-0">
            <span className="font-mono text-[11px] font-bold text-white">{displayInitials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[#E4E1EC] text-[13px] font-medium truncate">{displayName}</p>
            <p className="text-[#929095] text-[11px] font-mono uppercase tracking-wider truncate">
              {displayRole}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[#929095] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
