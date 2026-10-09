import { PortalShell } from '@/components/portal/PortalShell'
import { RequireStudio } from '../(auth)/AuthCard'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireStudio>
      <PortalShell>{children}</PortalShell>
    </RequireStudio>
  )
}
