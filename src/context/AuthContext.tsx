'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, type AuthResponse, setToken, clearToken } from '@/lib/api'
import { QK } from '@/lib/queries'
import { toRole, type ApiRole } from '@/lib/roles'

interface AuthUser {
  id: string
  name: string
  email: string
  role: 'SUPERADMIN' | 'CLIENT'
  avatarUrl: string | null
}

export interface TwoFactorChallenge {
  requires2FA: true
  tempToken: string
}

interface AuthContextValue {
  user: AuthUser | null
  setUser: (u: AuthUser | null) => void
  /** Resolves to a 2FA challenge when the account has two-factor enabled. */
  login: (email: string, password: string, remember: boolean) => Promise<AuthResponse | TwoFactorChallenge>
  completeTwoFactor: (tempToken: string, code: string, remember: boolean) => Promise<AuthResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applySession(data: AuthResponse, remember: boolean) {
  setToken(data.access_token, remember)
  const role = toRole(data.user.role as ApiRole)
  // Always populate sessionStorage so the current tab works:
  sessionStorage.setItem('sr_admin_auth', 'true')
  sessionStorage.setItem('sr_admin_role', role)
  sessionStorage.setItem('sr_admin_name', data.user.name)
  // Persist to localStorage only when the user chose "remember me":
  if (remember) {
    localStorage.setItem('sr_admin_auth', 'true')
    localStorage.setItem('sr_admin_role', role)
    localStorage.setItem('sr_admin_name', data.user.name)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const qc = useQueryClient()

  const startSession = useCallback((data: AuthResponse, remember: boolean) => {
    applySession(data, remember)
    setUser({ ...data.user })
    // Seed the TanStack cache so useMe() resolves immediately
    qc.setQueryData(QK.me, data.user)
  }, [qc])

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const data = await api.auth.login(email, password)
    if ('requires2FA' in data) return data
    startSession(data, remember)
    return data
  }, [startSession])

  const completeTwoFactor = useCallback(async (tempToken: string, code: string, remember: boolean) => {
    const data = await api.auth.login2fa(tempToken, code)
    startSession(data, remember)
    return data
  }, [startSession])

  const logout = useCallback(() => {
    clearToken()
    ;['sr_admin_auth', 'sr_admin_role', 'sr_admin_name'].forEach((k) => {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    })
    setUser(null)
    qc.clear()
  }, [qc])

  return (
    <AuthContext.Provider value={{ user, setUser, login, completeTwoFactor, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
