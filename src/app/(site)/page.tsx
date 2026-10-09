'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, ChevronDown, Clock, Film, Headphones, Mic2, Podcast, Radio, Users } from 'lucide-react'
import { api, type ServicePackage } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { duration } from '@/lib/format'
import { EASE } from '@/lib/motion'
import { PackagePrice } from '@/components/site/Price'
import { PortfolioTile } from '@/components/site/PortfolioTile'
import { Equalizer, Marquee, Orbs } from '@/components/site/SoundFx'

const rise = {
  hidden: { opacity: 0, y: 40 },
  show: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: d, ease: EASE } }),
}

/** Words wrapped in *asterisks* glow; otherwise the last word does. */
function LoudTitle({ text }: { text: string }) {
  const marked = /\*[^*]+\*/.test(text)
  const parts = marked ? text.split(/(\*[^*]+\*)/) : [text.split(' ').slice(0, -1).join(' ') + ' ', `*${text.split(' ').slice(-1)[0]}*`]
  return (
    <>
      {parts.filter(Boolean).map((p, i) =>
        p.startsWith('*') && p.endsWith('*') ? (
          <span key={i} className="text-shine">{p.slice(1, -1)}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

/** Picks an icon from the service category. */
function ServiceIcon({ category }: { category: string }) {
  const c = category.toLowerCase()
  if (/video|film|shoot|clip/.test(c)) return <Film size={22} />
  if (/podcast/.test(c)) return <Podcast size={22} />
  if (/live|stream|radio/.test(c)) return <Radio size={22} />
  if (/mix|master|produc/.test(c)) return <Headphones size={22} />
  return <Mic2 size={22} />
}

function Hero() {
  const studio = useRequiredStudio()
  const { t } = useI18n()
  const c = studio.content ?? {}
  return (
    <section className="relative min-h-[100svh] -mt-16 flex items-center overflow-hidden">
      {c.heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded hero
        <img src={c.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45 scale-105" />
      )}
      <Orbs />
      <div className="absolute inset-0 bg-gradient-to-b from-bg-main/30 via-bg-main/40 to-bg-main" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(11,11,15,0.85))]" />

      <div className="container-studio relative z-10 pt-28 pb-40 text-center">
        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.25em] text-brand-cyan backdrop-blur"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4fd8] animate-pulse" /> {studio.city ? `${studio.name} · ${studio.city}` : studio.name}
        </motion.p>
        <motion.h1
          custom={0.1}
          variants={rise}
          initial="hidden"
          animate="show"
          className="font-headline font-extrabold tracking-[-0.045em] leading-[0.95] text-[13vw] sm:text-7xl lg:text-[7.5rem] mt-8 max-w-6xl mx-auto"
        >
          <LoudTitle text={c.heroTitle || studio.name} />
        </motion.h1>
        {(c.heroSubtitle || studio.tagline) && (
          <motion.p custom={0.25} variants={rise} initial="hidden" animate="show" className="mt-7 text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            {c.heroSubtitle || studio.tagline}
          </motion.p>
        )}
        <motion.div custom={0.4} variants={rise} initial="hidden" animate="show" className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/booking" className="btn-primary glow-brand text-base md:text-lg px-9 py-4 font-headline font-bold hover:scale-105 transition-transform">
            {t('home.bookCta')} <ArrowRight size={18} />
          </Link>
          <Link href="/portfolio" className="btn-glass text-base md:text-lg px-9 py-4 font-headline font-bold">
            {t('home.viewWork')}
          </Link>
        </motion.div>
      </div>

      <Equalizer bars={72} className="absolute bottom-0 inset-x-0 h-28 md:h-36 opacity-80" />
      <div className="absolute bottom-40 md:bottom-44 left-1/2 -translate-x-1/2 text-white/40 hidden sm:block">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown size={22} />
        </motion.div>
      </div>
    </section>
  )
}

function ServiceCard({ pkg, index }: { pkg: ServicePackage; index: number }) {
  const { t } = useI18n()
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: EASE }}
      className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-white/10 hover:from-brand-purple hover:via-brand-cyan/50 hover:to-[#ff4fd8] transition-colors duration-500"
    >
      <div className="relative h-full rounded-2xl bg-bg-surface p-7 flex flex-col overflow-hidden">
        <span className="absolute -right-2 -top-6 font-headline font-extrabold text-[7rem] leading-none text-white/[0.04] group-hover:text-brand-purple/15 transition-colors">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="w-12 h-12 rounded-xl bg-brand-purple/15 flex items-center justify-center text-brand-cyan group-hover:bg-brand-purple group-hover:text-white transition-colors">
          <ServiceIcon category={pkg.category} />
        </div>
        <span className="mt-5 text-xs font-mono uppercase tracking-[0.2em] text-brand-cyan">{pkg.category}</span>
        <h3 className="font-headline text-2xl font-bold mt-1.5">{pkg.name}</h3>
        {pkg.description && <p className="text-sm text-text-muted mt-3 leading-relaxed">{pkg.description}</p>}
        {pkg.includes.length > 0 && (
          <ul className="mt-5 space-y-2">
            {pkg.includes.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-text-muted">
                <Check size={15} className="text-brand-cyan shrink-0 mt-0.5" /> {item}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-7 flex items-end justify-between gap-3">
          <div>
            <div className="text-lg"><PackagePrice pkg={pkg} /></div>
            <p className="flex items-center gap-1 text-xs text-outline mt-1">
              <Clock size={12} /> {pkg.pricingType === 'HOURLY' ? `min. ${duration(pkg.durationMinutes)}` : duration(pkg.durationMinutes)}
            </p>
          </div>
          <Link href={`/booking?package=${pkg.id}`} className="btn-primary text-sm py-2.5 px-5 group-hover:glow-brand">
            {t('service.bookThis')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-12">
      <p className="text-xs font-mono uppercase tracking-[0.3em] text-brand-cyan">{eyebrow}</p>
      <h2 className="font-headline text-4xl md:text-6xl font-extrabold tracking-[-0.03em] mt-3">{title}</h2>
      {sub && <p className="text-text-muted mt-3 text-lg">{sub}</p>}
    </div>
  )
}

export default function HomePage() {
  const studio = useRequiredStudio()
  const { t } = useI18n()
  const packages = useQuery({ queryKey: ['packages', 'public'], queryFn: api.packages.list })
  const rooms = useQuery({ queryKey: ['rooms', 'public'], queryFn: api.rooms.list })
  const featured = useQuery({ queryKey: ['portfolio', 'featured'], queryFn: api.portfolio.featured })
  const c = studio.content ?? {}
  const pkgs = packages.data ?? []
  const tickerWords = Array.from(new Set([...pkgs.map((p) => p.name), ...pkgs.map((p) => p.category)]))
  const roomList = (rooms.data ?? []).filter((r) => r.imageUrl || r.description)

  return (
    <>
      <Hero />

      <div className="border-y border-white/10 bg-bg-surface/60 py-6 -rotate-1 scale-105 my-10">
        <Marquee items={tickerWords.length ? tickerWords : [studio.name, t('home.bookCta')]} className="font-headline font-extrabold text-4xl md:text-6xl tracking-tight" />
      </div>

      {(c.stats?.length ?? 0) > 0 && (
        <section className="container-studio py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {c.stats!.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-headline text-5xl md:text-7xl font-extrabold text-shine">{s.value}</p>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-text-muted mt-2">{s.label}</p>
            </div>
          ))}
        </section>
      )}

      <section id="services" className="container-studio py-20 scroll-mt-20">
        <SectionTitle eyebrow={t('nav.services')} title={t('home.services')} sub={t('home.servicesSub')} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pkgs.map((p, i) => <ServiceCard key={p.id} pkg={p} index={i} />)}
        </div>
        {packages.data?.length === 0 && <p className="text-text-muted">{t('home.noServices')}</p>}
      </section>

      {roomList.length > 0 && (
        <section className="container-studio py-20">
          <SectionTitle eyebrow={t('booking.room')} title={t('home.rooms')} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roomList.map((r) => (
              <div key={r.id} className="group relative rounded-2xl overflow-hidden min-h-72 flex items-end">
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded room photo
                  <img src={r.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${r.color}, transparent)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/40 to-transparent" />
                <div className="relative p-6">
                  <p className="font-headline text-2xl font-bold">{r.name}</p>
                  {r.capacity && <p className="text-xs text-text-muted flex items-center gap-1 mt-1"><Users size={12} /> {r.capacity}</p>}
                  {r.description && <p className="text-sm text-text-muted mt-2 line-clamp-2">{r.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(featured.data?.length ?? 0) > 0 && (
        <section className="container-studio py-20">
          <div className="flex items-end justify-between">
            <SectionTitle eyebrow={t('nav.portfolio')} title={t('home.featured')} />
            <Link href="/portfolio" className="mb-12 text-sm font-mono uppercase tracking-wider text-brand-cyan hover:underline">{t('home.allWork')} →</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data!.slice(0, 6).map((item) => <PortfolioTile key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {(c.testimonials?.length ?? 0) > 0 && (
        <section className="container-studio py-20">
          <SectionTitle eyebrow="★ ★ ★ ★ ★" title={t('home.testimonials')} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {c.testimonials!.map((tm, i) => (
              <figure key={i} className="relative glass-card rounded-2xl p-8">
                <span className="absolute top-2 left-5 font-headline text-7xl text-brand-purple/40 leading-none">“</span>
                <blockquote className="relative text-text-primary text-lg leading-relaxed mt-4">{tm.quote}</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-semibold">{tm.name}</span>
                  {tm.role && <span className="text-text-muted"> · {tm.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {(c.faq?.length ?? 0) > 0 && (
        <section className="container-studio py-20 max-w-3xl">
          <SectionTitle eyebrow="FAQ" title={t('home.faq')} />
          <div className="space-y-3">
            {c.faq!.map((f, i) => (
              <details key={i} className="glass-card rounded-xl px-6 py-5 group">
                <summary className="cursor-pointer font-headline font-semibold text-lg list-none flex justify-between gap-4">
                  {f.question}
                  <span className="text-brand-cyan text-2xl leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-text-muted mt-3 whitespace-pre-line">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden my-20">
        {c.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded image
          <img src={c.aboutImageUrl || c.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <Orbs />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-main via-transparent to-bg-main" />
        <div className="relative container-studio py-28 text-center">
          <h2 className="font-headline text-5xl md:text-8xl font-extrabold tracking-[-0.045em] leading-[0.95]">
            <LoudTitle text={t('home.ctaTitle')} />
          </h2>
          <p className="text-text-muted mt-6 text-lg">{t('home.ctaSub')}</p>
          <Link href="/booking" className="btn-primary glow-brand mt-10 text-lg px-10 py-4 font-headline font-bold hover:scale-105 transition-transform">
            {t('home.bookCta')} <ArrowRight size={18} />
          </Link>
        </div>
        <Equalizer bars={64} className="absolute bottom-0 inset-x-0 h-20 opacity-50" />
      </section>
    </>
  )
}
