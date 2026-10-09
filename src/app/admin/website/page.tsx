'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, type StudioContent, type StudioSocials } from '@/lib/api'
import { STUDIO_QUERY_KEY } from '@/context/StudioContext'
import { Button, Card, Field, ImageUpload, Input, Loading, PageHeader, Tabs, Textarea, errorMessage } from '@/components/ui'

type Tab = 'home' | 'about' | 'testimonials' | 'faq' | 'rules' | 'legal' | 'social'

/** Edits a list of objects with add/remove. */
function ListEditor<T extends object>({
  items,
  onChange,
  blank,
  render,
  addLabel,
}: {
  items: T[]
  onChange: (v: T[]) => void
  blank: T
  render: (item: T, set: (patch: Partial<T>) => void) => React.ReactNode
  addLabel: string
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <Card key={i} className="p-4 flex gap-3">
          <div className="flex-1 space-y-3">{render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))))}</div>
          <button type="button" aria-label="Remove" className="text-outline hover:text-red-300 self-start" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 size={16} />
          </button>
        </Card>
      ))}
      <Button type="button" variant="glass" onClick={() => onChange([...items, { ...blank }])}><Plus size={14} /> {addLabel}</Button>
    </div>
  )
}

function Website() {
  const qc = useQueryClient()
  const initial = (useSearchParams().get('tab') as Tab) || 'home'
  const [tab, setTab] = useState<Tab>(initial)
  const q = useQuery({ queryKey: ['studio', 'settings'], queryFn: api.studio.settings })
  const [c, setC] = useState<StudioContent>({})
  const [socials, setSocials] = useState<StudioSocials>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load saved content into the editor
    if (q.data) { setC(q.data.content ?? {}); setSocials(q.data.socials ?? {}) }
  }, [q.data])

  if (!q.data) return <Loading />
  const set = (patch: Partial<StudioContent>) => setC((s) => ({ ...s, ...patch }))

  async function save() {
    setBusy(true)
    try {
      // Drop empty strings and empty list rows so nothing blank is published.
      const clean = <T,>(v: T): T | undefined => (typeof v === 'string' ? ((v.trim() || undefined) as T) : v)
      const content: StudioContent = {
        heroTitle: clean(c.heroTitle),
        heroSubtitle: clean(c.heroSubtitle),
        heroImageUrl: clean(c.heroImageUrl),
        aboutTitle: clean(c.aboutTitle),
        aboutBody: clean(c.aboutBody),
        aboutImageUrl: clean(c.aboutImageUrl),
        stats: (c.stats ?? []).filter((s) => s.label.trim() && s.value.trim()),
        testimonials: (c.testimonials ?? []).filter((t) => t.name.trim() && t.quote.trim()).map((t) => ({ ...t, role: t.role?.trim() || undefined })),
        faq: (c.faq ?? []).filter((f) => f.question.trim() && f.answer.trim()),
        rules: (c.rules ?? []).map((r) => r.trim()).filter(Boolean),
        privacyPolicy: clean(c.privacyPolicy),
        termsOfService: clean(c.termsOfService),
      }
      const cleanSocials = Object.fromEntries(Object.entries(socials).filter(([, v]) => v?.trim())) as StudioSocials
      await api.studio.update({ content, socials: cleanSocials })
      await qc.invalidateQueries({ queryKey: STUDIO_QUERY_KEY })
      await q.refetch()
      toast.success('Website updated')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Site content"
        subtitle="Everything visitors read on your website. Empty sections are hidden."
        actions={<><a href="/" target="_blank" className="btn-glass">Preview site</a><Button onClick={save} loading={busy}>Save changes</Button></>}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'home', label: 'Home' },
          { value: 'about', label: 'About' },
          { value: 'testimonials', label: 'Testimonials', count: c.testimonials?.length },
          { value: 'faq', label: 'FAQ', count: c.faq?.length },
          { value: 'rules', label: 'Studio rules', count: c.rules?.length },
          { value: 'legal', label: 'Privacy & terms' },
          { value: 'social', label: 'Social links' },
        ]}
      />
      <div className="max-w-3xl space-y-4">
        {tab === 'home' && (
          <>
            <Field label="Headline" hint="Defaults to the studio name. Wrap words in *asterisks* to make them glow, e.g. Where *Sound* Meets Vision"><Input value={c.heroTitle ?? ''} onChange={(e) => set({ heroTitle: e.target.value })} maxLength={120} /></Field>
            <Field label="Sub-headline" hint="Defaults to the tagline"><Textarea rows={2} value={c.heroSubtitle ?? ''} onChange={(e) => set({ heroSubtitle: e.target.value })} maxLength={300} /></Field>
            <Field label="Background image"><ImageUpload value={c.heroImageUrl} onChange={(url) => set({ heroImageUrl: url ?? undefined })} /></Field>
            <p className="text-sm font-medium pt-4">Numbers to show off</p>
            <p className="text-xs text-text-muted -mt-2">Only real figures — e.g. “Albums recorded: 120”.</p>
            <ListEditor
              items={c.stats ?? []}
              onChange={(stats) => set({ stats })}
              blank={{ label: '', value: '' }}
              addLabel="Add a number"
              render={(s, upd) => (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Value"><Input value={s.value} onChange={(e) => upd({ value: e.target.value })} placeholder="120+" /></Field>
                  <Field label="Label"><Input value={s.label} onChange={(e) => upd({ label: e.target.value })} placeholder="Albums recorded" /></Field>
                </div>
              )}
            />
          </>
        )}
        {tab === 'about' && (
          <>
            <Field label="Title"><Input value={c.aboutTitle ?? ''} onChange={(e) => set({ aboutTitle: e.target.value })} /></Field>
            <Field label="Your story" hint="Blank lines start a new paragraph. The About page appears once this is filled in.">
              <Textarea rows={10} value={c.aboutBody ?? ''} onChange={(e) => set({ aboutBody: e.target.value })} />
            </Field>
            <Field label="Photo"><ImageUpload value={c.aboutImageUrl} onChange={(url) => set({ aboutImageUrl: url ?? undefined })} /></Field>
          </>
        )}
        {tab === 'testimonials' && (
          <ListEditor
            items={c.testimonials ?? []}
            onChange={(testimonials) => set({ testimonials })}
            blank={{ name: '', role: '', quote: '' }}
            addLabel="Add a testimonial"
            render={(t, upd) => (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Client name"><Input value={t.name} onChange={(e) => upd({ name: e.target.value })} /></Field>
                  <Field label="Role / company"><Input value={t.role ?? ''} onChange={(e) => upd({ role: e.target.value })} /></Field>
                </div>
                <Field label="What they said" hint="Only publish quotes your clients agreed to share."><Textarea rows={3} value={t.quote} onChange={(e) => upd({ quote: e.target.value })} /></Field>
              </>
            )}
          />
        )}
        {tab === 'faq' && (
          <ListEditor
            items={c.faq ?? []}
            onChange={(faq) => set({ faq })}
            blank={{ question: '', answer: '' }}
            addLabel="Add a question"
            render={(f, upd) => (
              <>
                <Field label="Question"><Input value={f.question} onChange={(e) => upd({ question: e.target.value })} /></Field>
                <Field label="Answer"><Textarea rows={3} value={f.answer} onChange={(e) => upd({ answer: e.target.value })} /></Field>
              </>
            )}
          />
        )}
        {tab === 'rules' && (
          <>
            <p className="text-sm text-text-muted">Shown on the booking page and in booking emails.</p>
            {(c.rules ?? []).map((r, i) => (
              <div key={i} className="flex gap-2">
                <Input value={r} onChange={(e) => set({ rules: (c.rules ?? []).map((x, j) => (j === i ? e.target.value : x)) })} placeholder="e.g. Please arrive 15 minutes early" />
                <button type="button" aria-label="Remove" className="text-outline hover:text-red-300" onClick={() => set({ rules: (c.rules ?? []).filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
              </div>
            ))}
            <Button type="button" variant="glass" onClick={() => set({ rules: [...(c.rules ?? []), ''] })}><Plus size={14} /> Add a rule</Button>
          </>
        )}
        {tab === 'legal' && (
          <>
            <p className="text-sm text-text-muted">
              Rwanda’s data protection law (Law Nº 058/2021) requires you to tell clients what personal data you collect, why, how long you keep it and how they can access or delete it. Clients must accept this policy when they create an account. Have it reviewed by a lawyer.
            </p>
            <Field label="Privacy policy"><Textarea rows={14} value={c.privacyPolicy ?? ''} onChange={(e) => set({ privacyPolicy: e.target.value })} /></Field>
            <Field label="Terms of service"><Textarea rows={10} value={c.termsOfService ?? ''} onChange={(e) => set({ termsOfService: e.target.value })} /></Field>
          </>
        )}
        {tab === 'social' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {(['instagram', 'youtube', 'tiktok', 'x', 'facebook'] as (keyof StudioSocials)[]).map((k) => (
              <Field key={k} label={k === 'x' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1)}>
                <Input type="url" placeholder="https://" value={socials[k] ?? ''} onChange={(e) => setSocials({ ...socials, [k]: e.target.value })} />
              </Field>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function WebsitePage() {
  return <Suspense><Website /></Suspense>
}
