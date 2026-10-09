'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, MapPin, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { Button, Field, Input, Textarea, errorMessage } from '@/components/ui'

export default function ContactPage() {
  const studio = useRequiredStudio()
  const { t } = useI18n()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.contact.send({ ...form, phone: form.phone || undefined, subject: form.subject || undefined })
      toast.success(t('contact.sent'))
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const hours = studio.openingHours ?? {}
  const hasHours = Object.keys(hours).length > 0

  return (
    <div className="container-studio py-16 grid gap-12 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="space-y-4 max-w-2xl">
        <h1 className="font-headline text-4xl font-bold">{t('contact.title')}</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('common.name')}><Input required value={form.name} onChange={set('name')} /></Field>
          <Field label={t('common.email')}><Input type="email" required value={form.email} onChange={set('email')} /></Field>
          <Field label={t('common.phone')}><Input type="tel" value={form.phone} onChange={set('phone')} /></Field>
          <Field label={t('contact.subject')}><Input value={form.subject} onChange={set('subject')} /></Field>
        </div>
        <Field label={t('contact.message')}><Textarea required minLength={10} rows={6} value={form.message} onChange={set('message')} /></Field>
        <Button type="submit" loading={busy}>{t('contact.send')}</Button>
      </form>
      <aside className="space-y-6">
        <div className="glass-card rounded-xl p-6 space-y-3 text-sm">
          {(studio.address || studio.city) && (
            <p className="flex gap-3"><MapPin size={16} className="text-brand-cyan shrink-0 mt-0.5" />{[studio.address, studio.city].filter(Boolean).join(', ')}</p>
          )}
          {studio.phone && <p className="flex gap-3"><Phone size={16} className="text-brand-cyan shrink-0" /><a href={`tel:${studio.phone}`}>{studio.phone}</a></p>}
          {studio.email && <p className="flex gap-3"><Mail size={16} className="text-brand-cyan shrink-0" /><a href={`mailto:${studio.email}`}>{studio.email}</a></p>}
        </div>
        {hasHours && (
          <div className="glass-card rounded-xl p-6">
            <p className="font-headline font-semibold mb-3">{t('contact.hours')}</p>
            <ul className="space-y-1.5 text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const w = hours[String(d) as keyof typeof hours]
                return (
                  <li key={d} className="flex justify-between gap-4">
                    <span className="text-text-muted">{t(`day.${d}` as 'day.0')}</span>
                    <span>{w ? `${w.open} – ${w.close}` : t('contact.closed')}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
