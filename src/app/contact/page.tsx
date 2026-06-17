'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, CheckCircle2, Send, ChevronDown } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const CONTACT_INFO = [
  { icon: MapPin, label: 'Studio Address',  value: 'KG 11 Ave, Kigali Heights\nKigali, Rwanda' },
  { icon: Phone,  label: 'Phone',           value: '+250 788 000 000'                          },
  { icon: Mail,   label: 'Email',           value: 'hello@sonicrise.rw'                        },
  { icon: Clock,  label: 'Studio Hours',    value: 'Mon–Sat: 08:00 – 23:00\nSun: 10:00 – 20:00' },
]

const FAQS = [
  { q: 'How far in advance should I book?', a: 'We recommend booking at least 48 hours ahead. For multi-day sessions, a week is ideal.' },
  { q: 'Do you offer custom project quotes?', a: 'Yes. Reach out with your brief and we will send a detailed quote within 24 hours.' },
  { q: 'Can I visit the studio before booking?', a: 'Absolutely. Contact us to schedule a facility tour — no commitment required.' },
]

export default function ContactPage() {
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef               = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await api.contact.send({
        name:    fd.get('name')    as string,
        email:   fd.get('email')   as string,
        phone:   fd.get('phone')   as string || undefined,
        subject: fd.get('subject') as string || undefined,
        message: fd.get('message') as string,
      })
      setSent(true)
      toast.success('Message sent! We\'ll get back to you within 24 hours.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <section className="container-studio py-16 text-center md:text-left">
          <span className="font-mono text-xs tracking-widest text-brand-cyan uppercase mb-4 block">Get in Touch</span>
          <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.04em] text-text-primary mb-4">
            Let&apos;s Make<br />
            <span className="gradient-text">Something Great</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl md:mx-0 mx-auto">
            Whether you have a session to book, a project to pitch, or just a question —
            our team is always here to help.
          </p>
        </section>

        {/* ── Content grid ─────────────────────────────────────────────── */}
        <div className="container-studio grid grid-cols-1 lg:grid-cols-12 gap-10 pb-24">

          {/* ── Contact form (7/12) ─────────────────────────────────────── */}
          <div className="lg:col-span-7">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-12 text-center"
              >
                <CheckCircle2 size={52} className="text-brand-cyan mx-auto mb-5" />
                <h2 className="font-headline text-3xl font-bold text-text-primary mb-3">Message Received!</h2>
                <p className="text-text-muted mb-6">
                  We&apos;ll get back to you within 24 hours. For urgent bookings, call us directly.
                </p>
                <button onClick={() => setSent(false)} className="btn-glass px-8 py-3 text-sm">
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
                <h2 className="font-headline text-2xl font-bold text-text-primary mb-2">Send a Message</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Full Name</label>
                    <input name="name" type="text" required placeholder="Your name" className="input-studio text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Email</label>
                    <input name="email" type="email" required placeholder="you@example.com" className="input-studio text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Phone</label>
                    <input name="phone" type="tel" placeholder="+250 7XX XXX XXX" className="input-studio text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Subject</label>
                    <div className="relative">
                      <select name="subject" className="input-studio text-sm appearance-none pr-9">
                        <option value="">Select a topic</option>
                        <option>Studio Booking</option>
                        <option>Project Quote</option>
                        <option>Partnership</option>
                        <option>Facility Tour</option>
                        <option>General Enquiry</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Message</label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    placeholder="Tell us about your project, timeline, or question..."
                    className="input-studio text-sm resize-none placeholder:text-text-muted/40"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base gap-2 disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    <><Send size={16} /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── Sidebar (5/12) ──────────────────────────────────────────── */}
          <aside className="lg:col-span-5 space-y-5">

            {/* Contact info */}
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <h3 className="font-headline text-xl font-bold text-text-primary">Studio Info</h3>
              {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-brand-purple" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-text-primary text-sm whitespace-pre-line">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-[#1B1B23] to-[#0D0E15] flex flex-col items-center justify-center border-b border-white/5">
                <MapPin size={32} className="text-brand-cyan mb-2" strokeWidth={1.5} />
                <p className="font-mono text-xs text-text-muted uppercase tracking-wider">Kigali Heights</p>
                <p className="text-text-primary text-sm font-medium mt-1">KG 11 Ave, Kigali</p>
              </div>
              <div className="px-5 py-4">
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-cyan font-mono text-xs uppercase tracking-wider hover:opacity-80 transition-opacity"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>

            {/* Quick book CTA */}
            <div className="bg-gradient-to-br from-brand-purple/20 to-brand-cyan/10 border border-brand-purple/20 rounded-2xl p-6">
              <h4 className="font-headline text-lg font-bold text-text-primary mb-2">Ready to Book?</h4>
              <p className="text-text-muted text-sm mb-4">Skip the inbox and reserve your session directly.</p>
              <Link href="/booking" className="btn-primary w-full justify-center py-3 text-sm">Book a Session</Link>
            </div>
          </aside>
        </div>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="bg-[#1A1A22] py-20 border-y border-white/5">
          <div className="container-studio">
            <span className="font-mono text-xs tracking-widest text-brand-purple uppercase mb-4 block text-center">Common Questions</span>
            <h2 className="font-headline text-4xl font-bold text-text-primary mb-12 text-center">FAQ</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.q} className="glass-card p-6 rounded-xl">
                  <p className="font-mono text-xs text-brand-cyan uppercase tracking-wider mb-2">{faq.q}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
