import type { Role } from './api'

/**
 * Mirrors the API's permission map (sonic-rise-api/src/common/permissions.ts).
 * Used only to shape the UI — the API enforces every permission itself.
 */
export type Permission =
  | 'bookings.read'
  | 'bookings.write'
  | 'clients.read'
  | 'clients.write'
  | 'staff.manage'
  | 'resources.manage'
  | 'finance.read'
  | 'finance.write'
  | 'projects.read'
  | 'projects.write'
  | 'deliverables.upload'
  | 'content.write'
  | 'reports.read'
  | 'studio.settings'
  | 'studio.billing'

const ALL: Permission[] = [
  'bookings.read', 'bookings.write', 'clients.read', 'clients.write', 'staff.manage',
  'resources.manage', 'finance.read', 'finance.write', 'projects.read', 'projects.write',
  'deliverables.upload', 'content.write', 'reports.read', 'studio.settings', 'studio.billing',
]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  PLATFORM_ADMIN: ALL,
  OWNER: ALL,
  MANAGER: ALL.filter((p) => p !== 'studio.billing'),
  ENGINEER: ['bookings.read', 'clients.read', 'projects.read', 'projects.write', 'deliverables.upload'],
  FRONT_DESK: [
    'bookings.read', 'bookings.write', 'clients.read', 'clients.write',
    'finance.read', 'finance.write', 'projects.read',
  ],
  CLIENT: [],
}

export const STAFF_ROLES: Role[] = ['OWNER', 'MANAGER', 'ENGINEER', 'FRONT_DESK']

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && ROLE_PERMISSIONS[role].includes(permission)
}

export function isStaff(role: Role | undefined): boolean {
  return !!role && (role === 'PLATFORM_ADMIN' || STAFF_ROLES.includes(role))
}

/** Roles the given role may assign to team members. */
export function assignableRoles(role: Role | undefined): Role[] {
  if (role === 'OWNER' || role === 'PLATFORM_ADMIN') return ['OWNER', 'MANAGER', 'ENGINEER', 'FRONT_DESK']
  if (role === 'MANAGER') return ['MANAGER', 'ENGINEER', 'FRONT_DESK']
  return []
}
