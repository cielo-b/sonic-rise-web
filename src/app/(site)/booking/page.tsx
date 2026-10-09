'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock } from 'lucide-react'
import { api, ApiError, type Availability, type ServicePackage } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/lib/i18n'
import { duration, formatDate, money } from '@/lib/format'
import { addDays, hhmm, minutesOf, studioDateTime, studioToday, weekday } from '@/lib/time'
import { Button, Field, Loading, Select, Tabs, Textarea, errorMessage } from '@/components/ui'
import { PackagePrice, Price } from '@/components/site/Price'
import { LoginForm, RegisterForm } from '@/components/auth/AuthForms'

type Step = 'service' | 'extras' | 'time' | 'review'
const STEPS: Step[] = ['service', 'extras', 'time', 'review']
const SLOT_STEP = 30 // minutes between offered start times
const DAYS_AHEAD = 60

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart
}

/** Start times (minutes since midnight) that are free for the chosen resources. */
function freeSlots(
  av: Availability,
  date: string,
  timezone: string,
  lengthMin: number,
  roomIds: string[],
  engineerId: string | null,
  equipmentIds: string[],
): number[] {
  if (av.openingHours === null) return [] // closed that day
  const open = av.openingHours ? minutesOf(av.openingHours.open) : 6 * 60
  const close = av.openingHours ? (av.openingHours.close === '00:00' ? 24 * 60 : minutesOf(av.openingHours.close)) : 23 * 60
  const buffer = av.bufferMinutes * 60_000
  const earliest = Date.now() + 15 * 60_000
  const busy = av.busy.map((b) => ({ ...b, s: new Date(b.startsAt).getTime(), e: new Date(b.endsAt).getTime() }))
  const out: number[] = []
  for (let m = open; m + lengthMin <= close; m += SLOT_STEP) {
    const s = new Date(studioDateTime(date, hhmm(m), timezone)).getTime()
    const e = s + lengthMin * 60_000
    if (s < earliest) continue
    const roomFree = roomIds.some((r) => !busy.some((b) => b.roomId === r && overlaps(s - buffer, e + buffer, b.s, b.e)))
    const engFree = !engineerId || !busy.some((b) => b.engineerId === engineerId && overlaps(s, e, b.s, b.e))
    const gearFree = equipmentIds.every((g) => !busy.some((b) => b.equipmentIds.includes(g) && overlaps(s, e, b.s, b.e)))
    if (roomFree && engFree && gearFree) out.push(m)
  }
  return out
}

function BookingFlow() {
  const studio = useRequiredStudio()
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const router = useRouter()
  const params = useSearchParams()

  const packages = useQuery({ queryKey: ['packages', 'public'], queryFn: api.packages.list })
  const rooms = useQuery({ queryKey: ['rooms', 'public'], queryFn: api.rooms.list })
  const engineers = useQuery({ queryKey: ['engineers'], queryFn: api.engineers.list })
  const gear = useQuery({ queryKey: ['equipment', 'public'], queryFn: api.equipment.list })

  const [step, setStep] = useState<Step>('service')
  const [pkg, setPkg] = useState<ServicePackage | null>(null)
  const [roomId, setRoomId] = useState('')
  const [engineerId, setEngineerId] = useState('')
  const [equipmentIds, setEquipmentIds] = useState<string[]>([])
  const [date, setDate] = useState(() => studioToday(studio.timezone))
  const [lengthMin, setLengthMin] = useState(60)
  const [start, setStart] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preselect from ?package=
  useEffect(() => {
    const wanted = params.get('package')
    const found = packages.data?.find((p) => p.id === wanted)
    if (found && !pkg) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- applies the URL selection once packages load
      setPkg(found)
      setLengthMin(found.durationMinutes)
      setStep('extras')
    }
  }, [packages.data, params, pkg])

  const allowedRooms = useMemo(
    () => (rooms.data ?? []).filter((r) => !pkg || !pkg.roomIds.length || pkg.roomIds.includes(r.id)),
    [rooms.data, pkg],
  )
  const availability = useQuery({
    queryKey: ['availability', date],
    queryFn: () => api.bookings.availability(date),
    enabled: step === 'time' || step === 'review',
  })
  const length = pkg?.pricingType === 'HOURLY' ? lengthMin : pkg?.durationMinutes ?? 60
  const slots = useMemo(
    () =>
      availability.data && pkg
        ? freeSlots(availability.data, date, studio.timezone, length, roomId ? [roomId] : allowedRooms.map((r) => r.id), engineerId || null, equipmentIds)
        : [],
    [availability.data, pkg, date, studio.timezone, length, roomId, allowedRooms, engineerId, equipmentIds],
  )

  const gearTotal = (gear.data ?? []).filter((g) => equipmentIds.includes(g.id)).reduce((s, g) => s + g.pricePerBooking, 0)
  const total = pkg ? Math.round((pkg.pricingType === 'HOURLY' ? (pkg.price * length) / 60 : pkg.price) + gearTotal) : 0
  const depositPct = pkg?.depositPercent ?? studio.depositPercent
  const deposit = Math.round((total * depositPct) / 100)

  async function submit() {
    if (!pkg || start === null) return
    setBusy(true)
    setError(null)
    try {
      const startsAt = studioDateTime(date, hhmm(start), studio.timezone)
      const booking = await api.bookings.create({
        packageId: pkg.id,
        roomId: roomId || undefined,
        engineerId: engineerId || undefined,
        equipmentIds: equipmentIds.length ? equipmentIds : undefined,
        startsAt,
        endsAt: pkg.pricingType === 'HOURLY' ? new Date(new Date(startsAt).getTime() + length * 60_000).toISOString() : undefined,
        notes: notes.trim() || undefined,
      })
      router.push(`/portal/bookings/${booking.id}?new=1`)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('booking.slotTaken') : errorMessage(err))
      if (err instanceof ApiError && err.status === 409) {
        setStart(null)
        void availability.refetch()
        setStep('time')
      }
    } finally {
      setBusy(false)
    }
  }

  if (packages.isLoading || rooms.isLoading) return <Loading />
  if (!packages.data?.length || !rooms.data?.length) {
    return <p className="text-text-muted mt-8">{t('booking.unavailable')}</p>
  }

  const stepIndex = STEPS.indexOf(step)
  const labels: Record<Step, string> = {
    service: t('booking.step.service'),
    extras: t('booking.step.extras'),
    time: t('booking.step.time'),
    review: t('booking.step.review'),
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] mt-8">
      <div>
        <ol className="flex gap-2 mb-6 overflow-x-auto">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                disabled={i > stepIndex || (i > 0 && !pkg)}
                onClick={() => setStep(s)}
                className={`chip ${i === stepIndex ? 'chip-purple' : i < stepIndex ? 'chip-success' : 'bg-white/5 text-outline'}`}
              >
                {i < stepIndex && <Check size={11} />} {i + 1}. {labels[s]}
              </button>
            </li>
          ))}
        </ol>

        {step === 'service' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {packages.data.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPkg(p)
                  setLengthMin(p.durationMinutes)
                  setRoomId('')
                  setStart(null)
                  setStep('extras')
                }}
                className={`text-left glass-card rounded-xl p-5 hover:border-brand-purple/50 transition-colors ${pkg?.id === p.id ? 'border-brand-purple' : ''}`}
              >
                <span className="text-xs font-mono uppercase tracking-wider text-brand-cyan">{p.category}</span>
                <p className="font-headline font-semibold mt-1">{p.name}</p>
                {p.description && <p className="text-sm text-text-muted mt-1 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between mt-3 text-sm">
                  <PackagePrice pkg={p} />
                  <span className="flex items-center gap-1 text-outline text-xs"><Clock size={12} />{duration(p.durationMinutes)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'extras' && pkg && (
          <div className="space-y-5 max-w-xl">
            <Field label={t('booking.room')}>
              <Select value={roomId} onChange={(e) => { setRoomId(e.target.value); setStart(null) }}>
                <option value="">{t('booking.anyRoom')}</option>
                {allowedRooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.capacity ? ` · ${r.capacity}` : ''}</option>)}
              </Select>
            </Field>
            {(engineers.data?.length ?? 0) > 0 && (
              <Field label={t('booking.engineer')}>
                <Select value={engineerId} onChange={(e) => { setEngineerId(e.target.value); setStart(null) }}>
                  <option value="">{t('booking.anyEngineer')}</option>
                  {engineers.data!.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </Field>
            )}
            {(gear.data?.length ?? 0) > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-text-muted mb-1">{t('booking.gear')}</legend>
                {gear.data!.map((g) => (
                  <label key={g.id} className="flex items-center justify-between gap-3 glass-card rounded-lg px-4 py-3 cursor-pointer">
                    <span className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="accent-[var(--brand)]"
                        checked={equipmentIds.includes(g.id)}
                        onChange={(e) => {
                          setStart(null)
                          setEquipmentIds((ids) => (e.target.checked ? [...ids, g.id] : ids.filter((id) => id !== g.id)))
                        }}
                      />
                      {g.name}
                      {g.category && <span className="text-xs text-outline">{g.category}</span>}
                    </span>
                    {g.pricePerBooking > 0 && <Price amount={g.pricePerBooking} className="text-sm font-mono" />}
                  </label>
                ))}
              </fieldset>
            )}
            <Button onClick={() => setStep('time')}>{t('common.next')}</Button>
          </div>
        )}

        {step === 'time' && pkg && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
              <Field label={t('booking.chooseDate')}>
                <input
                  type="date"
                  className="input-studio text-sm"
                  value={date}
                  min={studioToday(studio.timezone)}
                  max={addDays(studioToday(studio.timezone), DAYS_AHEAD)}
                  onChange={(e) => { setDate(e.target.value); setStart(null) }}
                />
              </Field>
              {pkg.pricingType === 'HOURLY' && (
                <Field label={t('booking.length')}>
                  <Select value={lengthMin} onChange={(e) => { setLengthMin(Number(e.target.value)); setStart(null) }}>
                    {Array.from({ length: 12 }, (_, i) => pkg.durationMinutes + i * 60).map((m) => (
                      <option key={m} value={m}>{duration(m)}</option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
            <p className="text-sm text-text-muted">
              {t(`day.${weekday(date)}` as 'day.0')} {formatDate(`${date}T12:00:00Z`, 'UTC', locale)} — {t('booking.chooseTime')}
            </p>
            {availability.isLoading ? (
              <Loading />
            ) : availability.data?.openingHours === null ? (
              <p className="text-text-muted">{t('booking.closed')}</p>
            ) : slots.length === 0 ? (
              <p className="text-text-muted">{t('booking.noSlots')}</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {slots.map((m) => (
                  <button
                    key={m}
                    onClick={() => setStart(m)}
                    className={`rounded-lg py-2.5 text-sm font-mono border transition-colors ${
                      start === m ? 'bg-brand-purple border-brand-purple text-white' : 'border-white/10 hover:border-brand-purple/60'
                    }`}
                  >
                    {hhmm(m)}
                  </button>
                ))}
              </div>
            )}
            <Button disabled={start === null} onClick={() => setStep('review')}>{t('common.next')}</Button>
          </div>
        )}

        {step === 'review' && pkg && start !== null && (
          <div className="space-y-5 max-w-xl">
            <Field label={t('booking.notes')}>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('booking.notesPlaceholder')} maxLength={4000} />
            </Field>
            {user ? (
              <>
                {error && <p className="text-sm text-red-300">{error}</p>}
                <Button onClick={submit} loading={busy} className="w-full sm:w-auto">{t('booking.submit')}</Button>
              </>
            ) : (
              <div className="glass-card rounded-xl p-5">
                <p className="text-sm text-text-muted mb-4">{t('booking.signInToBook')}</p>
                <Tabs
                  value={authTab}
                  onChange={setAuthTab}
                  tabs={[{ value: 'register', label: t('nav.register') }, { value: 'login', label: t('nav.login') }]}
                />
                {authTab === 'login' ? <LoginForm onDone={() => undefined} /> : <RegisterForm onDone={() => undefined} />}
              </div>
            )}
          </div>
        )}
      </div>

      {pkg && (
        <aside className="glass-card rounded-xl p-6 h-fit lg:sticky lg:top-24 space-y-3 text-sm">
          <p className="font-headline font-semibold text-base">{pkg.name}</p>
          {start !== null && (
            <p className="text-text-muted">
              {formatDate(`${date}T12:00:00Z`, 'UTC', locale, { weekday: 'short' })} · {hhmm(start)}–{hhmm(start + length)}
            </p>
          )}
          {roomId && <p className="text-text-muted">{t('booking.room')}: {allowedRooms.find((r) => r.id === roomId)?.name}</p>}
          {engineerId && <p className="text-text-muted">{t('booking.engineer')}: {engineers.data?.find((e) => e.id === engineerId)?.name}</p>}
          <div className="border-t border-white/10 pt-3 flex justify-between">
            <span className="text-text-muted">{t('booking.estimate')}</span>
            <Price amount={total} className="font-mono font-bold" />
          </div>
          {deposit > 0 ? (
            <div className="flex justify-between">
              <span className="text-text-muted">{t('booking.depositDue')} ({depositPct}%)</span>
              <span className="font-mono">{money(deposit, studio.currency, locale)}</span>
            </div>
          ) : (
            <p className="text-xs text-outline">{t('booking.noDeposit')}</p>
          )}
          {studio.cancellationHours > 0 && <p className="text-xs text-outline">{t('booking.cancellation', { hours: studio.cancellationHours })}</p>}
          {studio.cancellationPolicy && <p className="text-xs text-outline whitespace-pre-line">{studio.cancellationPolicy}</p>}
          {(studio.content?.rules?.length ?? 0) > 0 && (
            <ul className="text-xs text-outline space-y-1 pt-2 border-t border-white/10">
              {studio.content.rules!.map((r) => <li key={r}>• {r}</li>)}
            </ul>
          )}
        </aside>
      )}
    </div>
  )
}

export default function BookingPage() {
  const { t } = useI18n()
  return (
    <div className="container-studio py-12">
      <h1 className="font-headline text-4xl font-bold">{t('booking.title')}</h1>
      <Suspense fallback={<Loading />}>
        <BookingFlow />
      </Suspense>
    </div>
  )
}
