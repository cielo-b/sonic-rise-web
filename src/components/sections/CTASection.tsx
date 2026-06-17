'use client'

import { motion } from 'framer-motion'
import { CalendarDays, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-[80px] container-studio mb-20">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative glass-card rounded-[2rem] p-12 md:p-24 overflow-hidden text-center hero-glow"
      >
        {/* Gradient tint */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/10 to-brand-cyan/10 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="font-headline text-4xl md:text-6xl font-extrabold text-text-primary mb-8 tracking-tight">
            Ready to Elevate Your Vision?
          </h2>
          <p className="font-body text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            Whether it&apos;s a single track or a global campaign, we have the tools
            and the talent to make it extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/booking"
              className="bg-brand-purple hover:opacity-90 transition-all px-12 py-5 rounded-xl font-headline font-bold text-xl text-white hover:scale-105 transition-transform flex items-center gap-3"
            >
              Book Your Session <CalendarDays size={20} />
            </Link>
            <Link
              href="/contact"
              className="font-mono text-sm tracking-widest text-text-muted hover:text-brand-cyan transition-colors flex items-center gap-2"
            >
              OR CONTACT US DIRECTLY <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
