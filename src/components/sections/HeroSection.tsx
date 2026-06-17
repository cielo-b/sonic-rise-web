'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { EASE } from '@/lib/motion'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: d, ease: EASE },
  }),
}

export function HeroSection() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">

      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9t5QBmlLCjikxI7WmRJMQLGJNo_6z9pBo4nsYfLA0oofw093a_P233hCK90ogT_9HwNdQonK-YnXHi1WfzfZbWhqyI24ZdoB4UczEj9Svm-EucafrJo4KZih8opWzQUnWyPp_XuIf5n5_L66K99HqKs-LGQ4o2XwCJRxYhu4YV2PAUZoRHKkQSbkjaxquYz_xadnnUTpxFdUkginX75Zs24y4ckHo8bEVa1nH46ho4qRFIHruoaOYHUxK_Vz8LRimRWH-ipYklrA"
          alt="SonicRise recording studio"
          fill
          priority
          className="object-cover opacity-40"
          unoptimized
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0B0F]/50 to-[#0B0B0F]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/60 via-transparent to-[#0B0B0F]/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container-studio text-center">
        <motion.h1
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-headline text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-[-0.04em] text-text-primary mb-6"
        >
          Where{' '}
          <span className="gradient-text">Sound</span>
          {' '}Meets Vision
        </motion.h1>

        <motion.p
          custom={0.18}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto text-lg md:text-xl text-[#C8C5CB] mb-10 leading-relaxed"
        >
          Rwanda&apos;s premier creative studio delivering world-class audio engineering
          and visual storytelling for a global audience.
        </motion.p>

        <motion.div
          custom={0.32}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 bg-brand-purple px-10 py-4 rounded-lg font-headline font-bold text-lg text-white hero-glow hover:scale-105 transition-transform"
          >
            Book a Session <ArrowRight size={18} />
          </Link>
          <Link
            href="/portfolio"
            className="glass-card inline-flex items-center justify-center px-10 py-4 rounded-lg font-headline font-bold text-lg hover:bg-white/10 transition-colors"
          >
            View Portfolio
          </Link>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Scroll to Explore</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown size={20} />
        </motion.div>
      </div>
    </section>
  )
}
