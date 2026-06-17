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

interface AuthContextValue {
  user: AuthUser | null
  setUser: (u: AuthUser | null) => void
  login: (email: string, password: string, remember: boolean) => Promise<AuthResponse>
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

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const data = await api.auth.login(email, password)
    applySession(data, remember)
    setUser({ ...data.user })
    // Seed the TanStack cache so useMe() resolves immediately
    qc.setQueryData(QK.me, data.user)
    return data
  }, [qc])

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
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
