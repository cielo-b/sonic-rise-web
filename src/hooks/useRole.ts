'use client'

import { useState } from 'react'
import { can as canFn, type Role, type Permission } from '@/lib/roles'

export function useRole() {
  const [role] = useState<Role>(() => {
    if (typeof window === 'undefined') return 'Client'
    return (
      (sessionStorage.getItem('sr_admin_role') as Role) ||
      (localStorage.getItem('sr_admin_role') as Role) ||
      'Client'
    )
  })

  return {
    role,
    can: (p: Permission) => canFn(role, p),
  }
}
