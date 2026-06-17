'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic2, Film, Radio, Podcast,
  CheckCircle2, HeadphonesIcon, CreditCard, Smartphone,
  CloudUpload, ChevronDown, ArrowRight, CalendarDays,
  FileText, X, User, Eye, EyeOff,
} from 'lucide-react'
import { Navbar }  from '@/components/layout/Navbar'
import { Footer }  from '@/components/layout/Footer'
import { useRegisterAndBook } from '@/lib/queries'
import { toast } from 'sonner'
import { EASE } from '@/lib/motion'

type ServiceType = 'AUDIO' | 'VIDEO' | 'LIVESTREAM' | 'PODCAST'

interface FormState {
  service:       ServiceType
  date:          string
  time:          string
  notes:         string
  paymentMethod: 'CARD' | 'MOBILE_MONEY'
  // contact info — used to auto-register the client
  name:     string
  email:    string
  phone:    string
  password: string
}

const SERVICES = [
  { key: 'AUDIO'     as ServiceType, label: 'Audio',     Icon: Mic2   },
  { key: 'VIDEO'     as ServiceType, label: 'Video',     Icon: Film   },
  { key: 'LIVESTREAM'as ServiceType, label: 'Livestream',Icon: Radio  },
  { key: 'PODCAST'   as ServiceType, label: 'Podcast',   Icon: Podcast},
]

const TIMES = [
  'Morning (09:00 – 13:00)',
  'Afternoon (14:00 – 18:00)',
  'Late Night (20:00 – 00:00)',
]

const STEPS = ['Select Service', 'Date & Time', 'Project Details', 'Reference Files', 'Your Details', 'Payment']

const FAQS = [
  {
    q: 'Can I cancel my session?',
    a: 'Full refunds are available for cancellations made 48 hours in advance.',
  },
  {
    q: 'Do you provide instruments?',
    a: 'Our suite includes a Yamaha C7 piano and a collection of vintage synths.',
  },
  {
    q: 'Post-production included?',
    a: 'Session fees cover recording. Mixing and mastering are separate services.',
  },
]

const BASE_PRICE: Record<ServiceType, number> = {
  AUDIO: 150000, VIDEO: 250000, LIVESTREAM: 100000, PODCAST: 80000,
}

const TIME_START: Record<string, string> = {
  'Morning (09:00 – 13:00)':    '09:00',
  'Afternoon (14:00 – 18:00)':  '14:00',
  'Late Night (20:00 – 00:00)': '20:00',
}

export default function BookingPage() {
  const router = useRouter()
  const { mutate: registerAndBook, isPending: submitting } = useRegisterAndBook()

  const [form, setForm] = useState<FormState>({
    service: 'AUDIO', date: '', time: TIMES[0], notes: '', paymentMethod: 'CARD',
    name: '', email: '', phone: '', password: '',
  })
  const [step, setStep] = useState(0)
  const [showPass, setShowPass] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function canAdvance(s: number): boolean {
    if (s === 1) return form.date !== ''
    if (s === 4) return form.name.trim() !== '' && form.email.trim() !== '' && form.password.trim() !== ''
    return true
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const timeStr = form.date
      ? `${form.date}T${TIME_START[form.time] ?? '09:00'}:00.000Z`
      : new Date().toISOString()

    registerAndBook(
      {
        contact: { name: form.name, email: form.email, phone: form.phone || undefined, password: form.password },
        booking: { serviceType: form.service, dateTime: timeStr, totalAmount: BASE_PRICE[form.service], notes: form.notes || undefined },
      },
      {
        onSuccess: ({ booking }) => {
          sessionStorage.setItem('sr_last_booking', JSON.stringify(booking))
          router.push('/booking/confirmation')
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Booking failed. Please try again.'),
      },
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="container-studio py-14 text-center md:text-left">
          <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-primary mb-4">
            Start Your{' '}
            <span className="text-brand-cyan">Production</span>{' '}
            Journey
          </h1>
          <p className="text-text-muted text-lg max-w-2xl md:mx-0 mx-auto">
            Secure your session in our world-class production suite. From audio engineering
            to cinematic visual captures, we bring precision to your creative craft.
          </p>
        </section>

        {/* Form + Sidebar */}
        <div className="container-studio grid grid-cols-1 lg:grid-cols-12 gap-10 pb-24">

          {/* ── Booking form (8/12) ────────────────────────────────────────── */}
          <div className="lg:col-span-8">

            {/* Step progress */}
            <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-0 shrink-0">
                  <button
                    onClick={() => setStep(i)}
                    className={`flex items-center gap-1.5 text-xs font-mono transition-colors px-1 ${
                      i === step ? 'text-brand-cyan' : i < step ? 'text-brand-purple' : 'text-text-muted'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      i === step ? 'border-brand-cyan text-brand-cyan' :
                      i < step  ? 'border-brand-purple bg-brand-purple text-white' :
                      'border-white/20 text-text-muted'
                    }`}>
                      {i < step ? '✓' : i + 1}
                    </span>
                    <span className="hidden sm:block">{s}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 h-px mx-1 transition-colors ${i < step ? 'bg-brand-purple' : 'bg-white/15'}`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="glass-card p-8 rounded-xl space-y-12">

                {/* initial={false} prevents the very first step from fading in from invisible */}
                <AnimatePresence mode="wait" initial={false}>
                  {step === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-brand-cyan bg-[#000d12] px-2 py-1 rounded">STEP 01</span>
                        <h3 className="font-headline text-2xl font-semibold text-text-primary">Select Service</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SERVICES.map(({ key, label, Icon }) => (
                          <label key={key} className="cursor-pointer group">
                            <input
                              type="radio"
                              name="service"
                              className="hidden peer"
                              checked={form.service === key}
                              onChange={() => setForm((f) => ({ ...f, service: key }))}
                            />
                            <div className="flex flex-col items-center p-5 rounded-lg border border-white/10 bg-[#1b1b23] peer-checked:border-[#d2bbff] peer-checked:bg-[#6001d1] transition-all">
                              <Icon size={32} className="mb-2 text-[#d2bbff]" strokeWidth={1.5} />
                              <span className="font-mono text-xs">{label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-brand-cyan bg-[#000d12] px-2 py-1 rounded">STEP 02</span>
                        <h3 className="font-headline text-2xl font-semibold text-text-primary">Choose Date &amp; Time</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="font-mono text-xs text-text-muted flex items-center gap-1.5">
                            <CalendarDays size={12} /> Session Date
                          </label>
                          <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                            className="input-studio"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono text-xs text-text-muted flex items-center gap-1.5">
                            <ChevronDown size={12} /> Preferred Time
                          </label>
                          <div className="relative">
                            <select
                              value={form.time}
                              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                              className="input-studio appearance-none pr-9"
                            >
                              {TIMES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-brand-cyan bg-[#000d12] px-2 py-1 rounded">STEP 03</span>
                        <h3 className="font-headline text-2xl font-semibold text-text-primary">Project Details</h3>
                      </div>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={6}
                        placeholder="Describe your vision, technical requirements, or specific moods..."
                        className="input-studio resize-none placeholder:text-text-muted/40"
                      />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-brand-cyan bg-[#000d12] px-2 py-1 rounded">STEP 04</span>
                        <h3 className="font-headline text-2xl font-semibold text-text-primary">Reference Files</h3>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="audio/*,video/*,image/*,.zip,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? [])
                          setUploadedFiles((prev) => [...prev, ...files])
                          e.target.value = ''
                        }}
                      />
                      <div
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const files = Array.from(e.dataTransfer.files)
                          setUploadedFiles((prev) => [...prev, ...files])
                        }}
                        className="border-2 border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/5 hover:border-brand-cyan/40 transition-colors cursor-pointer group"
                      >
                        <CloudUpload size={48} className="text-text-muted group-hover:text-brand-cyan transition-colors mb-4" strokeWidth={1} />
                        <p className="text-text-primary text-sm">Drag and drop your demo tracks or moodboards</p>
                        <p className="font-mono text-[10px] text-text-muted mt-1.5">Maximum file size: 500MB · or click to browse</p>
                      </div>
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2 mt-1">
                          {uploadedFiles.map((file, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/5 border border-white/10">
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText size={14} className="text-brand-cyan shrink-0" />
                                <span className="text-sm text-text-primary truncate">{file.name}</span>
                                <span className="font-mono text-[10px] text-text-muted shrink-0">
                                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                                className="ml-3 text-text-muted hover:text-red-400 transition-colors shrink-0"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-brand-cyan bg-[#000d12] px-2 py-1 rounded">STEP 05</span>
                        <h3 className="font-headline text-2xl font-semibold text-text-primary">Your Details</h3>
                      </div>
                      <p className="text-text-muted text-sm">
                        We&apos;ll create a client account so you can track your booking.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="font-mono text-xs text-text-muted flex items-center gap-1.5">
                            <User size={12} /> Full Name
                          </label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="Jane Uwimana"
                            className="input-studio"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono text-xs text-text-muted">Email Address</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            placeholder="jane@example.com"
                            className="input-studio"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono text-xs text-text-muted">Phone (optional)</label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            placeholder="+250 788 000 000"
                            className="input-studio"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono text-xs text-text-muted">Create Password</label>
                          <div className="relative">
                            <input
                              type={showPass ? 'text' : 'password'}
                              value={form.password}
                              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                              placeholder="Min. 8 characters"
                              className="input-studio pr-10"
                              required
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                            >
                              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 5 && (
                    <motion.div
                      key="step5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-brand-cyan bg-[#000d12] px-2 py-1 rounded">STEP 06</span>
                        <h3 className="font-headline text-2xl font-semibold text-text-primary">Payment</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Left: Session summary */}
                        <div className="space-y-4">
                          <div className="bg-[#1b1b23] rounded-xl p-5 space-y-3">
                            <h4 className="font-mono text-xs uppercase tracking-widest text-text-muted mb-4">Session Summary</h4>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-muted">Base Rate</span>
                              <span className="text-text-primary font-mono">
                                {BASE_PRICE[form.service].toLocaleString()} RWF
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-muted">Equipment Rental</span>
                              <span className="text-text-primary font-mono">0 RWF</span>
                            </div>
                            <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                              <span>Total</span>
                              <span className="text-brand-cyan font-mono text-lg">
                                {BASE_PRICE[form.service].toLocaleString()} RWF
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Discount Code"
                              className="input-studio text-sm py-2 flex-1"
                            />
                            <button type="button" className="btn-glass text-sm py-2 px-4">Apply</button>
                          </div>
                        </div>

                        {/* Right: Payment method selection */}
                        <div className="space-y-3">
                          <h4 className="font-mono text-xs uppercase tracking-widest text-text-muted">Payment Methods</h4>

                          {/* Card option */}
                          <label className="cursor-pointer block">
                            <input
                              type="radio"
                              name="payment"
                              className="hidden peer"
                              checked={form.paymentMethod === 'CARD'}
                              onChange={() => setForm((f) => ({ ...f, paymentMethod: 'CARD' }))}
                            />
                            <div className="p-4 rounded-xl border border-white/10 bg-[#1b1b23] peer-checked:border-brand-cyan peer-checked:bg-brand-cyan/5 transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <CreditCard size={16} className="text-text-muted" />
                                  <span className="font-mono text-xs text-text-primary">Credit / Debit Card</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* Visa */}
                                  <div className="h-5 px-1.5 rounded bg-[#1A1F71] flex items-center">
                                    <span className="font-bold text-[9px] text-white tracking-wider">VISA</span>
                                  </div>
                                  {/* Mastercard */}
                                  <div className="h-5 flex items-center gap-[-4px]">
                                    <div className="w-4 h-4 rounded-full bg-[#EB001B] opacity-90" />
                                    <div className="w-4 h-4 rounded-full bg-[#F79E1B] -ml-2 opacity-90" />
                                  </div>
                                </div>
                              </div>
                              {form.paymentMethod === 'CARD' && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="space-y-2 pt-2 border-t border-white/10"
                                >
                                  <input
                                    type="text"
                                    placeholder="Card number"
                                    className="input-studio text-sm py-2 font-mono"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input type="text" placeholder="MM / YY" className="input-studio text-sm py-2" />
                                    <input type="text" placeholder="CVV" className="input-studio text-sm py-2" />
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </label>

                          {/* Mobile Money option */}
                          <label className="cursor-pointer block">
                            <input
                              type="radio"
                              name="payment"
                              className="hidden peer"
                              checked={form.paymentMethod === 'MOBILE_MONEY'}
                              onChange={() => setForm((f) => ({ ...f, paymentMethod: 'MOBILE_MONEY' }))}
                            />
                            <div className="p-4 rounded-xl border border-white/10 bg-[#1b1b23] peer-checked:border-brand-cyan peer-checked:bg-brand-cyan/5 transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Smartphone size={16} className="text-text-muted" />
                                  <span className="font-mono text-xs text-text-primary">Mobile Money</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* MTN */}
                                  <div className="h-5 px-1.5 rounded bg-[#FFCC00] flex items-center">
                                    <span className="font-bold text-[8px] text-black tracking-wider">MTN</span>
                                  </div>
                                  {/* Airtel */}
                                  <div className="h-5 px-1.5 rounded bg-[#E40000] flex items-center">
                                    <span className="font-bold text-[8px] text-white tracking-wider">AIRTEL</span>
                                  </div>
                                </div>
                              </div>
                              {form.paymentMethod === 'MOBILE_MONEY' && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="space-y-2 pt-2 border-t border-white/10"
                                >
                                  <input
                                    type="tel"
                                    placeholder="+250 7XX XXX XXX"
                                    className="input-studio text-sm py-2 font-mono"
                                  />
                                </motion.div>
                              )}
                            </div>
                          </label>

                          <p className="text-center font-mono text-[10px] text-text-muted">
                            🔒 Secure encrypted payment processing
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className={`btn-glass text-sm px-6 py-3 ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                  >
                    Back
                  </button>
                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                      disabled={!canAdvance(step)}
                      className="btn-primary text-sm px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next Step <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary text-base px-10 py-4 disabled:opacity-60"
                    >
                      {submitting ? 'Processing…' : 'Complete Booking & Pay'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* ── Sidebar (4/12) ─────────────────────────────────────────────── */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Studio image card */}
            <div className="glass-card overflow-hidden rounded-xl">
              <div className="h-48 relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-farVLqfbVJ7p0q9sEz1DbtGkcgjwvR-zrsRB60nil7-wRH4RNbHmtbglOXLei_S4JWG2JBFxc8owfxx2TnHohF9fZzLnAbrFrJTOXniYDo86SKdPSdEJu3u6Lc1lsByMHHLpGv9Z3lWVcS26wj91fl12jnk7G13LA6O_dvRU9FEtGWI0s5iVgV6IX0iwlUdiB88xj0xpSUeH8RkJLU3L8OuS-pOoCURs_YefPGGshTmE8PQJrZodaX9bYNJamHBBVAfXvAVGVlI"
                  alt="Studio interior"
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b23] to-transparent" />
              </div>
              <div className="p-5 space-y-4">
                <h4 className="font-headline text-xl font-semibold text-brand-cyan">Studio Rules</h4>
                <ul className="space-y-3">
                  {[
                    'Arrival 15 minutes prior to session.',
                    'Maximum 3 guests per session.',
                    'Files archived for 30 days post-session.',
                  ].map((rule) => (
                    <li key={rule} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-[#d2bbff] shrink-0 mt-0.5" />
                      <span className="text-text-muted text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-[#1b1b23] rounded-xl border border-white/5 p-5 space-y-5">
              <h4 className="font-headline text-xl font-semibold text-text-primary">Booking FAQ</h4>
              {FAQS.map((faq, i) => (
                <div key={faq.q} className={i > 0 ? 'border-t border-white/5 pt-5' : ''}>
                  <p className="font-mono text-xs text-[#d2bbff] mb-1.5">{faq.q}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            {/* Support banner */}
            <div className="p-4 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center gap-4">
              <div className="p-2 bg-brand-cyan/20 rounded-full shrink-0">
                <HeadphonesIcon size={18} className="text-brand-cyan" />
              </div>
              <div>
                <p className="font-mono text-xs font-medium">Need a custom quote?</p>
                <p className="text-text-muted text-xs mt-0.5">Reach out for multi-day project rates.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
