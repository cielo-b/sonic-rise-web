'use client'

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  api,
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
  type AuthResponse,
  type Me,
  type TwoFactorChallenge,
} from '@/lib/api'
import { can as canRole, isStaff, type Permission } from '@/lib/roles'

interface AuthValue {
  user: Me | null
  isLoading: boolean
  isStaff: boolean
  can: (p: Permission) => boolean
  login: (email: string, password: string, remember: boolean, platform?: boolean) => Promise<AuthResponse | TwoFactorChallenge>
  completeTwoFactor: (tempToken: string, code: string, remember: boolean) => Promise<AuthResponse>
  /** Store a token from register/accept flows. */
  signIn: (res: AuthResponse, remember: boolean) => Promise<void>
  logout: () => void
  refresh: () => void
}

const AuthContext = createContext<AuthValue | null>(null)
export const ME_QUERY_KEY = ['me'] as const

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const me = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => (getToken() ? api.me.get() : Promise.resolve(null)),
    retry: false,
    staleTime: 60_000,
  })

  const logout = useCallback(() => {
    const token = getToken()
    // Revoke on the server while we still hold the token, then forget it.
    if (token) void api.auth.revokeAll().catch(() => undefined)
    clearToken()
    // Update the live "me" query (clear() would orphan its observer and keep
    // showing the old user), then drop everything else except the public studio.
    qc.setQueryData(ME_QUERY_KEY, null)
    qc.removeQueries({ predicate: (q) => !['me', 'studio'].includes(String(q.queryKey[0])) })
  }, [qc])

  useEffect(() => {
    // Expired or revoked session: drop it and show the signed-out state.
    setUnauthorizedHandler(() => {
      clearToken()
      qc.setQueryData(ME_QUERY_KEY, null)
    })
    return () => setUnauthorizedHandler(null)
  }, [qc])

  const signIn = useCallback(
    async (res: AuthResponse, remember: boolean) => {
      setToken(res.access_token, remember)
      await qc.invalidateQueries()
      await qc.fetchQuery({ queryKey: ME_QUERY_KEY, queryFn: () => api.me.get() })
    },
    [qc],
  )

  const login = useCallback(
    async (email: string, password: string, remember: boolean, platform = false) => {
      const res = platform ? await api.auth.platformLogin(email, password) : await api.auth.login(email, password)
      if ('requires2FA' in res) return res
      await signIn(res, remember)
      return res
    },
    [signIn],
  )

  const completeTwoFactor = useCallback(
    async (tempToken: string, code: string, remember: boolean) => {
      const res = await api.auth.login2fa(tempToken, code)
      await signIn(res, remember)
      return res
    },
    [signIn],
  )

  const user = me.data ?? null
  const value = useMemo<AuthValue>(
    () => ({
      user,
      isLoading: me.isLoading,
      isStaff: isStaff(user?.role),
      can: (p) => canRole(user?.role, p),
      login,
      completeTwoFactor,
      signIn,
      logout,
      refresh: () => void me.refetch(),
    }),
    [user, me, login, completeTwoFactor, signIn, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Where a signed-in user belongs after logging in. */
export function homeFor(user: Pick<Me, 'role'>): string {
  if (user.role === 'PLATFORM_ADMIN') return '/platform'
  return isStaff(user.role) ? '/admin' : '/portal'
}
