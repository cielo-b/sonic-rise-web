'use client'

import { QueryProvider } from './QueryProvider'
import { StudioProvider, useStudio } from '@/context/StudioContext'
import { AuthProvider } from '@/context/AuthContext'
import { I18nProvider } from '@/lib/i18n'

function WithLocale({ children }: { children: React.ReactNode }) {
  const { studio } = useStudio()
  return <I18nProvider defaultLocale={studio?.defaultLocale ?? 'en'}>{children}</I18nProvider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <StudioProvider>
        <WithLocale>
          <AuthProvider>{children}</AuthProvider>
        </WithLocale>
      </StudioProvider>
    </QueryProvider>
  )
}
