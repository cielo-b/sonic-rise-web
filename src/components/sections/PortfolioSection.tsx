'use client'

import { motion, type Variants } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { type ApiPortfolioItem } from '@/lib/api'
import { usePortfolioFeatured } from '@/lib/queries'
import { EASE } from '@/lib/motion'

interface DisplayItem {
  title: string
  category: string
  categoryColor: string
  src: string
  alt: string
  tall?: boolean
}

const FALLBACK_ITEMS: DisplayItem[] = [
  {
    title: 'The Night Session',
    category: 'MUSIC VIDEO',
    categoryColor: 'text-brand-cyan bg-brand-cyan/10',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt-3fGyXKRddtqYQCZx5CDeS3mUWZrodKnMp9ewQ0pHRuP3Y3satLqaZD2zg5ZsWtLDsCOA3S_ECs41JokBDlOmkaLPKZEYqdiFX8kx87Yh3gHJPRJsTzOfUafCKYNUcV50wXKpYJWMfkYkFWWlYrf0LC0PHLB1jSfUPOmoxelXODItPFnpAVBUOKtJv8quXiVKGaGccXDNOyyfa-gZNFvgtTIeb9I7iCIiskOKZytBi2CJNotkFxhoKzufNKfSBxXBufZ8h2u8q0',
    alt: 'The Night Session — music video still',
  },
  {
    title: 'Cyber Pulse 2024',
    category: 'BRAND FILM',
    categoryColor: 'text-brand-purple bg-brand-purple/10',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHgmHeUHrad6dRyw35XpkH0yAYx5yTd-vnGIL-MF-yEgeG9EAoxwyKHoLykK3d75nHvR0T6WGk61_xld924SI5zcPerrP9pDDcHlJuaL01hTgyJy6lS940g5PqqGD_RuEAdfVPSjaXXWE0cQr4WKvewGrJY_eafhl0zoE1SwpKmyNAJDu0lTx97OleYxgkCf2A1CACS59szNF8xSCTD2WfxY7R3NERmCrTDc9IaiM1nUVPuoJ1elKvMe4JaC_QKflrIcMf21GtuVo',
    alt: 'Cyber Pulse 2024 — brand film',
    tall: true,
  },
  {
    title: 'Mastering Excellence',
    category: 'AUDIO ENGINEERING',
    categoryColor: 'text-brand-gold bg-brand-gold/10',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9TEYqnn7_2PtfOhx3Y_hmU5RewqJobl7pmbu3unxxfhEYpnFoWxDlSYdA58IJwJ6osFxmvfgJh3bqw7bwwKKVNJUMgTicxfH-JV3qQeNJxg63kE4Fk7Yo3WoYW4W0kpsZKAum1tlLDdzs-mzdJJbXnxPCIgE8_kJ2RcS0t7Fky0YMqWNgRYxUcAGaTPCZeZnHngEf5BTxIDBSWzg-VrZfijUjyRys9PP8AFAcXMbQKPO43e7sAYWn_kyff7Nz_jbNqby7zTcd-EU',
    alt: 'Mastering Excellence — audio engineering',
  },
  {
    title: 'Sonic Dialogues',
    category: 'LIVE STREAM',
    categoryColor: 'text-text-primary bg-white/10',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh-gnvymTyRCkVXaSEbmYmqiu1rflPH-dlVGdDMRLydaBHHcBZ-C5QINCBh6NK7oJ4TLOdxHqFdeoYvINrBAUUYghSTaB1y0-dMWoeiUwc1sQVnZj0ushaUst7pSoAWqlU5RPc6xZxN08RRPavYH-PZ03RnsrFJTfkKjZv5vUwN0KisbFZ6p0CKLAbwqN2IDgmtWIRcDwNWF_S-GglxA-M1DVqnf_OOjRnN50900GP0QZWnOBxusYVGU3SFhaJogO5-SdwgWy9mig',
    alt: 'Sonic Dialogues — podcast live stream',
  },
  {
    title: 'Rise Arena Tour',
    category: 'LIVE EVENT',
    categoryColor: 'text-brand-cyan bg-brand-cyan/10',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8ZCPbaR2JPbUmrO3g5WlJiDU682FZnMLAstJbezfkf9Glf1pxt80YIFiOPvVFYBH3OFq1ESfZFs_7I9lekAPUHlmOr19kMQH-ycBvEI3hBOTs-xRoCMnL0YDQX25WJAc54a18HEbqTDMAioLBk2f6Dj3h1a_VoNmGMKu0qpVtyyxzit3nFmowIm0CutO89dB-eIf1zMeURc87NB-v0J9fVYnuh343DOq9DDQ-JlRpmW6MhqT52bpDPYMKlx0mw5NBINIoijTC7M4',
    alt: 'Rise Arena Tour — live concert',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Music Video':      'text-brand-cyan bg-brand-cyan/10',
  'Brand Film':       'text-brand-purple bg-brand-purple/10',
  'Audio Engineering':'text-brand-gold bg-brand-gold/10',
  'Live Stream':      'text-text-primary bg-white/10',
  'Live Event':       'text-brand-cyan bg-brand-cyan/10',
  'Podcast':          'text-brand-gold bg-brand-gold/10',
}

function toDisplayItem(item: ApiPortfolioItem, index: number): DisplayItem {
  return {
    title:         item.title,
    category:      item.category.toUpperCase(),
    categoryColor: CATEGORY_COLORS[item.category] ?? 'text-text-primary bg-white/10',
    src:           item.thumbnailUrl ?? item.mediaUrl,
    alt:           item.description ?? item.title,
    tall:          index === 1,
  }
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants: Variants = {
  hidden:   { opacity: 0, scale: 0.96 },
  visible:  { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE } },
}

const imageVariants: Variants = {
  rest:    { scale: 1 },
  hovered: { scale: 1.07, transition: { duration: 0.6, ease: EASE } },
}

export function PortfolioSection() {
  const { data } = usePortfolioFeatured()
  const items = data && data.length > 0 ? data.map(toDisplayItem) : FALLBACK_ITEMS

  return (
    <section id="portfolio" className="py-[80px] container-studio">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
        <div>
          <span className="font-mono text-brand-purple text-xs tracking-widest uppercase mb-4 block">Portfolio</span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
            Featured Works
          </h2>
        </div>
        <Link
          href="/portfolio"
          className="font-mono text-xs tracking-widest text-brand-cyan flex items-center gap-2 hover:gap-4 transition-all group"
        >
          VIEW ALL PROJECTS <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Desktop masonry grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="hidden md:grid grid-cols-3 gap-6"
        style={{ gridAutoRows: '280px' }}
      >
        {items.map((item) => (
          <motion.div
            key={item.title}
            variants={itemVariants}
            initial="rest"
            whileHover="hovered"
            animate="rest"
            className="group relative overflow-hidden rounded-xl glass-card cursor-pointer"
            style={{ gridRow: item.tall ? 'span 2' : 'span 1' }}
          >
            <motion.div variants={imageVariants} className="absolute inset-0">
              <Image src={item.src} alt={item.alt} fill className="object-cover" unoptimized />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-5 left-5">
              <span className={`font-mono text-[10px] px-2 py-1 rounded ${item.categoryColor} mb-2 inline-block`}>
                {item.category}
              </span>
              <h4 className="font-headline text-xl font-bold text-text-primary mt-1">{item.title}</h4>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile single column */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="md:hidden flex flex-col gap-4"
      >
        {items.map((item) => (
          <motion.div
            key={item.title}
            variants={itemVariants}
            className="relative overflow-hidden rounded-xl h-52 glass-card"
          >
            <Image src={item.src} alt={item.alt} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className={`font-mono text-[10px] px-2 py-1 rounded ${item.categoryColor} mb-1 inline-block`}>
                {item.category}
              </span>
              <h4 className="font-headline text-base font-bold text-text-primary">{item.title}</h4>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
