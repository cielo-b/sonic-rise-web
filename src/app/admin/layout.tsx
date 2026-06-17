'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, ShieldOff } from 'lucide-react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AuthProvider } from '@/context/AuthContext'
import { routeAllowed, type Role } from '@/lib/roles'

function NotAuthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <ShieldOff size={28} className="text-red-400" />
      </div>
      <div>
        <h2 className="font-headline text-2xl font-bold text-[#E4E1EC] mb-2">Access Denied</h2>
        <p className="text-[#929095] text-sm max-w-xs leading-relaxed">
          You don&apos;t have permission to view this page. Contact your Super Admin if you need access.
        </p>
      </div>
      <Link href="/admin" className="btn-primary text-sm px-6 py-2.5">
        Back to Dashboard
      </Link>
    </div>
  )
}

const AUTH_PAGES = ['/admin/login', '/admin/forgot-password', '/admin/otp', '/admin/set-password', '/admin/accept-invite']

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const [open, setOpen]     = useState(false)
  const [checked, setChecked] = useState(false)
  const [role, setRole]     = useState<Role>('Client')

  const isAuthPage = AUTH_PAGES.includes(pathname)

  useEffect(() => {
    if (isAuthPage) { setChecked(true); return }

    const token =
      localStorage.getItem('sr_token') ??
      sessionStorage.getItem('sr_token')

    if (!token) {
      router.replace('/admin/login')
      return
    }

    const storedRole = (
      (sessionStorage.getItem('sr_admin_role') as Role) ||
      (localStorage.getItem('sr_admin_role') as Role) ||
      'Super Admin'
    )
    setRole(storedRole)
    setChecked(true)
  }, [isAuthPage, router])

  if (isAuthPage) return <>{children}</>
  if (!checked)   return null

  const isBlocked = !routeAllowed(pathname, role)

  return (
    <div className="flex min-h-screen bg-[#13131A]">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <AdminSidebar onClose={() => setOpen(false)} />
      </div>

      <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <div className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-[#0D0E15] border-b border-white/8">
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg glass-card text-text-muted hover:text-text-primary transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <span className="font-headline font-semibold text-text-primary text-sm tracking-tight">
            SonicRise Admin
          </span>
        </div>
        <main className="flex-1">
          {isBlocked ? <NotAuthorized /> : children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  )
}
