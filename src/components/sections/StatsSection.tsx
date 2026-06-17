'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STATS = [
  { end: 500, suffix: '+', label: 'Projects Completed', color: 'text-brand-purple' },
  { end: 100, suffix: '+', label: 'Global Clients',     color: 'text-brand-cyan'   },
  { end: 200, suffix: '+', label: 'Music Videos',       color: 'text-brand-gold'   },
]

function CountUp({ end, suffix }: { end: number; suffix: string }) {
  const ref    = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1400
    const fps      = 60
    const frames   = Math.round((duration / 1000) * fps)
    let frame      = 0
    const id = setInterval(() => {
      frame++
      const progress = 1 - Math.pow(1 - frame / frames, 3) // ease-out cubic
      setCount(Math.round(progress * end))
      if (frame >= frames) { setCount(end); clearInterval(id) }
    }, 1000 / fps)
    return () => clearInterval(id)
  }, [inView, end])

  return <span ref={ref}>{count}{suffix}</span>
}

export function StatsSection() {
  return (
    <section className="bg-[#1A1A22] py-20 border-y border-white/5">
      <div className="container-studio grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
          >
            <p className={`font-headline text-5xl font-bold ${s.color} mb-2`}>
              <CountUp end={s.end} suffix={s.suffix} />
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-text-muted">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
