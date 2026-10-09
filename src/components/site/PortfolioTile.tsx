'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import type { PortfolioItem } from '@/lib/api'
import { Modal } from '../ui'

const isVideo = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url) || /youtube\.com|youtu\.be|vimeo\.com/.test(url)
const isAudio = (url: string) => /\.(mp3|wav|m4a|aac|ogg)(\?|$)/i.test(url)

/** Turns YouTube/Vimeo links into embeddable URLs. */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

export function PortfolioTile({ item }: { item: PortfolioItem }) {
  const [open, setOpen] = useState(false)
  const cover = item.thumbnailUrl ?? (!isVideo(item.mediaUrl) && !isAudio(item.mediaUrl) ? item.mediaUrl : null)
  const playable = isVideo(item.mediaUrl) || isAudio(item.mediaUrl)
  const embed = embedUrl(item.mediaUrl)

  return (
    <>
      <button onClick={() => setOpen(true)} className="group text-left glass-card rounded-xl overflow-hidden">
        <div className="relative aspect-video bg-surface-container">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded media
            <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-purple/30 to-brand-cyan/10" />
          )}
          {playable && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center"><Play size={20} className="text-white ml-0.5" /></span>
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-brand-cyan">{item.category}</p>
          <p className="font-medium mt-1">{item.title}</p>
        </div>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={item.title} wide>
        {embed ? (
          <iframe src={embed} title={item.title} className="w-full aspect-video rounded-lg" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
        ) : isVideo(item.mediaUrl) ? (
          <video src={item.mediaUrl} controls autoPlay className="w-full rounded-lg bg-black" poster={item.thumbnailUrl ?? undefined} />
        ) : isAudio(item.mediaUrl) ? (
          <div className="space-y-4">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded media
              <img src={cover} alt="" className="w-full rounded-lg" />
            )}
            <audio src={item.mediaUrl} controls autoPlay className="w-full" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded media
          <img src={item.mediaUrl} alt={item.title} className="w-full rounded-lg" />
        )}
        {item.description && <p className="text-sm text-text-muted whitespace-pre-line">{item.description}</p>}
      </Modal>
    </>
  )
}
