'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, CalendarDays, Clock, Music2, Download, Share2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { ApiBooking } from '@/lib/api'

const SERVICE_LABELS: Record<string, string> = {
  AUDIO:      'Audio Recording',
  VIDEO:      'Video Production',
  PODCAST:    'Podcast Session',
  LIVESTREAM: 'Live Streaming',
}

const TIME_LABELS: Record<string, string> = {
  '09': 'Morning (09:00 – 13:00)',
  '14': 'Afternoon (14:00 – 18:00)',
  '20': 'Late Night (20:00 – 00:00)',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string): string {
  const hour = new Date(iso).getUTCHours().toString().padStart(2, '0')
  return TIME_LABELS[hour] ?? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function shortRef(id: string): string {
  return `SR-${id.slice(0, 8).toUpperCase()}`
}

export default function BookingConfirmationPage() {
  const [booking, setBooking] = useState<ApiBooking | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('sr_last_booking')
    if (raw) {
      try { setBooking(JSON.parse(raw)) } catch { /* malformed — fall through to static */ }
    }
  }, [])

  const ref          = booking ? shortRef(booking.id) : 'SR-2024-08841'
  const serviceName  = booking ? (SERVICE_LABELS[booking.serviceType] ?? booking.serviceType) : 'Audio Recording'
  const dateStr      = booking ? formatDate(booking.dateTime) : 'Nov 5, 2024'
  const timeStr      = booking ? formatTime(booking.dateTime) : 'Afternoon (14:00 – 18:00)'
  const amount       = booking ? booking.totalAmount.toLocaleString() : '150,000'
  const currency     = booking ? booking.currency : 'RWF'
  const guestName    = booking?.guestName ?? booking?.client?.name ?? null

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16">
        <div className="container-studio max-w-3xl mx-auto">

          {/* ── Success banner ──────────────────────────────────────────── */}
          <div className="text-center mb-10 pt-8">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-brand-cyan/20 blur-[20px]" />
              <div className="relative w-full h-full rounded-full bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-brand-cyan" />
              </div>
            </div>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-text-primary mb-3">
              Session Confirmed!
            </h1>
            <p className="text-text-muted text-lg max-w-md mx-auto">
              {guestName ? `Thanks, ${guestName}. Your` : 'Your'} booking has been received and confirmed.
              We&apos;ll send a reminder 24 hours before your session.
            </p>
          </div>

          {/* ── Receipt card ─────────────────────────────────────────────── */}
          <div className="glass-card rounded-2xl overflow-hidden mb-6">

            {/* Header strip */}
            <div className="bg-gradient-to-r from-brand-purple/30 to-brand-cyan/10 px-8 py-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Booking Reference</p>
                <p className="font-mono text-2xl font-bold text-text-primary tracking-widest">{ref}</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30">
                <span className="font-mono text-xs text-brand-cyan uppercase tracking-wider">Confirmed</span>
              </div>
            </div>

            {/* Details grid */}
            <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-white/8">
              {[
                { icon: Music2,       label: 'Service', value: serviceName },
                { icon: CalendarDays, label: 'Date',    value: dateStr     },
                { icon: Clock,        label: 'Time',    value: timeStr     },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-brand-purple" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-text-primary text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment summary */}
            <div className="px-8 py-6 border-b border-white/8 space-y-3">
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-4">Payment Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{serviceName}</span>
                <span className="font-mono text-text-primary">{amount} {currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Equipment Rental</span>
                <span className="font-mono text-text-primary">0 {currency}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                <span className="text-text-primary">Total Paid</span>
                <span className="font-mono text-brand-cyan text-lg">{amount} {currency}</span>
              </div>
            </div>

            {/* Studio info */}
            <div className="px-8 py-5 bg-white/[0.02]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-text-muted">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Location</p>
                  <p className="text-text-primary">Studio A — Main Recording</p>
                  <p>KG 11 Ave, Kigali Heights</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Arrival</p>
                  <p className="text-text-primary">Please arrive 15 minutes early</p>
                  <p>Max 3 guests per session</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Action buttons ───────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <button
              className="btn-glass flex-1 gap-2 py-3 justify-center text-sm"
              onClick={() => window.print()}
            >
              <Download size={15} /> Download Receipt
            </button>
            <button
              className="btn-glass flex-1 gap-2 py-3 justify-center text-sm"
              onClick={() => navigator.share?.({ title: 'SonicRise Booking', text: `Booking ${ref}`, url: window.location.href })}
            >
              <Share2 size={15} /> Share Booking
            </button>
            <Link href="/booking" className="btn-primary flex-1 gap-2 py-3 justify-center text-sm">
              Book Another Session
            </Link>
          </div>

          {/* ── What happens next ────────────────────────────────────────── */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="font-headline text-xl font-bold text-text-primary mb-6">What Happens Next</h3>
            <div className="space-y-5">
              {[
                { step: '01', title: 'Confirmation Email',    desc: 'A full receipt and session brief will be sent to your inbox within a few minutes.' },
                { step: '02', title: '24-Hour Reminder',      desc: "We'll send a reminder the day before with prep tips and directions to the studio." },
                { step: '03', title: 'Session Day',           desc: 'Arrive 15 minutes early. Our team will meet you at reception to begin setup.' },
                { step: '04', title: 'Post-Session Delivery', desc: 'Your final files will be archived and available for download for 30 days.' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center shrink-0">
                    <span className="font-mono text-[10px] font-bold text-brand-purple">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{item.title}</p>
                    <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/8 text-center">
              <p className="text-text-muted text-sm mb-3">Questions about your session?</p>
              <Link href="/contact" className="text-brand-cyan font-mono text-xs uppercase tracking-wider hover:opacity-80 transition-opacity">
                Contact Us →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
