import Link from 'next/link'
import { Globe, Tv2, ExternalLink, MessageCircle } from 'lucide-react'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'

const STUDIO_LINKS = [
  { label: 'Our Story',    href: '/about'      },
  { label: 'Our Services', href: '/#services'  },
  { label: 'Case Studies', href: '/portfolio'  },
  { label: 'The Facility', href: '/about#gear' },
  { label: 'Careers',      href: '/careers'    },
  { label: 'Press Kit',    href: '#'           },
]

const COMPANY_LINKS = [
  { label: 'About Us',       href: '/about'   },
  { label: 'Contact',        href: '/contact' },
  { label: 'Privacy Policy', href: '#'        },
  { label: 'Terms of Service', href: '#'      },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', Icon: Globe        },
  { label: 'Vimeo',     href: '#', Icon: Tv2          },
  { label: 'LinkedIn',  href: '#', Icon: ExternalLink },
  { label: 'WhatsApp',  href: '#', Icon: MessageCircle },
]

export function Footer() {
  return (
    <footer className="bg-[#0D0E15] border-t border-white/5">
      <div className="container-studio py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <SonicRiseMark className="w-7 h-7 text-brand-purple" />
              <span className="font-headline font-bold text-lg tracking-tight text-text-primary">SonicRise</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed mb-6">
              Digital craftsmanship for the modern creator. Production suite based in the heart of Kigali.
            </p>
            {/* Social icon buttons */}
            <div className="flex gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-lg glass-card flex items-center justify-center text-text-muted hover:text-brand-cyan transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Studio */}
          <div>
            <h4 className="font-headline font-bold text-text-primary mb-5 text-sm">Studio</h4>
            <ul className="flex flex-col gap-3">
              {STUDIO_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-text-muted text-sm hover:text-brand-purple transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-headline font-bold text-text-primary mb-5 text-sm">Company</h4>
            <ul className="flex flex-col gap-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-text-muted text-sm hover:text-brand-purple transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact CTA */}
          <div>
            <h4 className="font-headline font-bold text-text-primary mb-5 text-sm">Stay Connected</h4>
            <p className="text-text-muted text-sm mb-4 leading-relaxed">
              Ready to start your next project? Reach out or book a session directly.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-brand-cyan font-mono text-xs uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              Contact Us →
            </Link>
            <div className="mt-5 pt-5 border-t border-white/5">
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1">Location</p>
              <p className="text-text-muted text-sm">Kigali, Rwanda.</p>
              <p className="text-text-muted text-xs mt-0.5">Global Service.</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
            © 2024 SonicRise Studios. All Rights Reserved.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand-purple">
            Digital Craftsmanship &amp; Vision
          </p>
        </div>
      </div>
    </footer>
  )
}
