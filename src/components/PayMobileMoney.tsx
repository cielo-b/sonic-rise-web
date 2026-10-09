'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Smartphone } from 'lucide-react'
import { api, type PaymentPurpose } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/context/AuthContext'
import { money } from '@/lib/format'
import { Button, Field, Input, errorMessage } from './ui'

/**
 * Mobile money via the studio's pawaPay account. The customer approves on
 * their phone; we poll the payment until pawaPay reports the final result.
 */
export function PayMobileMoney({
  purpose,
  targetId,
  amount,
  currency,
  onPaid,
}: {
  purpose: PaymentPurpose
  targetId: string
  amount: number
  currency: string
  onPaid?: () => void
}) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [state, setState] = useState<'idle' | 'starting' | 'waiting' | 'paid' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current)
  }, [])

  async function start(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setState('starting')
    try {
      const payment = await api.payments.mobileMoney({ purpose, targetId, phone })
      setState('waiting')
      const startedAt = Date.now()
      timer.current = setInterval(async () => {
        try {
          const p = await api.payments.status(payment.id)
          if (p.status === 'SUCCESS') {
            clearInterval(timer.current!)
            setState('paid')
            onPaid?.()
          } else if (p.status === 'FAILED') {
            clearInterval(timer.current!)
            setState('failed')
            setError(p.failureReason ?? '')
          } else if (Date.now() - startedAt > 4 * 60_000) {
            clearInterval(timer.current!)
            setState('failed')
            setError('No answer from your phone. Check your mobile money balance and try again.')
          }
        } catch {
          /* keep polling */
        }
      }, 4000)
    } catch (err) {
      setState('failed')
      setError(errorMessage(err))
    }
  }

  if (state === 'paid') {
    return (
      <div className="flex items-center gap-2 text-emerald-300 text-sm">
        <CheckCircle2 size={18} /> {t('pay.success')}
      </div>
    )
  }

  return (
    <form onSubmit={start} className="space-y-3">
      <Field label={t('pay.phone')} hint={t('pay.phoneHint')}>
        <Input
          type="tel"
          inputMode="tel"
          required
          placeholder="+250 7XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={state === 'waiting' || state === 'starting'}
        />
      </Field>
      {state === 'waiting' ? (
        <p className="flex items-center gap-2 text-sm text-brand-cyan">
          <Smartphone size={16} className="animate-pulse" /> {t('pay.waiting')}
        </p>
      ) : (
        <Button type="submit" loading={state === 'starting'} className="w-full">
          {t('pay.start', { amount: money(amount, currency, locale) })}
        </Button>
      )}
      {state === 'failed' && error !== null && <p className="text-sm text-red-300">{t('pay.failed', { reason: error })}</p>}
    </form>
  )
}
