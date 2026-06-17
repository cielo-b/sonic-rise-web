import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CTASection } from '@/components/sections/CTASection'

const TEAM = [
  {
    name: 'Jean-Luc Amahoro', role: 'Lead Engineer & Founder',
    bio:  'Two decades of cinematic audio across African and global productions.',
    initials: 'JA', grad: 'from-[#7C3AED] to-[#3CD7FF]',
  },
  {
    name: 'Marie Uwase',      role: 'Head of Visual Production',
    bio:  'Award-winning cinematographer with a passion for the Kigali aesthetic.',
    initials: 'MU', grad: 'from-[#D4AF37] to-[#D2BBFF]',
  },
  {
    name: 'Patrick Nsengimana', role: 'Studio Manager',
    bio:  'Keeps the sessions running on time and the coffee flowing.',
    initials: 'PN', grad: 'from-[#3CD7FF] to-[#6001D1]',
  },
  {
    name: 'Aline Cyuzuzo',    role: 'Sound Designer',
    bio:  'Specialist in immersive Dolby Atmos mixes for film and live events.',
    initials: 'AC', grad: 'from-[#D4AF37] to-[#7C3AED]',
  },
]

const GEAR = [
  { label: 'SSL 4000 G+',      desc: 'Main recording console' },
  { label: 'Neve 1073',        desc: 'Preamp / EQ modules'    },
  { label: 'Neumann U87 Ai',   desc: 'Large-diaphragm mic'    },
  { label: 'Focal Trio11 Be',  desc: 'Main monitors'          },
  { label: 'Pro Tools HDX',    desc: 'Primary DAW'            },
  { label: 'Yamaha C7 Grand',  desc: 'Grand piano'            },
  { label: 'ATC SCM150',       desc: 'Mastering monitors'     },
  { label: 'Dolby Atmos 7.1.4',desc: 'Immersive mix suite'    },
]

const VALUES = [
  { title: 'Precision',    desc: 'Every signal chain, mic placement, and edit decision is obsessed over.' },
  { title: 'Cinematic',    desc: 'We treat every project — audio or visual — as a cinematic experience.' },
  { title: 'Collaboration',desc: 'We are a creative partner, not just a service provider.'              },
  { title: 'African Voice', desc: 'We amplify East African creatives to a global stage.'                },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative h-[70vh] min-h-[520px] flex items-end pb-16 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9t5QBmlLCjikxI7WmRJMQLGJNo_6z9pBo4nsYfLA0oofw093a_P233hCK90ogT_9HwNdQonK-YnXHi1WfzfZbWhqyI24ZdoB4UczEj9Svm-EucafrJo4KZih8opWzQUnWyPp_XuIf5n5_L66K99HqKs-LGQ4o2XwCJRxYhu4YV2PAUZoRHKkQSbkjaxquYz_xadnnUTpxFdUkginX75Zs24y4ckHo8bEVa1nH46ho4qRFIHruoaOYHUxK_Vz8LRimRWH-ipYklrA"
              alt="SonicRise studio interior"
              fill priority
              className="object-cover opacity-50"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/30 to-transparent" />
          </div>
          <div className="relative z-10 container-studio">
            <span className="font-mono text-xs tracking-widest text-brand-purple uppercase mb-3 block">Our Story</span>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-[-0.04em] text-text-primary mb-4">
              Built for the<br /><span className="gradient-text">Bold &amp; Creative</span>
            </h1>
            <p className="text-text-muted text-lg max-w-2xl leading-relaxed">
              From a converted warehouse in Kigali to Rwanda&apos;s most sought-after production suite —
              we built SonicRise to give African creativity a world-class stage.
            </p>
          </div>
        </section>

        {/* ── Mission ──────────────────────────────────────────────────── */}
        <section className="py-20 container-studio">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="font-mono text-xs tracking-widest text-brand-cyan uppercase mb-4 block">Our Mission</span>
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
                Where Sound Meets Vision
              </h2>
              <p className="text-text-muted text-lg leading-relaxed mb-6">
                SonicRise Cinematic Studio exists to close the gap between African creative talent
                and global production standards. We believe the best music, films, and podcasts
                should come from everywhere — and we&apos;re building the infrastructure to make that happen.
              </p>
              <p className="text-text-muted leading-relaxed">
                Founded in 2018 by a group of Rwandan engineers and directors who were tired of
                sending work abroad, we built the studio we always wished existed in Kigali.
              </p>
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-farVLqfbVJ7p0q9sEz1DbtGkcgjwvR-zrsRB60nil7-wRH4RNbHmtbglOXLei_S4JWG2JBFxc8owfxx2TnHohF9fZzLnAbrFrJTOXniYDo86SKdPSdEJu3u6Lc1lsByMHHLpGv9Z3lWVcS26wj91fl12jnk7G13LA6O_dvRU9FEtGWI0s5iVgV6IX0iwlUdiB88xj0xpSUeH8RkJLU3L8OuS-pOoCURs_YefPGGshTmE8PQJrZodaX9bYNJamHBBVAfXvAVGVlI"
                alt="Studio interior"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F]/60 to-transparent" />
            </div>
          </div>
        </section>

        {/* ── Values ───────────────────────────────────────────────────── */}
        <section className="bg-[#1A1A22] py-20 border-y border-white/5">
          <div className="container-studio">
            <span className="font-mono text-xs tracking-widest text-brand-purple uppercase mb-4 block text-center">What We Stand For</span>
            <h2 className="font-headline text-4xl font-bold text-text-primary mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((v, i) => (
                <div key={v.title} className="glass-card p-8 rounded-xl group hover:border-brand-purple/40 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center mb-5">
                    <span className="font-headline font-bold text-brand-purple">{i + 1}</span>
                  </div>
                  <h3 className="font-headline text-xl font-bold text-text-primary mb-3">{v.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ─────────────────────────────────────────────────────── */}
        <section className="py-20 container-studio">
          <span className="font-mono text-xs tracking-widest text-brand-cyan uppercase mb-4 block">The Crew</span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-text-primary mb-12">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="glass-card rounded-xl overflow-hidden group">
                <div className="h-40 bg-gradient-to-br from-[#1B1B23] to-[#0D0E15] flex items-center justify-center border-b border-white/5">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.grad} flex items-center justify-center`}>
                    <span className="font-headline text-2xl font-bold text-white">{member.initials}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-headline text-lg font-bold text-text-primary">{member.name}</h3>
                  <p className="font-mono text-[10px] text-brand-cyan uppercase tracking-wider mt-0.5 mb-3">{member.role}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Facility / Gear ──────────────────────────────────────────── */}
        <section id="gear" className="bg-[#1A1A22] py-20 border-y border-white/5">
          <div className="container-studio">
            <span className="font-mono text-xs tracking-widest text-brand-gold uppercase mb-4 block">The Arsenal</span>
            <h2 className="font-headline text-4xl font-bold text-text-primary mb-4">World-Class Equipment</h2>
            <p className="text-text-muted text-lg max-w-2xl mb-12">
              Our signal chain is built around the gear trusted by Grammy-winning engineers and
              Oscar-nominated sound designers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {GEAR.map((item) => (
                <div key={item.label} className="glass-card p-5 rounded-xl border border-brand-gold/10 hover:border-brand-gold/30 transition-all group">
                  <p className="font-mono text-xs text-brand-gold uppercase tracking-wider mb-1 group-hover:text-brand-gold/90">{item.label}</p>
                  <p className="text-text-muted text-sm">{item.desc}</p>
                </div>
              ))}
              <div className="glass-card p-5 rounded-xl border border-white/5 flex items-center justify-center">
                <span className="text-text-muted font-mono text-sm">+ 40 more items</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <section className="py-20 container-studio">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
            {[
              { value: '2018',  label: 'Year Founded',       color: 'text-brand-purple' },
              { value: '500+',  label: 'Projects Delivered', color: 'text-brand-cyan'   },
              { value: '$2.4M', label: 'Client Revenue',     color: 'text-brand-gold'   },
            ].map((s) => (
              <div key={s.label}>
                <p className={`font-headline text-5xl font-bold ${s.color} mb-2`}>{s.value}</p>
                <p className="font-mono text-xs uppercase tracking-widest text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </>
  )
}
