'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Locale } from '../api'
import { en, type MessageKey } from './en'
import { fr } from './fr'
import { rw } from './rw'

const DICTS: Record<Locale, Partial<Record<MessageKey, string>>> = { en, fr, rw }
export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'rw', label: 'Kinyarwanda' },
]
const STORAGE_KEY = 'sr_locale'

type Vars = Record<string, string | number>
type T = (key: MessageKey, vars?: Vars) => string

interface I18nValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: T
}

const I18nContext = createContext<I18nValue | null>(null)

function readStored(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'en' || v === 'fr' || v === 'rw' ? v : null
  } catch {
    return null
  }
}

/** `defaultLocale` is the studio's default; a visitor's choice is remembered. */
export function I18nProvider({ defaultLocale = 'en', children }: { defaultLocale?: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setLocaleState(readStored() ?? defaultLocale)
  }, [defaultLocale])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* private mode */
    }
  }, [])

  const t = useCallback<T>(
    (key, vars) => {
      let s = DICTS[locale][key] ?? en[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      return s
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

export type { MessageKey }
