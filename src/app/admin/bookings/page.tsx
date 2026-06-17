'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRole } from '@/hooks/useRole'
import {
  Plus, X, Users, ChevronDown, MoreVertical,
  Search, List, CalendarDays, Clock,
  AlertCircle, CheckCircle2, TrendingUp,
  ChevronLeft, ChevronRight,
  Eye, Edit2, XCircle, Trash2,
} from 'lucide-react'
import { useBookings, useUpdateBookingStatus, useCreateBooking, useUpdateBooking, useDeleteBooking, useClients } from '@/lib/queries'
import { toast } from 'sonner'
import { type ApiBooking } from '@/lib/api'

/* ─── Types ─────────────────────────────────────────────────────────────── */
type FilterTab = 'All Bookings' | 'Confirmed' | 'Pending' | 'Completed'
type ViewMode  = 'list' | 'calendar'

/* ─── Static data ────────────────────────────────────────────────────────── */
const STAT_CARDS = [
  {
    label: 'Pending Requests', value: '24', delta: '+12%',
    deltaColor: 'text-brand-cyan', icon: AlertCircle,
    iconColor: 'text-brand-cyan', iconBg: 'bg-brand-cyan/10',
    accentBorder: '',
  },
  {
    label: 'Confirmed Today', value: '08', delta: '+5.4%',
    deltaColor: 'text-[#D2BBFF]', icon: CheckCircle2,
    iconColor: 'text-[#D2BBFF]', iconBg: 'bg-[#D2BBFF]/10',
    accentBorder: '',
  },
  {
    label: 'Revenue Forecast', value: '$14,200', delta: 'Weekly',
    deltaColor: 'text-brand-cyan', icon: TrendingUp,
    iconColor: 'text-brand-cyan', iconBg: 'bg-brand-cyan/10',
    accentBorder: 'border-l-2 border-brand-cyan',
  },
]

const FILTER_TABS: FilterTab[] = ['All Bookings', 'Confirmed', 'Pending', 'Completed']
const FILTER_DOTS: Record<FilterTab, string> = {
  'All Bookings': '',
  'Confirmed':    'bg-[#D2BBFF]',
  'Pending':      'bg-brand-cyan',
  'Completed':    'bg-[#929095]',
}

const SERVICE_LABELS: Record<string, string> = {
  AUDIO: 'Audio Session', VIDEO: 'Video Production', PODCAST: 'Podcast Session', LIVESTREAM: 'Live Stream',
}
const SERVICE_ICONS: Record<string, string> = {
  AUDIO: '🎤', VIDEO: '🎬', PODCAST: '🎙', LIVESTREAM: '🎥',
}
const GRAD_POOL = [
  'from-[#000d12] to-[#3CD7FF]', 'from-[#6001D1] to-[#D2BBFF]',
  'from-[#47464B] to-[#7B797E]', 'from-[#004e5f] to-[#3CD7FF]',
  'from-[#7C3AED] to-[#3CD7FF]', 'from-[#D4AF37] to-[#D2BBFF]',
]

type BookingRow = {
  id: string; client: string; initials: string; grad: string; role: string
  service: string; serviceIcon: string; date: string; time: string
  status: string; revenue: string; room: string
}

function toBookingRow(b: ApiBooking, i: number): BookingRow {
  const name = b.guestName ?? b.client?.name ?? 'Unknown'
  const dt   = new Date(b.dateTime)
  return {
    id:          b.id,
    client:      name + (b.guestName ? ' (Guest)' : ''),
    initials:    name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
    grad:        GRAD_POOL[i % GRAD_POOL.length],
    role:        b.guestEmail ?? b.client?.email ?? '',
    service:     SERVICE_LABELS[b.serviceType] ?? b.serviceType,
    serviceIcon: SERVICE_ICONS[b.serviceType] ?? '🎵',
    date:        dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time:        dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status:      b.status.charAt(0) + b.status.slice(1).toLowerCase(),
    revenue:     `${b.totalAmount.toLocaleString()} ${b.currency}`,
    room:        'Studio A',
  }
}

function statusChip(status: string) {
  switch (status) {
    case 'Confirmed':  return 'chip bg-[#D2BBFF]/10 text-[#D2BBFF] border border-[#D2BBFF]/20'
    case 'Pending':    return 'chip bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
    case 'Completed':  return 'chip bg-[#929095]/10 text-[#929095] border border-[#929095]/20'
    case 'Cancelled':  return 'chip bg-red-400/10 text-red-400 border border-red-400/20'
    default:           return 'chip bg-[#C8C5CB]/10 text-[#C8C5CB]'
  }
}

/* ─── Toggle switch ──────────────────────────────────────────────────────── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-5 rounded-full relative transition-colors ${on ? 'bg-brand-cyan' : 'bg-[#34343d]'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  )
}

/* ─── Confirm Modal ──────────────────────────────────────────────────────── */
function ConfirmModal({
  title, message, onConfirm, onCancel, confirmText = 'Confirm', isDestructive = false
}: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText?: string; isDestructive?: boolean
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-card rounded-2xl p-8 max-w-sm w-full border border-white/10 shadow-2xl">
        <h3 className="font-headline text-xl font-bold text-[#E4E1EC] mb-2">{title}</h3>
        <p className="text-[#929095] text-sm mb-8">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm text-[#929095] hover:text-[#E4E1EC] transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${isDestructive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-brand-cyan text-[#004e5f] hover:bg-[#3CD7FF] hover:shadow-[0_0_15px_rgba(60,215,255,0.4)]'}`}>
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Row Action Menu ────────────────────────────────────────────────────── */
function RowActionMenu({
  bookingId,
  client,
  status,
  onClose,
  onAction,
  x,
  y,
}: {
  bookingId: string
  client: string
  status: string
  onClose: () => void
  onAction: (action: string, id: string, status: string) => void
  x: number
  y: number
}) {
  const actions = [
    { icon: Eye,         label: 'View Details',   color: 'text-[#C8C5CB]', onClick: () => { onAction('view', bookingId, status); onClose() } },
    { icon: Edit2,       label: 'Edit Booking',   color: 'text-[#C8C5CB]', onClick: () => { onAction('edit', bookingId, status); onClose() } },
    ...(status === 'Pending'
      ? [{ icon: CheckCircle2, label: 'Mark Confirmed', color: 'text-[#D2BBFF]', onClick: () => { onAction('confirm', bookingId, 'CONFIRMED'); onClose() } }]
      : []),
    ...(status === 'Cancelled'
      ? [
          { icon: CheckCircle2, label: 'Make Active', color: 'text-[#D2BBFF]', onClick: () => { onAction('activate', bookingId, 'PENDING'); onClose() } },
          { icon: Trash2, label: 'Delete Permanently', color: 'text-red-500', onClick: () => { onAction('delete', bookingId, 'DELETED'); onClose() } }
        ]
      : [
          { icon: XCircle,     label: 'Cancel Booking', color: 'text-red-400',   onClick: () => { onAction('cancel', bookingId, 'CANCELLED'); onClose() } }
        ]),
  ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -4 }}
        transition={{ duration: 0.15 }}
        style={{ top: y + 4, left: x - 176 }}
        className="fixed z-[9999] w-44 glass-card rounded-xl overflow-hidden shadow-2xl border border-white/10"
      >
      <div className="px-4 py-2.5 border-b border-white/10">
        <p className="font-mono text-[10px] text-[#929095] truncate">{client}</p>
      </div>
      {actions.map(({ icon: Icon, label, color, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${color} hover:bg-white/5 transition-colors`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
      </motion.div>
    </>
  )
}

/* ─── Calendar View ──────────────────────────────────────────────────────── */
function CalendarView({ bookings }: { bookings: BookingRow[] }) {
  const [year, setYear]   = useState(2024)
  const [month, setMonth] = useState(9) // 0-indexed; 9 = October

  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const WEEK_DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const bookingsByDay: Record<number, BookingRow[]> = {}
  bookings.forEach((b) => {
    const parts  = b.date.split(' ') // ["Oct", "24,", "2024"]
    const bMonth = MONTH_SHORT.indexOf(parts[0])
    const bDay   = parseInt(parts[1].replace(',', ''))
    const bYear  = parseInt(parts[2])
    if (bMonth === month && bYear === year) {
      if (!bookingsByDay[bDay]) bookingsByDay[bDay] = []
      bookingsByDay[bDay].push(b)
    }
  })

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="p-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-headline text-base font-semibold text-[#E4E1EC]">
          {MONTH_FULL[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[#929095] hover:text-[#E4E1EC] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[#929095] hover:text-[#E4E1EC] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center font-mono text-[10px] text-[#929095] uppercase tracking-wider py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const dayBookings = day ? (bookingsByDay[day] ?? []) : []
          return (
            <div
              key={i}
              className={`min-h-[80px] p-2 rounded-lg transition-colors ${
                day
                  ? `bg-[#1B1B23] border ${dayBookings.length > 0 ? 'border-white/10 hover:border-[#D2BBFF]/30' : 'border-white/5'}`
                  : ''
              }`}
            >
              {day !== null && (
                <>
                  <span
                    className={`font-mono text-xs leading-none ${
                      dayBookings.length > 0 ? 'text-[#E4E1EC] font-bold' : 'text-[#47464B]'
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1.5 space-y-0.5">
                    {dayBookings.slice(0, 2).map((b: BookingRow, j: number) => (
                      <div
                        key={j}
                        className={`text-[9px] font-mono truncate px-1.5 py-0.5 rounded leading-tight ${
                          b.status === 'Confirmed' ? 'bg-[#D2BBFF]/15 text-[#D2BBFF]'
                          : b.status === 'Pending' ? 'bg-[#3CD7FF]/15 text-[#3CD7FF]'
                          :                          'bg-[#929095]/15 text-[#929095]'
                        }`}
                      >
                        {b.client.split(' ')[0]}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <p className="text-[9px] font-mono text-[#929095] px-1">
                        +{dayBookings.length - 2} more
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/8">
        {[
          { label: 'Confirmed', dot: 'bg-[#D2BBFF]' },
          { label: 'Pending',   dot: 'bg-[#3CD7FF]'  },
          { label: 'Completed', dot: 'bg-[#929095]'  },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${item.dot}`} />
            <span className="font-mono text-[10px] text-[#929095]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── New Booking Modal ──────────────────────────────────────────────────── */
const SERVICE_TYPE_MAP: Record<string, string> = {
  'Audio Session': 'AUDIO',
  'Video Production': 'VIDEO',
  'Podcast Session': 'PODCAST',
  'Live Stream': 'LIVESTREAM'
}

function BookingModal({ 
  mode = 'create',
  initialData,
  onClose 
}: { 
  mode?: 'create' | 'edit' | 'view';
  initialData?: ApiBooking;
  onClose: () => void 
}) {
  const { role } = useRole()
  const isSuperAdmin = role === 'Super Admin'
  const { data: clients = [] } = useClients()
  const { mutate: createBooking, isPending: isCreating, error: createError } = useCreateBooking()
  const { mutate: updateBooking, isPending: isUpdating, error: updateError } = useUpdateBooking()
  
  const isPending = isCreating || isUpdating
  const error = createError || updateError
  
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  
  const initialDateObj = initialData?.dateTime ? new Date(initialData.dateTime) : null
  const initialDateStr = initialDateObj ? initialDateObj.toISOString().split('T')[0] : ''
  const initialTimeStr = initialDateObj ? initialDateObj.toTimeString().slice(0, 5) : '10:00'
  
  const [clientSearch, setClientSearch]       = useState(initialData?.guestName ? `${initialData.guestName} (${initialData.guestEmail})` : initialData?.client?.name || '')
  const [selectedClientId, setSelectedClientId] = useState(initialData?.guestName ? 'guest' : initialData?.client?.id || '')
  const [service, setService]   = useState(
    Object.keys(SERVICE_TYPE_MAP).find(k => SERVICE_TYPE_MAP[k] === initialData?.serviceType) || 'Audio Session'
  )
  const [date, setDate]         = useState(initialDateStr)
  const [time, setTime]         = useState(initialTimeStr)
  const [amount, setAmount]     = useState(initialData?.totalAmount?.toString() || '')
  const [notes, setNotes]       = useState(initialData?.notes || '')
  const [done, setDone]         = useState(false)
  const [guestData, setGuestData] = useState<{name: string, email: string} | null>(null)

  const filteredClients = clients.filter(
    (c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
           c.email.toLowerCase().includes(clientSearch.toLowerCase())
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isView) return
    
    const dateTime = date ? `${date}T${time}:00.000Z` : new Date().toISOString()
    
    if (mode === 'create') {
      if (isSuperAdmin && !selectedClientId) return
      createBooking(
        {
          clientId: selectedClientId === 'guest' ? undefined : selectedClientId,
          guestName: guestData?.name,
          guestEmail: guestData?.email,
          serviceType: SERVICE_TYPE_MAP[service] ?? 'AUDIO',
          dateTime,
          totalAmount: parseFloat(amount) || 0,
          notes: notes || undefined,
        },
        {
          onSuccess: () => { setDone(true); toast.success('Booking created.') },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create booking.'),
        },
      )
    } else if (mode === 'edit' && initialData) {
      updateBooking(
        {
          id: initialData.id,
          data: {
            serviceType: SERVICE_TYPE_MAP[service] ?? 'AUDIO',
            dateTime,
            totalAmount: parseFloat(amount) || 0,
            notes: notes || undefined,
            ...(selectedClientId === 'guest' && guestData ? {
              guestName: guestData.name,
              guestEmail: guestData.email,
            } : {})
          }
        },
        {
          onSuccess: () => { setDone(true); toast.success('Booking updated.') },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update booking.'),
        },
      )
    }
  }

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card rounded-2xl p-10 text-center max-w-sm w-full">
        <CheckCircle2 size={44} className="text-brand-cyan mx-auto mb-4" />
        <h3 className="font-headline text-xl font-bold text-[#E4E1EC] mb-2">
          {mode === 'create' ? 'Booking Created' : 'Booking Updated'}
        </h3>
        <p className="text-[#929095] text-sm mb-6">
          {mode === 'create' ? 'The session has been added to the bookings list.' : 'The session details have been successfully updated.'}
        </p>
        <button onClick={onClose} className="btn-primary text-sm px-8 py-2.5">Close</button>
      </motion.div>
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Modal header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-start justify-between bg-[#292932]/50">
          <div>
            <h3 className="font-headline text-[#E4E1EC] text-xl font-bold">
              {mode === 'create' ? 'New Booking' : mode === 'edit' ? 'Edit Booking' : 'Booking Details'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors mt-1">
            <X size={18} />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Form */}
          <form id="booking-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client search */}
              {isSuperAdmin ? (
                <div className="md:col-span-2 space-y-1.5 relative">
                  <label className="font-mono text-xs text-[#929095] uppercase tracking-wider">Select Client</label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929095]" />
                    <input type="text" value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setSelectedClientId('') }} placeholder="Search registered clients…" className="input-studio pl-9 text-sm w-full" disabled={isView || mode === 'edit'} />
                  </div>
                  {clientSearch && !selectedClientId && filteredClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#292932] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-40 overflow-y-auto">
                      {filteredClients.map((c) => (
                        <button key={c.id} type="button" onClick={() => { setSelectedClientId(c.id); setClientSearch(c.name) }}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                          <span className="text-[#E4E1EC] text-sm block">{c.name}</span>
                          <span className="text-[#929095] text-xs block">{c.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {clientSearch && !selectedClientId && filteredClients.length === 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#292932] border border-white/10 rounded-xl shadow-2xl p-4">
                      <p className="text-brand-cyan text-xs mb-3 font-mono tracking-wider flex items-center gap-1">
                        <AlertCircle size={12} /> Client not found. Book as guest?
                      </p>
                      <input type="text" placeholder="Guest Name" className="input-studio text-sm w-full mb-2" id="guest-name" />
                      <input type="email" placeholder="Guest Email" className="input-studio text-sm w-full mb-3" id="guest-email" defaultValue={clientSearch.includes('@') ? clientSearch : ''} />
                      <button type="button" className="btn-primary w-full py-2 text-sm" onClick={() => {
                         const name = (document.getElementById('guest-name') as HTMLInputElement).value;
                         const email = (document.getElementById('guest-email') as HTMLInputElement).value;
                         if (name && email) {
                            setGuestData({ name, email });
                            setClientSearch(`${name} (${email})`);
                            setSelectedClientId('guest');
                         }
                      }}>Use Guest Details</button>
                    </div>
                  )}
                  
                  {selectedClientId === 'guest' && mode === 'edit' && (
                    <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      <p className="text-[#929095] text-xs font-mono uppercase">Guest Details</p>
                      <input type="text" value={guestData?.name || initialData?.guestName || ''} onChange={(e) => setGuestData({ name: e.target.value, email: guestData?.email || initialData?.guestEmail || '' })} placeholder="Guest Name" className="input-studio text-sm w-full" />
                      <input type="email" value={guestData?.email || initialData?.guestEmail || ''} onChange={(e) => setGuestData({ name: guestData?.name || initialData?.guestName || '', email: e.target.value })} placeholder="Guest Email" className="input-studio text-sm w-full" />
                    </div>
                  )}

                  {selectedClientId && mode !== 'edit' && <p className="text-brand-cyan text-xs font-mono mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> {selectedClientId === 'guest' ? 'Guest selected' : 'Client selected'}</p>}
                </div>
              ) : (
                <div className="md:col-span-2 space-y-1.5 relative">
                  <label className="font-mono text-xs text-[#929095] uppercase tracking-wider">Booking For</label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929095]" />
                    <input type="text" value="My Profile (Client)" readOnly className="input-studio pl-9 text-sm w-full opacity-60 cursor-not-allowed" />
                  </div>
                </div>
              )}


              {/* Service */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-[#929095] uppercase tracking-wider">Service Category</label>
                <div className="relative">
                  <select value={service} onChange={(e) => setService(e.target.value)} className="input-studio appearance-none pr-9 text-sm cursor-pointer w-full">
                    {Object.keys(SERVICE_TYPE_MAP).map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] pointer-events-none" />
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-[#929095] uppercase tracking-wider">Total Amount (RWF)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150000" className="input-studio text-sm w-full" required />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-[#929095] uppercase tracking-wider">Session Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-studio text-sm w-full" required />
              </div>

              {/* Time */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-[#929095] uppercase tracking-wider">Start Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-studio text-sm w-full" />
              </div>

              {/* Notes */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="font-mono text-xs text-[#929095] uppercase tracking-wider">Session Notes</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Briefly describe the goal of this session…" className="input-studio resize-none text-sm w-full placeholder:text-[#929095]/50" />
              </div>

              {error && (
                <p className="md:col-span-2 text-red-400 text-xs font-mono">{(error as Error).message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Modal footer */}
        <div className="px-8 py-5 border-t border-white/10 bg-[#292932]/50 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] text-sm font-medium transition-colors">
            {isView ? 'Close' : 'Cancel'}
          </button>
          {!isView && (
            <button type="submit" form="booking-form" disabled={isPending || (mode === 'create' && isSuperAdmin && !selectedClientId)} className="btn-primary text-sm gap-2 py-2.5 px-6 disabled:opacity-60">
              {isPending ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Booking'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function BookingsPage() {
  const { can }                          = useRole()
  const [modalState, setModalState]      = useState<{ type: 'create' | 'edit' | 'view', booking?: ApiBooking } | null>(null)
  const [confirmState, setConfirmState]  = useState<{ action: string, id: string, status: string } | null>(null)
  const [activeFilter, setActiveFilter]  = useState<FilterTab>('All Bookings')
  const [viewMode, setViewMode]         = useState<ViewMode>('list')
  const [search, setSearch]             = useState('')
  const [activeMenu, setActiveMenu]     = useState<{ id: string, x: number, y: number } | null>(null)
  const [currentPage, setCurrentPage]   = useState(1)

  const { data: rawBookings, isLoading: loading } = useBookings()
  const { mutate: changeStatus } = useUpdateBookingStatus()
  const { mutate: deleteBooking } = useDeleteBooking()

  const bookings: BookingRow[] = (rawBookings ?? []).map(toBookingRow)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('sr_open_new_booking') === '1') {
      sessionStorage.removeItem('sr_open_new_booking')
      setModalState({ type: 'create' })
    }
  }, [])

  const handleAction = (action: string, id: string, status: string) => {
    if (action === 'view' || action === 'edit') {
      const booking = rawBookings?.find(b => b.id === id)
      if (booking) setModalState({ type: action, booking })
    } else if (action === 'confirm' || action === 'cancel' || action === 'activate' || action === 'delete') {
      setConfirmState({ action, id, status })
    }
  }

  const handleStatusChange = (id: string, status: string) => {
    const label = status === 'DELETED' ? 'deleted' : status === 'CONFIRMED' ? 'confirmed' : status === 'CANCELLED' ? 'cancelled' : 'updated'
    if (status === 'DELETED') {
      deleteBooking(id, {
        onSuccess: () => toast.success('Booking deleted.'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete booking.'),
      })
    } else {
      changeStatus({ id, status }, {
        onSuccess: () => toast.success(`Booking ${label}.`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update booking.'),
      })
    }
    setConfirmState(null)
  }

  const filtered = bookings.filter((b) => {
    const matchesFilter =
      activeFilter === 'All Bookings' || b.status === activeFilter
    const matchesSearch =
      b.client.toLowerCase().includes(search.toLowerCase()) ||
      b.service.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const liveRevenue = (rawBookings ?? []).reduce((sum, b) => b.status !== 'CANCELLED' ? sum + b.totalAmount : sum, 0)

  return (
    <div className="p-5 md:p-8 min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-[#E4E1EC] text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-[#C8C5CB] text-sm mt-1">Manage upcoming sessions and track revenue.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex bg-[#1B1B23] border border-white/8 rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                viewMode === 'list' ? 'bg-[#2D2D38] text-[#E4E1EC]' : 'text-[#929095] hover:text-[#C8C5CB]'
              }`}
            >
              <List size={14} /> List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                viewMode === 'calendar' ? 'bg-[#2D2D38] text-[#E4E1EC]' : 'text-[#929095] hover:text-[#C8C5CB]'
              }`}
            >
              <CalendarDays size={14} /> Calendar
            </button>
          </div>
          {can('bookings:write') && (
            <button
              onClick={() => setModalState({ type: 'create' })}
              className="btn-primary text-sm gap-2 py-2.5 px-5"
            >
              <Plus size={15} /> New Booking
            </button>
          )}
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          const liveValue =
            card.label === 'Pending Requests'
              ? bookings.filter((b) => b.status === 'Pending').length.toString()
              : card.label === 'Confirmed Today'
                ? bookings.filter((b) => b.status === 'Confirmed').length.toString().padStart(2, '0')
                : `${liveRevenue.toLocaleString()} RWF`
          return (
            <div key={card.label} className={`glass-card p-5 rounded-xl ${card.accentBorder}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <Icon size={17} className={card.iconColor} />
                </div>
                <span className={`font-mono text-xs font-medium ${card.deltaColor}`}>{card.delta}</span>
              </div>
              <p className="font-mono text-[10px] text-[#929095] uppercase tracking-widest mb-1">{card.label}</p>
              <p className="font-headline text-2xl font-bold text-[#E4E1EC]">{loading ? '—' : liveValue}</p>
            </div>
          )
        })}
      </div>

      {/* ── Filter + Search + Content ────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden flex-1 flex flex-col">

        {/* Filter bar */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-mono transition-all border ${
                  activeFilter === tab
                    ? 'bg-[#34343d] text-[#E4E1EC] border-white/15'
                    : 'bg-transparent text-[#929095] border-white/8 hover:bg-white/5 hover:text-[#C8C5CB]'
                }`}
              >
                {FILTER_DOTS[tab] && (
                  <span className={`w-2 h-2 rounded-full ${FILTER_DOTS[tab]}`} />
                )}
                {tab}
              </button>
            ))}
          </div>
          <div className="relative max-w-sm flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929095]" />
            <input
              type="text"
              placeholder="Search clients or sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-studio pl-9 text-sm py-2 w-full"
            />
          </div>
        </div>

        {/* ── Content: List vs Calendar ─────────────────────────────────── */}
        {viewMode === 'list' ? (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#47464B]/20 bg-[#0D0E15]/50 sticky top-0 backdrop-blur-md">
                    {['Client', 'Service Type', 'Date / Time', 'Status',
                       ...(can('revenue:view')   ? ['Revenue'] : []),
                       ...(can('bookings:write') ? ['Actions'] : []),
                    ].map((col) => (
                      <th
                        key={col}
                        className={`px-6 py-3 font-mono text-[10px] text-[#929095] uppercase tracking-widest font-medium ${
                          col === 'Revenue' || col === 'Actions' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {paginated.map((row, i) => (
                      <motion.tr
                        key={row.client + row.date}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        className="border-b border-[#47464B]/10 last:border-0 hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Client */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${row.grad} flex items-center justify-center flex-shrink-0`}>
                              <span className="font-mono text-[11px] font-bold text-white">{row.initials}</span>
                            </div>
                            <div>
                              <p className="text-[#E4E1EC] text-sm font-medium">{row.client}</p>
                              <p className="text-[#929095] text-[11px]">{row.role}</p>
                            </div>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{row.serviceIcon}</span>
                            <span className="text-[#C8C5CB] text-sm">{row.service}</span>
                          </div>
                        </td>

                        {/* Date / Time */}
                        <td className="px-6 py-4">
                          <p className="text-[#E4E1EC] text-sm">{row.date}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="text-[#929095]" />
                            <p className="text-[#929095] text-[11px] font-mono">{row.time}</p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={statusChip(row.status)}>{row.status}</span>
                        </td>

                        {/* Revenue */}
                        {can('revenue:view') && (
                          <td className="px-6 py-4 text-right">
                            <span className="font-mono text-[#E4E1EC] text-sm font-medium">{row.revenue}</span>
                          </td>
                        )}

                        {/* Actions */}
                        {can('bookings:write') && (
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block">
                              <button
                                onClick={(e) => {
                                  if (activeMenu?.id === row.id) {
                                    setActiveMenu(null)
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setActiveMenu({ id: row.id, x: rect.right, y: rect.bottom })
                                  }
                                }}
                                className="text-[#929095] hover:text-[#C8C5CB] transition-colors p-1"
                              >
                                <MoreVertical size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="py-16 text-center text-[#929095] font-mono text-sm uppercase tracking-wider">
                  No {activeFilter === 'All Bookings' ? '' : activeFilter.toLowerCase()} bookings found
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-[#1B1B23] border-t border-white/8 flex items-center justify-between">
              <p className="text-[#929095] font-mono text-xs">
                Showing {paginated.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} bookings
              </p>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 text-[#929095] transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const n = idx + 1
                  return (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      className={`w-8 h-8 rounded font-mono text-xs font-bold transition-colors ${
                        n === currentPage ? 'bg-[#D2BBFF] text-[#3F008E]' : 'text-[#929095] hover:bg-white/5'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded hover:bg-white/5 disabled:opacity-50 text-[#929095] transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <CalendarView bookings={filtered} />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalState && (
          <BookingModal 
            mode={modalState.type} 
            initialData={modalState.booking} 
            onClose={() => setModalState(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmState && (
          <ConfirmModal
            title={
              confirmState.action === 'confirm' ? 'Confirm Booking' : 
              confirmState.action === 'cancel' ? 'Cancel Booking' :
              confirmState.action === 'activate' ? 'Make Active' : 'Delete Permanently'
            }
            message={
              confirmState.action === 'confirm' ? 'Are you sure you want to mark this booking as confirmed?' :
              confirmState.action === 'cancel' ? 'Are you sure you want to cancel this booking? This action cannot be undone.' :
              confirmState.action === 'activate' ? 'Are you sure you want to make this booking active again?' :
              'Are you sure you want to permanently delete this booking? This action cannot be undone.'
            }
            isDestructive={confirmState.action === 'cancel' || confirmState.action === 'delete'}
            confirmText={
              confirmState.action === 'confirm' ? 'Yes, Confirm' :
              confirmState.action === 'cancel' ? 'Yes, Cancel' :
              confirmState.action === 'activate' ? 'Yes, Make Active' :
              'Yes, Delete'
            }
            onConfirm={() => handleStatusChange(confirmState.id, confirmState.status)}
            onCancel={() => setConfirmState(null)}
          />
        )}
      </AnimatePresence>

      {/* Row Action Menu via Portal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeMenu && (() => {
            const row = bookings.find(b => b.id === activeMenu.id)
            if (!row) return null
            return (
              <RowActionMenu
                key={row.id}
                bookingId={row.id}
                client={row.client}
                status={row.status}
                onClose={() => setActiveMenu(null)}
                onAction={handleAction}
                x={activeMenu.x}
                y={activeMenu.y}
              />
            )
          })()}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
