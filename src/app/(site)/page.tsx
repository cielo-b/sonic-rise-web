'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, Clock } from 'lucide-react'
import { api, type ServicePackage } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { duration } from '@/lib/format'
import { PackagePrice } from '@/components/site/Price'
import { PortfolioTile } from '@/components/site/PortfolioTile'

function Hero() {
  const studio = useRequiredStudio()
  const { t } = useI18n()
  const c = studio.content ?? {}
  return (
    <section className="relative overflow-hidden min-h-[70vh] flex items-center">
      {c.heroImageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- studio-uploaded hero */}
          <img src={c.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/60 to-transparent" />
        </>
      )}
      {!c.heroImageUrl && <div className="absolute inset-0 bg-hero-radial opacity-60" />}
      <div className="container-studio relative py-24">
        <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.05]">
          {c.heroTitle || studio.name}
        </h1>
        {(c.heroSubtitle || studio.tagline) && (
          <p className="mt-5 text-lg text-text-muted max-w-xl">{c.heroSubtitle || studio.tagline}</p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/booking" className="btn-primary">
            {t('home.bookCta')} <ArrowRight size={16} />
          </Link>
          <Link href="/portfolio" className="btn-glass">{t('home.viewWork')}</Link>
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ pkg }: { pkg: ServicePackage }) {
  const { t } = useI18n()
  return (
    <div className="glass-card rounded-xl p-6 flex flex-col">
      <span className="text-xs font-mono uppercase tracking-wider text-brand-cyan">{pkg.category}</span>
      <h3 className="font-headline text-lg font-semibold mt-2">{pkg.name}</h3>
      {pkg.description && <p className="text-sm text-text-muted mt-2 line-clamp-3">{pkg.description}</p>}
      {pkg.includes.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {pkg.includes.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-text-muted">
              <Check size={15} className="text-brand-cyan shrink-0 mt-0.5" /> {item}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-6 flex items-end justify-between gap-3">
        <div>
          <PackagePrice pkg={pkg} />
          <p className="flex items-center gap-1 text-xs text-outline mt-1">
            <Clock size={12} /> {pkg.pricingType === 'HOURLY' ? `min. ${duration(pkg.durationMinutes)}` : duration(pkg.durationMinutes)}
          </p>
        </div>
        <Link href={`/booking?package=${pkg.id}`} className="btn-glass text-sm py-2 px-4">
          {t('service.bookThis')}
        </Link>
      </div>
    </div>
  )
}

export default function HomePage() {
  const studio = useRequiredStudio()
  const { t } = useI18n()
  const packages = useQuery({ queryKey: ['packages', 'public'], queryFn: api.packages.list })
  const featured = useQuery({ queryKey: ['portfolio', 'featured'], queryFn: api.portfolio.featured })
  const c = studio.content ?? {}

  return (
    <>
      <Hero />

      {(c.stats?.length ?? 0) > 0 && (
        <section className="container-studio py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {c.stats!.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-headline text-3xl md:text-4xl font-extrabold text-brand-purple">{s.value}</p>
              <p className="text-xs uppercase tracking-wider text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </section>
      )}

      <section id="services" className="container-studio py-20 scroll-mt-20">
        <h2 className="font-headline text-3xl font-bold">{t('home.services')}</h2>
        <p className="text-text-muted mt-2">{t('home.servicesSub')}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packages.data?.map((p) => <ServiceCard key={p.id} pkg={p} />)}
        </div>
        {packages.data?.length === 0 && <p className="text-text-muted mt-6">{t('home.noServices')}</p>}
      </section>

      {(featured.data?.length ?? 0) > 0 && (
        <section className="container-studio py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-headline text-3xl font-bold">{t('home.featured')}</h2>
            <Link href="/portfolio" className="text-sm text-brand-cyan hover:underline">{t('home.allWork')}</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data!.slice(0, 6).map((item) => <PortfolioTile key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {(c.testimonials?.length ?? 0) > 0 && (
        <section className="container-studio py-16">
          <h2 className="font-headline text-3xl font-bold mb-8">{t('home.testimonials')}</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {c.testimonials!.map((tm, i) => (
              <figure key={i} className="glass-card rounded-xl p-6">
                <blockquote className="text-text-primary leading-relaxed">“{tm.quote}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{tm.name}</span>
                  {tm.role && <span className="text-text-muted"> · {tm.role}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {(c.faq?.length ?? 0) > 0 && (
        <section className="container-studio py-16 max-w-3xl">
          <h2 className="font-headline text-3xl font-bold mb-6">FAQ</h2>
          <div className="space-y-3">
            {c.faq!.map((f, i) => (
              <details key={i} className="glass-card rounded-xl px-5 py-4 group">
                <summary className="cursor-pointer font-medium list-none flex justify-between gap-4">
                  {f.question}
                  <span className="text-text-muted group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-text-muted mt-3 whitespace-pre-line">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="container-studio py-20">
        <div className="glass-card rounded-2xl p-10 md:p-14 text-center">
          <h2 className="font-headline text-3xl font-bold">{t('home.ctaTitle')}</h2>
          <p className="text-text-muted mt-3">{t('home.ctaSub')}</p>
          <Link href="/booking" className="btn-primary mt-6">{t('home.bookCta')}</Link>
        </div>
      </section>
    </>
  )
}
