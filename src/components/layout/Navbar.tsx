'use client'

import { useState } from 'react'
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'

const NAV_LINKS = [
  { label: 'Services',  href: '/#services'  },
  { label: 'Portfolio', href: '/portfolio'  },
  { label: 'Blog',      href: '/blog'       },
  { label: 'About',     href: '/about'      },
  { label: 'Contact',   href: '/contact'    },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()

  const bgOpacity   = useTransform(scrollY, [0, 60], [0, 0.92])
  const borderAlpha = useTransform(scrollY, [0, 60], [0, 0.1])
  const borderColor = useMotionTemplate`rgba(255,255,255,${borderAlpha})`

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <motion.div
          className="absolute inset-0 border-b"
          style={{
            backgroundColor: `rgba(11,11,15,${bgOpacity.get()})`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            opacity: bgOpacity,
            borderColor,
          }}
        />

        <nav className="relative container-studio flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <SonicRiseMark className="w-7 h-7 text-brand-purple shrink-0" />
            <span className="font-headline font-bold text-lg tracking-tight text-text-primary group-hover:opacity-80 transition-opacity">
              SonicRise
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-text-muted hover:text-brand-purple transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="hidden md:block">
            <Link
              href="/booking"
              className="bg-brand-purple hover:opacity-90 transition-all px-6 py-2 rounded-lg font-headline font-bold text-sm tracking-wide text-white hero-glow"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : -8 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-x-0 top-16 z-40 glass-card border-t border-white/10 md:hidden ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <ul className="flex flex-col py-4">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-6 py-3 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="px-6 pt-4 pb-2">
            <Link href="/booking" className="btn-primary w-full justify-center text-sm" onClick={() => setOpen(false)}>
              Book Now
            </Link>
          </li>
        </ul>
      </motion.div>
    </>
  )
}
