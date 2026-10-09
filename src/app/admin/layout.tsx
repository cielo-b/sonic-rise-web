import { AdminShell } from '@/components/admin/AdminShell'
import { RequireStudio } from '../(auth)/AuthCard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireStudio>
      <AdminShell>{children}</AdminShell>
    </RequireStudio>
  )
}
