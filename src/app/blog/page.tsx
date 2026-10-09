'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArrowRight, Clock, Calendar } from 'lucide-react'
import { usePosts } from '@/lib/queries'
import { toast } from 'sonner'
import { api, type ApiPost } from '@/lib/api'

const GRAD_POOL = [
  'from-[#7C3AED] to-[#3CD7FF]', 'from-[#D4AF37] to-[#D2BBFF]',
  'from-[#3CD7FF] to-[#6001D1]', 'from-[#D4AF37] to-[#7C3AED]',
]

/** Stock covers used when a post has no cover image. */
const FALLBACK_COVERS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBpiGvdaVh-LIgSOXKSWdMJsrmKVCIti45LXVB6MyQ6pzaJq7J-EaHdfm5KR7EwVlzhoRaLFIpXbmg5bIovXSpJQNqS6_ot36lKRnzjJns3iaB2vBXEUmWKwBBpKLuTkUPa0QkLuLa7wUw-SYV37pXCBayWgIi0ANqQ9ARwsEtA-MJQVYarGmOVVvCyjOsq5ChCIf61SvqshncfDeIEcGYkiJT9Hf-AT8XK_DaXBbqNB3u2ZBNbBjj_THH1p8TEcpYHNLFKhtRU9_c',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC-farVLqfbVJ7p0q9sEz1DbtGkcgjwvR-zrsRB60nil7-wRH4RNbHmtbglOXLei_S4JWG2JBFxc8owfxx2TnHohF9fZzLnAbrFrJTOXniYDo86SKdPSdEJu3u6Lc1lsByMHHLpGv9Z3lWVcS26wj91fl12jnk7G13LA6O_dvRU9FEtGWI0s5iVgV6IX0iwlUdiB88xj0xpSUeH8RkJLU3L8OuS-pOoCURs_YefPGGshTmE8PQJrZodaX9bYNJamHBBVAfXvAVGVlI',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAOk-Z0RhmVKVgNhixvIS7sWaH3xTrGYs6CO72TF63H-2JLCk59qOMN8N2EJ6WnusWRtiocHWAgJki_i4zhCf5R_Q_XSW-QCO3YFXaI8dT2A6ewKRDjD5rlQb-dH-E43vQVrj2-E5r3WT3reHjjIw3ZujKtY7jcMcHM_8pAQbbaOddwdj_TwbexsxaijWZTgvrTYMBf-hmQXlMyrGnD_jRyQiymB-MCBCpowIsRok8b76o9LL1Z5P0zKgRJv-TfnGIennBvW193TsA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC4XFZR8ReuEcG5_MWaW_wSilXQnukZXijyduUin7Uo1RG093FcCp7FHClDKfCho5-FRnwbyECgltfATUoB6XYNuAC4ydOAASVBhOJJnX42s6WLSDXQLds3EpBMfyg3df8CcvQt9dCvgmiG6EGBNNBilbaP8VLEmAu-XSI9nEzfkhJaU_1m3cBI8o2Ii-ZS-K9Si6f0HF6sGxrjwLG3yGvoQ31FHnAoGTVdo_mH4d7VL0Dl7liic1Uy6uSLNXfZVSbLYr1ND8qXVqk',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB9TEYqnn7_2PtfOhx3Y_hmU5RewqJobl7pmbu3unxxfhEYpnFoWxDlSYdA58IJwJ6osFxmvfgJh3bqw7bwwKKVNJUMgTicxfH-JV3qQeNJxg63kE4Fk7Yo3WoYW4W0kpsZKAum1tlLDdzs-mzdJJbXnxPCIgE8_kJ2RcS0t7Fky0YMqWNgRYxUcAGaTPCZeZnHngEf5BTxIDBSWzg-VrZfijUjyRys9PP8AFAcXMbQKPO43e7sAYWn_kyff7Nz_jbNqby7zTcd-EU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCBaVhvnC4kF-lnc0irH-4Fbkyrj0O1wSVMLJAyGwJsQa5NobelwRw4SzLxqXZ1tSJN4NtmZPxZ6FRwFHjDuXlCZnc84gSOAtOsSmGUtMYlCY9i_KN0SqbQurqeyfdc8LB8rum1e0CExqURqnWQyucMAD4jEATsnhNjnfXcbun1aJZsyZ33b-eQtzPdstkMlpQqaqmWknRoJxJkE7OVavnYFV4vYa6qmkm20JJMEhJd1gNcQV343WgbsI3L820Zg7fq8WDVyx-qvYo',
]

function apiPostToDisplay(p: ApiPost, i: number) {
  return {
    id:       p.slug,
    featured: p.featured,
    title:    p.title,
    category: p.category,
    date:     new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    readTime: p.readTime,
    excerpt:  p.excerpt,
    src:      p.coverUrl ?? FALLBACK_COVERS[i % FALLBACK_COVERS.length] ?? '',
    author: {
      name:     p.authorName,
      initials: p.authorInitials,
      grad:     GRAD_POOL[i % GRAD_POOL.length],
    },
  }
}

/** Sign-ups are emailed to the studio inbox via the contact endpoint. */
async function handleNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  const form = e.currentTarget
  const email = (new FormData(form).get('email') as string).trim()
  if (!email) return
  try {
    await api.contact.send({
      name: 'Newsletter subscriber',
      email,
      subject: 'Newsletter signup',
      message: `Please add ${email} to the SonicRise Journal mailing list.`,
    })
    toast.success('Thanks! You\'ll get the next issue of the Journal.')
    form.reset()
  } catch {
    toast.error('Could not sign you up right now. Please try again.')
  }
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const { data: apiPosts } = usePosts()

  const allPosts   = (apiPosts ?? []).map(apiPostToDisplay)
  const categories = ['All', ...Array.from(new Set(allPosts.map((p) => p.category)))]

  const filtered = activeCategory === 'All'
    ? allPosts
    : allPosts.filter((p) => p.category === activeCategory)

  const featured = filtered.find((p) => p.featured) ?? filtered[0]
  const grid     = filtered.filter((p) => p !== featured)

  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="pt-28 pb-16 container-studio">
          <span className="font-mono text-xs tracking-widest text-brand-cyan uppercase mb-4 block">
            The SonicRise Journal
          </span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.04em] text-text-primary max-w-2xl">
              Notes from<br />the Studio
            </h1>
            <p className="text-text-muted text-lg max-w-sm leading-relaxed">
              Production insights, studio stories, and industry perspectives from the SonicRise team.
            </p>
          </div>
        </section>

        {/* ── Category filter ───────────────────────────────────────────── */}
        <div className="sticky top-16 z-40 bg-[#0B0B0F]/85 backdrop-blur-md border-b border-white/5">
          <div className="container-studio py-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-1.5 rounded-full text-sm font-mono whitespace-nowrap transition-all ${
                  cat === activeCategory
                    ? 'glass-card text-[#d2bbff]'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Featured post ─────────────────────────────────────────────── */}
        {!featured && (
          <section className="py-14 container-studio text-center text-text-muted font-mono text-sm">
            No posts found in this category yet.
          </section>
        )}
        {featured && <section className="py-14 container-studio">
          <Link href={`/blog/${featured.id}`} className="group block">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 glass-card">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="relative h-72 md:h-auto min-h-[360px] overflow-hidden">
                  <Image
                    src={featured.src}
                    alt={featured.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0B0B0F] md:block hidden" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] to-transparent md:hidden" />
                </div>

                {/* Content */}
                <div className="p-10 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="chip bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 text-[10px]">
                      FEATURED
                    </span>
                    <span className="chip bg-white/5 text-text-muted border border-white/10 text-[10px]">
                      {featured.category}
                    </span>
                  </div>
                  <h2 className="font-headline text-2xl md:text-3xl font-bold text-text-primary mb-4 group-hover:text-[#d2bbff] transition-colors leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-text-muted leading-relaxed mb-6">{featured.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${featured.author.grad} flex items-center justify-center`}>
                        <span className="font-mono text-[10px] font-bold text-white">{featured.author.initials}</span>
                      </div>
                      <div>
                        <p className="text-text-primary text-sm font-medium">{featured.author.name}</p>
                        <div className="flex items-center gap-2 text-text-muted text-[11px] font-mono">
                          <Calendar size={10} />{featured.date}
                          <span>·</span>
                          <Clock size={10} />{featured.readTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#d2bbff] font-mono text-sm group-hover:gap-3 transition-all">
                      Read <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>}

        {/* ── Post grid ─────────────────────────────────────────────────── */}
        <section className="pb-20 container-studio">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grid.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`} className="group glass-card rounded-xl overflow-hidden hover:border-brand-purple/30 transition-all">
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={post.src}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B1B23] to-transparent" />
                  <span className="absolute top-3 left-3 chip bg-black/60 backdrop-blur-sm text-text-muted border border-white/10 text-[10px]">
                    {post.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-6">
                  <h3 className="font-headline text-lg font-bold text-text-primary mb-2 group-hover:text-[#d2bbff] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed mb-5 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${post.author.grad} flex items-center justify-center`}>
                        <span className="font-mono text-[9px] font-bold text-white">{post.author.initials}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-muted text-[11px] font-mono">
                        {post.date} <span>·</span> {post.readTime}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-text-muted group-hover:text-[#d2bbff] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Newsletter CTA ────────────────────────────────────────────── */}
        <section className="py-16 container-studio">
          <div className="glass-card p-12 md:p-16 rounded-2xl relative overflow-hidden text-center">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-purple/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-cyan/10 rounded-full blur-[80px]" />
            <span className="font-mono text-xs tracking-widest text-brand-cyan uppercase mb-4 block relative z-10">
              Studio Dispatch
            </span>
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-text-primary mb-4 relative z-10">
              Get the Journal in Your Inbox
            </h2>
            <p className="text-text-muted mb-8 max-w-md mx-auto relative z-10">
              Monthly production notes, studio updates, and exclusive session breakdowns.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto relative z-10"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                className="input-studio flex-1 text-sm py-3"
              />
              <button type="submit" className="btn-primary text-sm px-6 py-3 shrink-0">
                Subscribe
              </button>
            </form>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
