'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { EmptyState, Loading } from '@/components/ui'

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const studio = useRequiredStudio()
  const { t, locale } = useI18n()
  const q = useQuery({ queryKey: ['posts', slug], queryFn: () => api.posts.get(slug), retry: false })
  const post = q.data
  return (
    <article className="container-studio max-w-3xl py-16">
      <Link href="/blog" className="flex w-fit items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-10">
        <ArrowLeft size={14} /> {t('blog.back')}
      </Link>
      {q.isLoading && <Loading />}
      {q.isError && <EmptyState title="Post not found" />}
      {post && (
        <>
          <p className="text-xs font-mono uppercase tracking-wider text-brand-cyan">{post.category}</p>
          <h1 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight mt-3">{post.title}</h1>
          <p className="text-sm text-text-muted mt-5">
            {post.authorName} · {formatDate(post.createdAt, studio.timezone, locale)} · {post.readTime}
          </p>
          {post.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded cover
            <img src={post.coverUrl} alt="" className="w-full rounded-2xl mt-10" />
          )}
          <p className="text-lg mt-10">{post.excerpt}</p>
          <div className="mt-6 space-y-5 text-text-muted leading-relaxed">
            {post.content.split(/\n\s*\n/).filter(Boolean).map((para, i) => (
              <p key={i} className="whitespace-pre-line">{para}</p>
            ))}
          </div>
        </>
      )}
    </article>
  )
}
