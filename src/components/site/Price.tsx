'use client'

import type { ServicePackage } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { money, usd } from '@/lib/format'

/** Amount in the studio currency, with an approximate USD figure when the studio set a rate. */
export function Price({ amount, className = '' }: { amount: number; className?: string }) {
  const studio = useRequiredStudio()
  const { locale } = useI18n()
  const approx = usd(amount, studio.usdRate)
  return (
    <span className={className}>
      {money(amount, studio.currency, locale)}
      {approx && <span className="text-outline text-xs font-normal ml-1.5">{approx}</span>}
    </span>
  )
}

export function PackagePrice({ pkg }: { pkg: ServicePackage }) {
  const { t } = useI18n()
  return (
    <span>
      <Price amount={pkg.price} className="font-mono font-bold text-text-primary" />
      {pkg.pricingType === 'HOURLY' && <span className="text-xs text-text-muted ml-1">{t('common.perHour')}</span>}
    </span>
  )
}
