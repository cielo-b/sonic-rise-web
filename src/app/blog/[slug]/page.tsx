'use client'

import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { api } from '@/lib/api'

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['posts', 'slug', slug],
    queryFn:  () => api.posts.get(slug),
    retry:    false,
  })

  // Content is plain text: blank lines separate paragraphs. Rendered as text, never as HTML.
  const paragraphs = (post?.content ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20">
        <article className="container-studio max-w-3xl mx-auto">
          <Link href="/blog" className="flex w-fit items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-10 transition-colors">
            <ArrowLeft size={14} /> Back to the Journal
          </Link>

          {isLoading && <div className="h-10 w-2/3 rounded bg-white/5 animate-pulse" />}

          {isError && (
            <div className="text-center py-20 space-y-4">
              <h1 className="font-headline text-3xl font-bold text-text-primary">Post not found</h1>
              <p className="text-text-muted">It may have been unpublished or moved.</p>
            </div>
          )}

          {post && (
            <>
              <span className="chip bg-white/5 text-text-muted border border-white/10 text-[10px] mb-5 inline-block">
                {post.category}
              </span>
              <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-text-primary leading-tight tracking-tight mb-6">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-text-muted text-xs font-mono mb-10">
                <span className="text-text-primary text-sm font-sans font-medium">{post.authorName}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1.5"><Clock size={12} />{post.readTime}</span>
              </div>

              {post.coverUrl && (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 mb-10">
                  <Image src={post.coverUrl} alt={post.title} fill className="object-cover" unoptimized />
                </div>
              )}

              {post.excerpt && <p className="text-lg text-text-primary/90 leading-relaxed mb-8">{post.excerpt}</p>}
              <div className="space-y-5 text-text-muted leading-relaxed">
                {paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            </>
          )}
        </article>
      </main>
      <Footer />
    </>
  )
}
