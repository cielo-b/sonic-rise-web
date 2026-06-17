'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

interface Testimonial {
  quote: string
  name: string
  role: string
  accent: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: '"The level of technical precision and creative input at SonicRise is unmatched in the region. They didn\'t just record my album; they helped define my sound."',
    name: 'Iradukunda Eric',
    role: 'Independent Artist',
    accent: '#7C3AED',
    initials: 'IE',
  },
  {
    quote: '"As a marketing agency, we need reliable partners for high-end video content. SonicRise consistently delivers cinematic quality that exceeds our client\'s expectations."',
    name: 'Aline Umutoni',
    role: 'Creative Director, VisionMedia',
    accent: '#00D4FF',
    initials: 'AU',
  },
  {
    quote: '"Producing our corporate podcast series here was a breeze. The technical setup is world-class and the staff are incredibly professional and efficient."',
    name: 'Jean-Paul Gasana',
    role: 'CEO, TechConnect Rwanda',
    accent: '#D4AF37',
    initials: 'JG',
  },
]

export function TestimonialsSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <section className="py-[80px] container-studio overflow-hidden">
      <div className="text-center mb-14">
        <h2 className="font-headline text-4xl font-bold text-text-primary mb-4">
          Voice of the Artists
        </h2>
        <div className="w-24 h-1 bg-brand-purple mx-auto rounded-full" />
        <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mt-4 opacity-60">
          Drag to explore →
        </p>
      </div>

      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0.05}
          dragMomentum={false}
          className="flex gap-8 cursor-grab active:cursor-grabbing select-none"
          style={{ width: 'max-content' }}
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="glass-card p-10 rounded-2xl flex flex-col justify-between shrink-0"
              style={{ minWidth: '340px', maxWidth: '450px' }}
            >
              <div>
                <Quote size={40} style={{ color: t.accent }} className="opacity-70 mb-6" strokeWidth={1.5} />
                <p className="font-body text-lg italic leading-relaxed text-text-primary mb-8">
                  {t.quote}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-headline font-bold text-sm text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${t.accent}66, ${t.accent})` }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-headline font-bold text-text-primary">{t.name}</p>
                  <p className="font-mono text-xs text-brand-cyan uppercase tracking-wider mt-0.5">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
