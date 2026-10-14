'use client'

import { useState } from 'react'
import { Calendar, Check, Copy, Download, ExternalLink, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button, Modal } from '@/components/ui'

interface CalendarSyncModalProps {
  open: boolean
  onClose: () => void
  engineers?: { id: string; name: string }[]
}

export function CalendarSyncModal({ open, onClose, engineers = [] }: CalendarSyncModalProps) {
  const [selectedEngineer, setSelectedEngineer] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const feedUrl = api.bookings.calendarIcsUrl(selectedEngineer || undefined)
  const webcalUrl = feedUrl.replace(/^https?:\/\//i, 'webcal://')
  const gcalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}`

  const handleCopy = () => {
    void navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    toast.success('Calendar feed URL copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Calendar Sync (Google & Apple Calendar)">
      <div className="space-y-5">
        <p className="text-sm text-text-muted">
          Subscribe to studio sessions in your favorite calendar app. Any changes made in SonicRise
          will automatically synchronize with your Google Calendar, Apple Calendar, or Outlook.
        </p>

        {engineers.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1.5">
              Filter by Staff Engineer
            </label>
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              className="select-studio text-sm w-full"
            >
              <option value="">All studio sessions</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  Only sessions for {eng.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sync Action Buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Apple Calendar */}
          <a
            href={webcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-bold">
              <Calendar size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary flex items-center justify-between">
                Apple Calendar
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xs text-text-muted">One-click subscribe on macOS / iOS</p>
            </div>
          </a>

          {/* Google Calendar */}
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <Calendar size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary flex items-center justify-between">
                Google Calendar
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-xs text-text-muted">Subscribe via Google Calendar Web</p>
            </div>
          </a>
        </div>

        {/* Copy Feed URL Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary block">
            iCal Subscription URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={feedUrl}
              className="input-studio text-xs font-mono flex-1 text-text-muted select-all"
            />
            <Button variant="glass" onClick={handleCopy} className="shrink-0 text-xs">
              {copied ? <Check size={14} className="text-emerald-400 mr-1" /> : <Copy size={14} className="mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Direct Download */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-text-muted">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck size={14} /> RFC 5545 Compatible
          </span>
          <a
            href={feedUrl}
            download="studio-calendar.ics"
            className="flex items-center gap-1.5 text-brand-cyan hover:underline font-medium"
          >
            <Download size={13} /> Download .ics file
          </a>
        </div>
      </div>
    </Modal>
  )
}
