'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { Button, Checkbox, Input, Loading, errorMessage } from '@/components/ui'

function Subscribe() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.contact.subscribe(email)
      toast.success(t('blog.subscribed'))
      setEmail('')
      setConsent(false)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="glass-card rounded-2xl p-6 mt-16 max-w-xl space-y-3">
      <p className="font-headline font-semibold">{t('blog.subscribeTitle')}</p>
      <div className="flex gap-2">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Button type="submit" loading={busy} disabled={!consent}>{t('blog.subscribe')}</Button>
      </div>
      <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} label={t('blog.consent')} />
    </form>
  )
}

export default function BlogPage() {
  const studio = useRequiredStudio()
  const { t, locale } = useI18n()
  const q = useQuery({ queryKey: ['posts', 'public'], queryFn: api.posts.list })
  const posts = q.data ?? []
  const [featured, ...rest] = [...posts.filter((p) => p.featured), ...posts.filter((p) => !p.featured)]

  return (
    <div className="container-studio py-16">
      <h1 className="font-headline text-4xl font-bold">{t('blog.title')}</h1>
      {q.isLoading ? (
        <Loading />
      ) : posts.length === 0 ? (
        <p className="text-text-muted mt-8">{t('blog.empty')}</p>
      ) : (
        <>
          <Link href={`/blog/${featured.slug}`} className="mt-8 grid md:grid-cols-2 gap-6 glass-card rounded-2xl overflow-hidden group">
            {featured.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded cover
              <img src={featured.coverUrl} alt="" className="w-full h-full min-h-64 object-cover group-hover:scale-[1.02] transition-transform" />
            ) : (
              <div className="min-h-64 bg-gradient-to-br from-brand-purple/30 to-brand-cyan/10" />
            )}
            <div className="p-8 flex flex-col justify-center">
              <p className="text-xs font-mono uppercase tracking-wider text-brand-cyan">{featured.category}</p>
              <h2 className="font-headline text-2xl font-bold mt-2">{featured.title}</h2>
              <p className="text-text-muted mt-3">{featured.excerpt}</p>
              <p className="text-xs text-outline mt-4">
                {featured.authorName} · {formatDate(featured.createdAt, studio.timezone, locale)} · {featured.readTime}
              </p>
            </div>
          </Link>
          {rest.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="glass-card rounded-xl overflow-hidden group">
                  {p.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded cover
                    <img src={p.coverUrl} alt="" className="w-full aspect-video object-cover" />
                  )}
                  <div className="p-5">
                    <p className="text-xs font-mono uppercase tracking-wider text-brand-cyan">{p.category}</p>
                    <h3 className="font-headline font-semibold mt-1.5 group-hover:text-brand-cyan transition-colors">{p.title}</h3>
                    <p className="text-sm text-text-muted mt-2 line-clamp-2">{p.excerpt}</p>
                    <p className="text-xs text-outline mt-3">{formatDate(p.createdAt, studio.timezone, locale)} · {p.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      <Subscribe />
    </div>
  )
}
