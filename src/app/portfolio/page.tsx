'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Play, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { usePortfolioAll } from '@/lib/queries'
import type { ApiPortfolioItem } from '@/lib/api'

const STATIC_FILTERS = ['All Works', 'Music Videos', 'Photography', 'Podcasts', 'Commercials', 'Weddings']

const COL_CYCLE   = ['md:col-span-8', 'md:col-span-4', 'md:col-span-4', 'md:col-span-4', 'md:col-span-8', 'md:col-span-4'] as const
const ASPECT_CYCLE = ['aspect-video', 'aspect-video', 'aspect-square', 'aspect-square', 'aspect-video', 'aspect-square'] as const

function apiToGallery(item: ApiPortfolioItem, i: number) {
  return {
    id:       item.id,
    title:    item.title,
    category: item.category,
    filter:   item.category,
    col:      COL_CYCLE[i % COL_CYCLE.length],
    aspect:   ASPECT_CYCLE[i % ASPECT_CYCLE.length],
    type:     'image' as const,
    src:      item.thumbnailUrl ?? item.mediaUrl,
    alt:      item.description ?? item.title,
    grayscale: false,
  }
}

interface GalleryItem {
  id:       string
  title:    string
  category: string
  filter:   string
  src:      string
  alt:      string
  col:      string
  aspect:   string
  type:     'video' | 'image'
  grayscale?: boolean
}

const GALLERY: GalleryItem[] = [
  {
    id: '1', title: 'The Rhythm of Kigali', category: 'Music Video', filter: 'Music Videos',
    col: 'md:col-span-8', aspect: 'aspect-video', type: 'video',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9Hfw0x4Bj4AtyrHU9SNLm2O3VLJxzC2EHL7d7JRHlqi8oMYFNrh3J_tgzasVTouWkOKTpMfYGm87MY5ghk9_Bwq8HUt7mBC4K5bAimgdkcZpnB9a1ae19sNR6hsHjLKFrnvHGTKNwJc4WoIAWk6rxk8uCVUFDZu6F8bINBvvihBleStm6SNLjUSI_q7OdAfTKjovxokWnXKPOFFZREgN4TcI2dZFgxY0OSct9lkjvWvXEbnfdGrRJwPLrE3B17htWpZnzThyRsKw',
    alt: 'The Rhythm of Kigali music video',
  },
  {
    id: '2', title: 'Sonic Textures', category: 'Photography', filter: 'Photography',
    col: 'md:col-span-4', aspect: 'aspect-video', type: 'image', grayscale: true,
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjzr4A9Ph5MESwg1lsQzzTCncsd3ooDYbDI8Z-5HGrMAIqrW6MIwSS-DbizdbWA7NE5nlYnqa8jIeZh641tXEjqONRqwdt-PLrKSEMH_FNAicH-M0WTqR8ZA9wDPW8Vn19DNBqwx_dKkxSqi0Rh2G3beBh94nuEqDnIb-1Px-lmyhJqFXC4lo3Jbb6td522vrZnoiZ8pj9lUsbcbGZLqovpkmSTin0BcBMiS5fs1-x2sruqnG5dfti7vnRxnbdWwNThyoIL-PekUM',
    alt: 'Sonic Textures photography',
  },
  {
    id: '3', title: 'City Silence', category: 'Photography', filter: 'Photography',
    col: 'md:col-span-4', aspect: 'aspect-square', type: 'image',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVZdR5pCBf0O4fPOXbemV7Xm6Yt4Ow3kRsoTjmggXsKK0RKH2E_DcyTm2koy6XNgnFzkm0jMV7YvPXSKH6fHKLz9kBkXLZccV3NyNfWF1Q-KinJych2U9DIgsOYZy6CipmSKWjP2aOiY_c-DX0g2ZKzRgsEprmQDRrRq3w9maA02qOvL0HCyZgfB-SrhCr31CGbJsKt5ZckxaykL_56Zn9j5q5mYZwjJSRvq6kLgyvNA77ozI322spFNzSkHYjieBJkJ9jYCCb2m4',
    alt: 'City Silence photography',
  },
  {
    id: '4', title: 'Deep Dive Series', category: 'Podcast', filter: 'Podcasts',
    col: 'md:col-span-4', aspect: 'aspect-square', type: 'image',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4XFZR8ReuEcG5_MWaW_wSilXQnukZXijyduUin7Uo1RG093FcCp7FHClDKfCho5-FRnwbyECgltfATUoB6XYNuAC4ydOAASVBhOJJnX42s6WLSDXQLds3EpBMfyg3df8CcvQt9dCvgmiG6EGBNNBilbaP8VLEmAu-XSI9nEzfkhJaU_1m3cBI8o2Ii-ZS-K9Si6f0HF6sGxrjwLG3yGvoQ31FHnAoGTVdo_mH4d7VL0Dl7liic1Uy6uSLNXfZVSbLYr1ND8qXVqk',
    alt: 'Deep Dive Podcast',
  },
  {
    id: '5', title: 'Apex Motors', category: 'Commercial', filter: 'Commercials',
    col: 'md:col-span-4', aspect: 'aspect-square', type: 'image', grayscale: true,
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3aDTOeeXs6AA3XKfVd9e280MgZVM2Zci15DlkG7TU-k8Ot1AeuxL5DK6EXbOTJ-Pq199p3oFq0LfqssKd751SF95_2uLcvoCEBPUG3UJcDl4VbLZktDnHKbyfL_WPD4kwaSeAypeVokSffCEfS37_oQho5BqdT5v7sEcBCaB1F_b2uQbgXWdUYPJKLrOI5OjX8su7pvLWwvPavHADBkPNeVIuQpVuMn6kYC6ip64r-YACYuoAqmxNSdvLVEiOAHpV7Wmqon4g1MY',
    alt: 'Apex Motors commercial',
  },
  {
    id: '6', title: 'Rise Arena Tour', category: 'Music Video', filter: 'Music Videos',
    col: 'md:col-span-8', aspect: 'aspect-video', type: 'video',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8ZCPbaR2JPbUmrO3g5WlJiDU682FZnMLAstJbezfkf9Glf1pxt80YIFiOPvVFYBH3OFq1ESfZFs_7I9lekAPUHlmOr19kMQH-ycBvEI3hBOTs-xRoCMnL0YDQX25WJAc54a18HEbqTDMAioLBk2f6Dj3h1a_VoNmGMKu0qpVtyyxzit3nFmowIm0CutO89dB-eIf1zMeURc87NB-v0J9fVYnuh343DOq9DDQ-JlRpmW6MhqT52bpDPYMKlx0mw5NBINIoijTC7M4',
    alt: 'Rise Arena Tour live event',
  },
  {
    id: '7', title: 'Cyber Pulse 2024', category: 'Brand Film', filter: 'Commercials',
    col: 'md:col-span-4', aspect: 'aspect-video', type: 'image',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHgmHeUHrad6dRyw35XpkH0yAYx5yTd-vnGIL-MF-yEgeG9EAoxwyKHoLykK3d75nHvR0T6WGk61_xld924SI5zcPerrP9pDDcHlJuaL01hTgyJy6lS940g5PqqGD_RuEAdfVPSjaXXWE0cQr4WKvewGrJY_eafhl0zoE1SwpKmyNAJDu0lTx97OleYxgkCf2A1CACS59szNF8xSCTD2WfxY7R3NERmCrTDc9IaiM1nUVPuoJ1elKvMe4JaC_QKflrIcMf21GtuVo',
    alt: 'Cyber Pulse 2024 brand film',
  },
  {
    id: '8', title: 'The Night Session', category: 'Music Video', filter: 'Music Videos',
    col: 'md:col-span-4', aspect: 'aspect-square', type: 'image',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt-3fGyXKRddtqYQCZx5CDeS3mUWZrodKnMp9ewQ0pHRuP3Y3satLqaZD2zg5ZsWtLDsCOA3S_ECs41JokBDlOmkaLPKZEYqdiFX8kx87Yh3gHJPRJsTzOfUafCKYNUcV50wXKpYJWMfkYkFWWlYrf0LC0PHLB1jSfUPOmoxelXODItPFnpAVBUOKtJv8quXiVKGaGccXDNOyyfa-gZNFvgtTIeb9I7iCIiskOKZytBi2CJNotkFxhoKzufNKfSBxXBufZ8h2u8q0',
    alt: 'The Night Session music video',
  },
  {
    id: '9', title: 'Mastering Excellence', category: 'Audio Engineering', filter: 'Music Videos',
    col: 'md:col-span-4', aspect: 'aspect-square', type: 'image',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9TEYqnn7_2PtfOhx3Y_hmU5RewqJobl7pmbu3unxxfhEYpnFoWxDlSYdA58IJwJ6osFxmvfgJh3bqw7bwwKKVNJUMgTicxfH-JV3qQeNJxg63kE4Fk7Yo3WoYW4W0kpsZKAum1tlLDdzs-mzdJJbXnxPCIgE8_kJ2RcS0t7Fky0YMqWNgRYxUcAGaTPCZeZnHngEf5BTxIDBSWzg-VrZfijUjyRys9PP8AFAcXMbQKPO43e7sAYWn_kyff7Nz_jbNqby7zTcd-EU',
    alt: 'Mastering Excellence audio engineering',
  },
  {
    id: '10', title: 'Sonic Dialogues', category: 'Live Stream', filter: 'Podcasts',
    col: 'md:col-span-4', aspect: 'aspect-square', type: 'image',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-farVLqfbVJ7p0q9sEz1DbtGkcgjwvR-zrsRB60nil7-wRH4RNbHmtbglOXLei_S4JWG2JBFxc8owfxx2TnHohF9fZzLnAbrFrJTOXniYDo86SKdPSdEJu3u6Lc1lsByMHHLpGv9Z3lWVcS26wj91fl12jnk7G13LA6O_dvRU9FEtGWI0s5iVgV6IX0iwlUdiB88xj0xpSUeH8RkJLU3L8OuS-pOoCURs_YefPGGshTmE8PQJrZodaX9bYNJamHBBVAfXvAVGVlI',
    alt: 'Sonic Dialogues live stream',
  },
]

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = useState('All Works')
  const { data: apiItems } = usePortfolioAll()

  const gallery = useMemo(() => {
    if (apiItems && apiItems.length > 0) return apiItems.map(apiToGallery)
    return GALLERY
  }, [apiItems])

  const filters = useMemo(() => {
    if (apiItems && apiItems.length > 0) {
      const cats = ['All Works', ...Array.from(new Set(apiItems.map((i) => i.category)))]
      return cats
    }
    return STATIC_FILTERS
  }, [apiItems])

  const filtered = activeFilter === 'All Works'
    ? gallery
    : gallery.filter((g) => g.filter === activeFilter || g.category === activeFilter)

  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative h-[640px] md:h-[820px] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUWpc8ACpCopmmJG0ZhEp3jl9GDfHJB4uk2lankJf-Lvww4XtTT-xLrXQpPd9h7HnhEQTaiZxwv6PPnjtSZ-skQ6NGQ9tGYVtqtihsPOMPnD4XcjwcuM2RaLlSLXIc0FuNnJyRQyFOxes_yNzfBO8lDUqQlrkwrdScxL72ybBqnnMpjQq1ldVdktPG9xrQijnCMAiF1GOXkGVdDWVRykvW2YIH6zhzjhoHaOqa9AZCETCdggtkbe5Kp79lfK9j6wzjR3wbq5DJoB0"
              alt="SonicRise studio"
              fill
              priority
              className="object-cover opacity-60 grayscale-[0.2]"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-transparent to-transparent" />
          </div>
          <div className="relative z-10 container-studio">
            <span className="font-mono text-xs tracking-widest text-brand-cyan uppercase mb-3 block">Portfolio Overview</span>
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-[-0.04em] text-text-primary mb-4">
              Our Masterpieces
            </h1>
            <p className="text-text-muted text-lg max-w-xl leading-relaxed">
              A curated showcase of cinematic excellence, high-fidelity sound, and visual
              storytelling crafted for the world&apos;s most demanding creators.
            </p>
          </div>
        </section>

        {/* ── Sticky filter bar ─────────────────────────────────────────── */}
        <div className="sticky top-16 z-40 bg-[#0D0E15]/80 backdrop-blur-md border-b border-white/5">
          <div className="container-studio py-5 flex flex-wrap gap-2 items-center overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-1.5 rounded-full text-sm font-mono transition-all whitespace-nowrap ${
                  activeFilter === f
                    ? 'glass-card text-[#d2bbff]'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Featured project ─────────────────────────────────────────── */}
        {(activeFilter === 'All Works' || activeFilter === 'Music Videos') && (
          <section className="py-14 container-studio">
            <div className="relative group overflow-hidden rounded-xl border border-white/10 glass-card">
              <div className="aspect-[21/9] w-full relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOk-Z0RhmVKVgNhixvIS7sWaH3xTrGYs6CO72TF63H-2JLCk59qOMN8N2EJ6WnusWRtiocHWAgJki_i4zhCf5R_Q_XSW-QCO3YFXaI8dT2A6ewKRDjD5rlQb-dH-E43vQVrj2-E5r3WT3reHjjIw3ZujKtY7jcMcHM_8pAQbbaOddwdj_TwbexsxaijWZTgvrTYMBf-hmQXlMyrGnD_jRyQiymB-MCBCpowIsRok8b76o9LL1Z5P0zKgRJv-TfnGIennBvW193TsA"
                  alt="Midnight Echoes: The Visual Album"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/40 to-transparent flex flex-col justify-center px-10 md:px-16">
                  <span className="font-mono text-xs text-brand-cyan mb-2 flex items-center gap-1.5">
                    <Star size={12} className="fill-brand-cyan" />
                    FEATURED PROJECT
                  </span>
                  <h2 className="font-headline text-2xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-5 max-w-xl">
                    Midnight Echoes: The Visual Album
                  </h2>
                  <Link href="#" className="inline-flex items-center gap-2 text-[#d2bbff] font-mono text-sm group/link w-fit">
                    CASE STUDY
                    <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Gallery grid ─────────────────────────────────────────────── */}
        <section className="pb-20 container-studio">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-5"
            >
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className={`group cursor-pointer ${item.col}`}
                >
                  <div className={`relative ${item.aspect} rounded-xl overflow-hidden border border-white/10 glass-card`}>
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className={`object-cover transition-all duration-500 ${
                        item.grayscale ? 'grayscale group-hover:grayscale-0' : 'group-hover:scale-105'
                      }`}
                      unoptimized
                    />

                    {/* Play button — video only, fades in on hover */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#d2bbff] flex items-center justify-center scale-90 group-hover:scale-100 transition-transform shadow-[0_0_20px_rgba(210,187,255,0.3)]">
                          <Play size={22} className="text-[#3f008e] fill-[#3f008e] ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Category + title — always visible at the bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="font-mono text-[10px] text-brand-cyan mb-1">{item.category}</p>
                      <h3 className="font-headline text-base md:text-lg font-semibold text-text-primary">{item.title}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-24 text-text-muted font-mono text-sm uppercase tracking-wider">
              No works in this category yet.
            </div>
          )}
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-16 container-studio">
          <div className="glass-card p-12 md:p-20 rounded-2xl relative overflow-hidden text-center">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#d2bbff]/10 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#3cd7ff]/10 rounded-full blur-[100px]" />
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-text-primary mb-5 tracking-tight relative z-10">
              Ready to rise?
            </h2>
            <p className="text-text-muted text-lg max-w-xl mx-auto mb-8 relative z-10">
              Let&apos;s collaborate on your next visual or sonic masterpiece. Our team in Kigali
              is ready to bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link href="/booking" className="bg-[#d2bbff] text-[#3f008e] px-10 py-4 rounded-full font-mono font-bold text-sm hover:scale-105 transition-transform">
                Start a Project
              </Link>
              <Link href="/#services" className="glass-card text-text-primary px-10 py-4 rounded-full font-mono text-sm hover:bg-white/10 transition-colors">
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
