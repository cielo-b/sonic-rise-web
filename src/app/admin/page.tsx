'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRole } from '@/hooks/useRole'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, Rocket, Database,
  CreditCard, MoreHorizontal,
  X, Download, Upload,
  Eye, Edit2, XCircle,
} from 'lucide-react'
import { useBookings, useAnalyticsMonthly, useAnalyticsServices, useAnalyticsSummary, useUpdateBookingStatus, useMediaAll } from '@/lib/queries'
import { toast } from 'sonner'
import { type ApiBooking, type ApiMediaAsset } from '@/lib/api'

/* ─── Card styles ────────────────────────────────────────────────────────── */
const CARD_STYLES = {
  bookings: {
    icon: CalendarCheck, iconBg: 'bg-[#D2BBFF]/10', iconColor: 'text-[#D2BBFF]',
    bar: 'bg-[#D2BBFF]/20 group-hover:bg-[#D2BBFF]',
  },
  active: {
    icon: Rocket, iconBg: 'bg-[#3CD7FF]/10', iconColor: 'text-[#3CD7FF]',
    bar: 'bg-[#3CD7FF]/20 group-hover:bg-[#3CD7FF]',
  },
  storage: {
    icon: Database, iconBg: 'bg-white/5', iconColor: 'text-[#E4E1EC]',
    bar: 'bg-white/10 group-hover:bg-white/30',
  },
  revenue: {
    icon: CreditCard, iconBg: 'bg-[#D2BBFF]/10', iconColor: 'text-[#D2BBFF]',
    bar: 'bg-[#7C3AED]/20 group-hover:bg-[#7C3AED]',
  },
}

const SERVICE_COLORS = ['bg-[#3CD7FF]', 'bg-[#D2BBFF]', 'bg-[#C8C5CB]', 'bg-[#C8C5CB]/40']

const SERVICE_LABELS: Record<string, string> = {
  AUDIO: 'Audio Session', VIDEO: 'Video Production', PODCAST: 'Podcast Session', LIVESTREAM: 'Live Stream',
}

const GRAD_POOL = [
  'from-[#7C3AED] to-[#3CD7FF]', 'from-[#D4AF37] to-[#D2BBFF]',
  'from-[#6001D1] to-[#3CD7FF]', 'from-[#D2BBFF] to-[#3CD7FF]',
]

function statusChip(status: string) {
  switch (status) {
    case 'CONFIRMED':  return 'chip bg-[#3CD7FF]/10 text-[#3CD7FF] border border-[#3CD7FF]/20'
    case 'PENDING':    return 'chip bg-[#C8C5CB]/10 text-[#C8C5CB] border border-[#C8C5CB]/20'
    case 'COMPLETED':  return 'chip bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20'
    case 'CANCELLED':  return 'chip bg-red-500/10 text-red-400 border border-red-500/20'
    default:           return 'chip bg-white/10 text-white/60 border border-white/10'
  }
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function fmtRWF(n: number) {
  return n >= 1000 ? `${Math.round(n / 1000)}k RWF` : `${n} RWF`
}

function toBookingRow(b: ApiBooking, i: number) {
  return {
    id:        b.id,
    client:    b.client?.name ?? 'Unknown',
    initials:  initials(b.client?.name ?? '?'),
    grad:      GRAD_POOL[i % GRAD_POOL.length],
    service:   SERVICE_LABELS[b.serviceType] ?? b.serviceType,
    date:      new Date(b.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rawStatus: b.status,
    status:    b.status.charAt(0) + b.status.slice(1).toLowerCase(),
    chip:      statusChip(b.status),
    amount:    fmtRWF(b.totalAmount),
  }
}

const SIZE_UNITS: Record<string, number> = { B: 1 / 1024 ** 2, KB: 1 / 1024, MB: 1, GB: 1024, TB: 1024 ** 2 }

/** Media sizes are stored as display strings like "12.3 MB"; sum them in MB. */
function totalSizeMB(assets: ApiMediaAsset[]) {
  return assets.reduce((sum, a) => {
    const m = /([\d.]+)\s*(B|KB|MB|GB|TB)/i.exec(a.size ?? '')
    return m ? sum + parseFloat(m[1]) * SIZE_UNITS[m[2].toUpperCase()] : sum
  }, 0)
}

function fmtSize(mb: number) {
  if (mb >= 1024 * 1024) return `${(mb / 1024 / 1024).toFixed(1)} TB`
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(1)} MB`
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function csvCell(v: string | number | null | undefined) {
  let str = v == null ? '' : String(v)
  // Neutralise spreadsheet formulas in user-supplied text (CSV injection)
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function downloadBookingsCsv(bookings: ApiBooking[], days: number | null) {
  const since = days == null ? 0 : Date.now() - days * 86_400_000
  const rows = bookings.filter((b) => new Date(b.dateTime).getTime() >= since)
  const header = ['Booking ID', 'Client', 'Email', 'Service', 'Date', 'Status', 'Amount', 'Currency']
  const lines = rows.map((b) => [
    b.id, b.client?.name ?? b.guestName ?? '', b.client?.email ?? b.guestEmail ?? '',
    SERVICE_LABELS[b.serviceType] ?? b.serviceType, new Date(b.dateTime).toISOString(),
    b.status, b.totalAmount, b.currency,
  ].map(csvCell).join(','))
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sonicrise-bookings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  return rows.length
}

/* ─── Export Report Modal ────────────────────────────────────────────────── */
const EXPORT_RANGES = [
  { days: 7,    label: 'Last 7 days'  },
  { days: 30,   label: 'Last 30 days' },
  { days: 90,   label: 'Last 90 days' },
  { days: null, label: 'All time'     },
] as const

function ExportModal({ bookings, onClose }: { bookings: ApiBooking[]; onClose: () => void }) {
  const [days, setDays] = useState<number | null>(30)

  function handleExport() {
    const count = downloadBookingsCsv(bookings, days)
    toast.success(`Exported ${count} booking${count === 1 ? '' : 's'} to CSV.`)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#292932]/50">
          <h3 className="font-headline text-[#E4E1EC] text-lg font-bold">Export Bookings (CSV)</h3>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Session Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_RANGES.map((r) => (
                <button key={r.label} onClick={() => setDays(r.days)}
                  className={`py-2.5 rounded-xl text-sm font-mono border transition-all ${
                    days === r.days ? 'border-[#D2BBFF]/40 bg-[#D2BBFF]/10 text-[#D2BBFF]' : 'border-white/10 bg-[#1B1B23] text-[#929095] hover:border-white/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost text-sm flex-1 py-2.5">Cancel</button>
            <button onClick={handleExport} className="btn-primary text-sm flex-1 py-2.5 gap-2">
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Row Action Menu ────────────────────────────────────────────────────── */
function RowActionMenu({
  client, rawStatus, onClose, onCancel,
}: {
  client: string
  rawStatus: string
  onClose: () => void
  onCancel: () => void
}) {
  const cancellable = rawStatus !== 'CANCELLED' && rawStatus !== 'COMPLETED'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute right-6 z-30 mt-1 w-44 glass-card rounded-xl overflow-hidden shadow-2xl border border-white/10"
    >
      <div className="px-4 py-2.5 border-b border-white/8">
        <p className="font-mono text-[10px] text-[#929095] truncate">{client}</p>
      </div>
      <Link
        href="/admin/bookings"
        onClick={onClose}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C8C5CB] hover:bg-white/5 transition-colors"
      >
        <Eye size={14} /> View Details
      </Link>
      <Link
        href="/admin/bookings"
        onClick={onClose}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C8C5CB] hover:bg-white/5 transition-colors"
      >
        <Edit2 size={14} /> Edit Booking
      </Link>
      {cancellable && (
        <button
          onClick={() => { onCancel(); onClose() }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
        >
          <XCircle size={14} /> Cancel
        </button>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const { can }                          = useRole()
  const [exportOpen, setExportOpen]     = useState(false)
  const [activeMenu, setActiveMenu]     = useState<string | null>(null)

  const { data: rawBookings, isLoading: bookingsLoading } = useBookings()
  const { mutate: cancelBooking } = useUpdateBookingStatus()
  const { data: monthlyData } = useAnalyticsMonthly()
  const { data: servicesData } = useAnalyticsServices()
  const { data: summaryData } = useAnalyticsSummary()
  const { data: mediaData } = useMediaAll()

  const bookings = (rawBookings ?? []).slice(0, 6).map(toBookingRow)
  const pendingCount = (rawBookings ?? []).filter((b) => b.status === 'PENDING').length
  const files = (mediaData ?? []).filter((m) => !m.isFolder && !m.isTrash)
  const recentUploads = files.slice(0, 3)

  const statCards = [
    {
      ...CARD_STYLES.bookings, label: 'Total Bookings',
      value: summaryData ? summaryData.totalBookings.toLocaleString() : '—',
      note: rawBookings ? `${pendingCount} pending` : '',
    },
    {
      ...CARD_STYLES.active, label: 'Active Bookings',
      value: summaryData ? summaryData.activeBookings.toLocaleString() : '—',
      note: 'Pending + confirmed',
    },
    {
      ...CARD_STYLES.storage, label: 'Media Storage',
      value: mediaData ? fmtSize(totalSizeMB(files)) : '—',
      note: mediaData ? `${files.length} file${files.length === 1 ? '' : 's'}` : '',
    },
    {
      ...CARD_STYLES.revenue, label: 'Total Revenue',
      value: !can('revenue:view') ? '—' : summaryData ? fmtRWF(summaryData.totalRevenue) : '—',
      note: 'Completed sessions',
    },
  ]

  // Scale monthly bar heights to the busiest month (max 140px)
  const maxBookings = Math.max(...(monthlyData ?? []).map((m) => m.bookings), 1)
  const chartBars = (monthlyData ?? []).map((m) => ({
    month: m.month,
    bookings: m.bookings,
    h: m.bookings === 0 ? 4 : Math.max(12, Math.round((m.bookings / maxBookings) * 140)),
  }))

  const serviceStats = (servicesData ?? []).map((s, i) => ({
    label: s.label,
    pct: s.pct,
    color: SERVICE_COLORS[i % SERVICE_COLORS.length],
  }))

  return (
    <div className="p-5 md:p-8 min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-[#E4E1EC] text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-[#C8C5CB] text-sm mt-1">Welcome back, Chief. Here is the studio health report.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="chip bg-[#3CD7FF]/10 text-[#3CD7FF] border border-[#3CD7FF]/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3CD7FF] animate-pulse inline-block" />
            Systems Online
          </span>
          <button onClick={() => setExportOpen(true)} className="btn-glass text-sm py-2 px-4 gap-2">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="glass-card p-6 rounded-xl relative overflow-hidden group cursor-default">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <Icon size={18} className={card.iconColor} />
                </div>
                <span className="font-mono text-xs font-medium text-[#929095]">{card.note}</span>
              </div>
              <p className="font-headline text-[#E4E1EC] text-2xl font-bold mb-1">{card.value}</p>
              <p className="text-[#C8C5CB] text-xs">{card.label}</p>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-300 ${card.bar}`} />
            </div>
          )
        })}
      </div>

      {/* ── Chart + Service popularity ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="glass-card p-6 rounded-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-headline text-[#E4E1EC] font-semibold text-base">Monthly Performance</h2>
              <p className="text-[#929095] text-xs mt-0.5 font-mono uppercase tracking-wider">Bookings · {new Date().getFullYear()}</p>
            </div>
            <button onClick={() => setExportOpen(true)} className="text-[#929095] hover:text-[#C8C5CB] transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="flex items-end gap-3 h-[140px]">
            {chartBars.map((bar) => (
              <div key={bar.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-sm bg-[#D2BBFF]/40 hover:bg-[#D2BBFF] transition-colors duration-200 cursor-pointer"
                  style={{ height: `${bar.h}px` }}
                  title={`${bar.bookings} booking${bar.bookings === 1 ? '' : 's'}`}
                />
                <span className="font-mono text-[10px] text-[#929095] uppercase tracking-wider">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <h2 className="font-headline text-[#E4E1EC] font-semibold text-base mb-1">Service Popularity</h2>
          <p className="text-[#929095] text-xs font-mono uppercase tracking-wider mb-5">By booking volume</p>
          <div className="space-y-4">
            {serviceStats.length === 0 && (
              <p className="text-[#929095] text-sm">No bookings yet.</p>
            )}
            {serviceStats.map((svc) => (
              <div key={svc.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#C8C5CB] text-sm">{svc.label}</span>
                  <span className="font-mono text-xs text-[#E4E1EC] font-medium">{svc.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1F1F27] overflow-hidden">
                  <div className={`h-full rounded-full ${svc.color}`} style={{ width: `${svc.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/bookings"
            className="mt-6 pt-4 border-t border-[#47464B]/20 flex items-center justify-center gap-1.5 text-[#3CD7FF] text-xs font-mono uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            View detailed analytics →
          </Link>
        </div>
      </div>

      {/* ── Bookings table + Recent uploads ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

        {/* Bookings table */}
        <div className="glass-card rounded-xl overflow-hidden xl:col-span-3">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#47464B]/30">
            <h2 className="font-headline text-[#E4E1EC] font-semibold text-base">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-[#3CD7FF] text-xs font-mono uppercase tracking-wider hover:underline">
              View All Sessions
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[#47464B]/20 bg-white/[0.02]">
                  {['Client Name', 'Service', 'Date', 'Amount', 'Status', ''].map((col) => (
                    <th key={col} className="px-6 py-3 text-left font-mono text-[10px] text-[#929095] uppercase tracking-widest font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookingsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#47464B]/10 last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
                          <div className="h-3 w-28 rounded bg-white/5 animate-pulse" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-3 w-24 rounded bg-white/5 animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-14 rounded bg-white/5 animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-3 w-16 rounded bg-white/5 animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-20 rounded-full bg-white/5 animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-4 rounded bg-white/5 animate-pulse" /></td>
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <CalendarCheck size={28} className="text-[#47464B] mx-auto mb-3" />
                      <p className="text-[#929095] text-sm">No bookings yet. New sessions will appear here.</p>
                    </td>
                  </tr>
                ) : bookings.map((row) => (
                  <tr key={row.id} className="border-b border-[#47464B]/10 last:border-0 hover:bg-[#1F1F27]/50 transition-colors relative">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${row.grad} flex items-center justify-center shrink-0`}>
                          <span className="font-mono text-[10px] font-bold text-white">{row.initials}</span>
                        </div>
                        <span className="text-[#E4E1EC] text-sm font-medium">{row.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#C8C5CB] text-sm">{row.service}</td>
                    <td className="px-6 py-4 font-mono text-[#929095] text-xs">{row.date}</td>
                    <td className="px-6 py-4 font-mono text-[#E4E1EC] text-xs">{row.amount}</td>
                    <td className="px-6 py-4"><span className={row.chip}>{row.status}</span></td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === row.id ? null : row.id)}
                        className="text-[#929095] hover:text-[#C8C5CB] transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      <AnimatePresence>
                        {activeMenu === row.id && (
                          <RowActionMenu
                            client={row.client}
                            rawStatus={row.rawStatus}
                            onClose={() => setActiveMenu(null)}
                            onCancel={() =>
                              toast.warning(`Cancel ${row.client}'s booking?`, {
                                action: {
                                  label: 'Yes, cancel',
                                  onClick: () => cancelBooking(
                                    { id: row.id, status: 'CANCELLED' },
                                    { onSuccess: () => toast.success('Booking cancelled.'), onError: () => toast.error('Failed to cancel.') }
                                  ),
                                },
                              })
                            }
                          />
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent uploads */}
        <div className="xl:col-span-1 space-y-4">
          <h2 className="font-headline text-[#E4E1EC] font-semibold text-base">Recent Uploads</h2>
          {recentUploads.length === 0 && (
            <p className="text-[#929095] text-sm">No uploads yet.</p>
          )}
          {recentUploads.map((file) => (
            <Link key={file.id} href="/admin/media" className="glass-card rounded-xl overflow-hidden cursor-pointer group block">
              <div className="h-20 bg-gradient-to-br from-[#1F1F27] to-[#0D0E15] flex items-center justify-center border-b border-[#47464B]/20">
                <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center group-hover:bg-[#7C3AED]/30 transition-colors">
                  <Database size={18} className="text-[#D2BBFF]" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-[#E4E1EC] text-sm font-medium truncate mb-1">{file.name}</p>
                <p className="text-[#929095] text-xs font-mono">{file.type} · {file.size}</p>
                <p className="text-[#929095] text-xs mt-1">{timeAgo(file.createdAt)}</p>
              </div>
            </Link>
          ))}
          <Link
            href="/admin/media"
            className="w-full h-20 rounded-xl border-2 border-dashed border-[#47464B]/50 hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 text-[#929095] hover:text-[#D2BBFF]"
          >
            <Upload size={18} />
            <span className="font-mono text-xs uppercase tracking-wider">Upload in Media Manager</span>
          </Link>
        </div>
      </div>

      {/* Backdrop to dismiss row action menus */}
      {activeMenu !== null && (
        <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)} />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {exportOpen && <ExportModal bookings={rawBookings ?? []} onClose={() => setExportOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
