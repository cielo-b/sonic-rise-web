'use client'

import { useState } from 'react'
import { can as canFn, roleFromToken, type Role, type Permission } from '@/lib/roles'

export function useRole() {
  const [role] = useState<Role>(() => {
    if (typeof window === 'undefined') return 'Client'
    const token = localStorage.getItem('sr_token') ?? sessionStorage.getItem('sr_token')
    return token ? roleFromToken(token) : 'Client'
  })

  return {
    role,
    can: (p: Permission) => canFn(role, p),
  }
}
