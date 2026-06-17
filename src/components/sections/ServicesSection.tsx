'use client'

import { motion } from 'framer-motion'
import { Mic2, Film, Radio, Headphones, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { EASE } from '@/lib/motion'

interface Service {
  icon: LucideIcon
  tag: string
  title: string
  description: string
  hoverBorder: string
  iconBg: string
  iconColor: string
}

const SERVICES: Service[] = [
  {
    icon: Mic2,
    tag: 'STUDIO A & B',
    title: 'Professional Recording',
    description: 'Pristine audio capture in acoustically treated environments using industry-standard gear and a Neve 8078 console.',
    hoverBorder: 'hover:border-brand-purple/50',
    iconBg: 'bg-brand-purple/20',
    iconColor: 'text-brand-purple',
  },
  {
    icon: Film,
    tag: 'FILM & CONTENT',
    title: 'Video Production',
    description: 'Cinematic storytelling from concept to final grade, optimized for broadcast, social, and streaming platforms.',
    hoverBorder: 'hover:border-brand-cyan/50',
    iconBg: 'bg-brand-cyan/20',
    iconColor: 'text-brand-cyan',
  },
  {
    icon: Radio,
    tag: 'BROADCAST LIVE',
    title: 'Live Streaming',
    description: 'Multi-camera professional streaming with low-latency distribution, real-time graphics, and crystal-clear audio.',
    hoverBorder: 'hover:border-brand-gold/50',
    iconBg: 'bg-brand-gold/20',
    iconColor: 'text-brand-gold',
  },
  {
    icon: Headphones,
    tag: 'AUDIO',
    title: 'Podcasting',
    description: 'Turn-key podcast solutions including acoustic treatment, hybrid mixing, and post-production editing services.',
    hoverBorder: 'hover:border-white/50',
    iconBg: 'bg-white/10',
    iconColor: 'text-text-primary',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden:   { opacity: 0, y: 32 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

function ServiceCard({ s }: { s: Service }) {
  const { icon: Icon, tag, title, description, hoverBorder, iconBg, iconColor } = s
  return (
    <motion.div
      variants={cardVariants}
      className={`glass-card p-8 rounded-xl group border border-white/10 ${hoverBorder} transition-all hover:-translate-y-1 duration-300 flex flex-col`}
    >
      <p className={`font-mono text-[10px] tracking-widest uppercase mb-5 ${iconColor}`}>{tag}</p>
      <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
        <Icon size={22} className={iconColor} strokeWidth={1.75} />
      </div>
      <h3 className="font-headline text-xl font-bold text-text-primary mb-3">{title}</h3>
      <p className="text-text-muted text-sm leading-relaxed flex-1">{description}</p>
      <Link
        href="/booking"
        className={`mt-6 inline-flex items-center gap-1.5 text-sm font-medium ${iconColor}`}
      >
        Book Now <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </Link>
    </motion.div>
  )
}

export function ServicesSection() {
  return (
    <section id="services" className="py-[80px] container-studio">
      <div className="mb-14">
        <span className="font-mono text-brand-cyan text-xs tracking-widest uppercase mb-4 block">Our Expertise</span>
        <h2 className="font-headline text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
          Comprehensive Creative Services
        </h2>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {SERVICES.map((s) => <ServiceCard key={s.title} s={s} />)}
      </motion.div>
    </section>
  )
}
