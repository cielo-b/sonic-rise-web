import type { Locale } from './api'

const LOCALE_TAG: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR', rw: 'rw-RW' }

/** Intl falls back gracefully when a locale (e.g. rw) has no data. */
export function localeTag(locale: Locale): string {
  return LOCALE_TAG[locale] ?? 'en-GB'
}

export function money(amount: number, currency: string, locale: Locale = 'en'): string {
  return `${Math.round(amount).toLocaleString(localeTag(locale))} ${currency}`
}

/** Approximate USD from the studio's own exchange rate (RWF per 1 USD). */
export function usd(amount: number, usdRate: number | null): string | null {
  if (!usdRate || usdRate <= 0) return null
  const v = amount / usdRate
  return `≈ $${v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2)}`
}

export function formatDate(iso: string | Date, timeZone: string, locale: Locale = 'en', opts: Intl.DateTimeFormatOptions = {}) {
  return new Date(iso).toLocaleDateString(localeTag(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
    ...opts,
  })
}

export function formatTime(iso: string | Date, timeZone: string, locale: Locale = 'en') {
  return new Date(iso).toLocaleTimeString(localeTag(locale), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone })
}

export function formatDateTime(iso: string | Date, timeZone: string, locale: Locale = 'en') {
  return `${formatDate(iso, timeZone, locale, { weekday: 'short' })}, ${formatTime(iso, timeZone, locale)}`
}

export function relativeTime(iso: string | Date, locale: Locale = 'en'): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(localeTag(locale), { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3_600], ['minute', 60],
  ]
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return rtf.format(Math.round(diff), 'second')
}

export function bytes(n: number | string): string {
  const v = Number(n)
  if (v < 1024 * 1024) return `${Math.max(1, Math.round(v / 1024))} KB`
  if (v < 1024 ** 3) return `${(v / 1024 ** 2).toFixed(1)} MB`
  return `${(v / 1024 ** 3).toFixed(2)} GB`
}

export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return [h ? `${h}h` : '', m ? `${m}min` : ''].filter(Boolean).join(' ') || '0min'
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export function timecode(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
