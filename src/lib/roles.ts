export type Role    = 'Super Admin' | 'Client'
export type ApiRole = 'SUPERADMIN'  | 'CLIENT'

export function toRole(apiRole: ApiRole): Role {
  return apiRole === 'SUPERADMIN' ? 'Super Admin' : 'Client'
}

/** Reads the role claim from the JWT; anything unreadable is treated as a client. */
export function roleFromToken(token: string): Role {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return toRole(payload.role as ApiRole)
  } catch {
    return 'Client'
  }
}

export const PERMISSIONS = {
  'revenue:view':      ['Super Admin'],
  'bookings:write':    ['Super Admin', 'Client'],
  'clients:write':     ['Super Admin'],
  'content:write':     ['Super Admin'],
  'media:upload':      ['Super Admin'],
  'users:manage':      ['Super Admin'],
  'settings:billing':  ['Super Admin'],
  'settings:general':  ['Super Admin', 'Client'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}

/** Returns true if the given pathname is accessible to the role */
export function routeAllowed(pathname: string, role: Role): boolean {
  if (pathname.startsWith('/admin/users'))    return can(role, 'users:manage')
  if (pathname.startsWith('/admin/settings')) return can(role, 'settings:general')
  if (pathname.startsWith('/admin/clients'))  return can(role, 'clients:write')
  if (pathname.startsWith('/admin/blog'))     return can(role, 'content:write')
  return true
}
