'use client'

import { createContext, useContext, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, ApiError, studioSlug, type StudioProfile } from '@/lib/api'

interface StudioValue {
  /** Null on the platform domain (no studio). */
  studio: StudioProfile | null
  slug: string | null
  isLoading: boolean
  notFound: boolean
  refetch: () => void
}

const StudioContext = createContext<StudioValue | null>(null)

export const STUDIO_QUERY_KEY = ['studio', 'profile'] as const

/** Loads the current studio and applies its brand colours to the page. */
export function StudioProvider({ children }: { children: React.ReactNode }) {
  const slug = studioSlug()
  const q = useQuery({
    queryKey: STUDIO_QUERY_KEY,
    queryFn: () => api.studio.profile(),
    enabled: !!slug,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
    staleTime: 60_000,
  })
  const studio = q.data ?? null

  useEffect(() => {
    const root = document.documentElement
    if (studio?.primaryColor) root.style.setProperty('--brand', studio.primaryColor)
    if (studio?.accentColor) root.style.setProperty('--accent', studio.accentColor)
    if (studio?.name) document.title = studio.name
  }, [studio])

  return (
    <StudioContext.Provider
      value={{
        studio,
        slug,
        isLoading: !!slug && q.isLoading,
        notFound: !!slug && q.error instanceof ApiError && q.error.status === 404,
        refetch: () => void q.refetch(),
      }}
    >
      {children}
    </StudioContext.Provider>
  )
}

export function useStudio(): StudioValue {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be used inside StudioProvider')
  return ctx
}

/** For pages that only render once the studio is loaded. */
export function useRequiredStudio(): StudioProfile {
  const { studio } = useStudio()
  if (!studio) throw new Error('Studio not loaded')
  return studio
}
