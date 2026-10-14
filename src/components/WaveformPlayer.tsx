'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Repeat } from 'lucide-react'
import { timecode } from '@/lib/format'

interface WaveformPlayerProps {
  url: string
  audioRef: React.RefObject<HTMLAudioElement | null>
  commentMarkers?: { id: string; atSeconds: number; body: string; authorName?: string }[]
  onSeek?: (seconds: number) => void
}

export function WaveformPlayer({ url, audioRef, commentMarkers = [], onSeek }: WaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const [peaks, setPeaks] = useState<number[]>([])
  const [activeTooltip, setActiveTooltip] = useState<{ text: string; x: number } | null>(null)

  // Generate or decode waveform peaks
  useEffect(() => {
    let cancelled = false

    async function loadWaveform() {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        if (cancelled) return

        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new AudioContextClass()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        if (cancelled) return

        const rawData = audioBuffer.getChannelData(0)
        const samples = 140 // Number of bars in waveform
        const blockSize = Math.floor(rawData.length / samples)
        const extractedPeaks: number[] = []

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j] || 0)
          }
          extractedPeaks.push(sum / blockSize)
        }

        // Normalize peaks between 0.15 and 0.95
        const max = Math.max(...extractedPeaks, 0.001)
        const normalized = extractedPeaks.map((p) => Math.max(0.15, Math.min(0.95, p / max)))
        setPeaks(normalized)
        audioCtx.close()
      } catch {
        // Fallback: Generate pseudo-realistic waveform pattern
        const pseudoPeaks: number[] = []
        for (let i = 0; i < 140; i++) {
          const v = Math.sin(i * 0.1) * 0.35 + Math.cos(i * 0.05) * 0.25 + Math.random() * 0.3 + 0.15
          pseudoPeaks.push(Math.max(0.18, Math.min(0.92, v)))
        }
        setPeaks(pseudoPeaks)
      }
    }

    void loadWaveform()
    return () => {
      cancelled = true
    }
  }, [url])

  // Attach audio element event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0)
      setCurrentTime(audio.currentTime || 0)
    }
    const onEnded = () => {
      setIsPlaying(false)
      if (!isLooping) setCurrentTime(0)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    if (audio.duration) {
      setDuration(audio.duration)
      setCurrentTime(audio.currentTime)
    }

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [audioRef, isLooping])

  // Draw waveform canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const barCount = peaks.length || 120
    const totalGap = (barCount - 1) * 2
    const barWidth = Math.max(2, (rect.width - totalGap) / barCount)
    const progress = duration > 0 ? currentTime / duration : 0
    const progressX = progress * rect.width

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + 2)
      const heightFrac = peaks[i] || (0.2 + 0.6 * Math.abs(Math.sin(i * 0.15)))
      const barHeight = Math.max(6, heightFrac * (rect.height - 12))
      const y = (rect.height - barHeight) / 2

      ctx.beginPath()
      const radius = 1.5
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + barWidth - radius, y)
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
      ctx.lineTo(x + barWidth, y + barHeight - radius)
      ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight)
      ctx.lineTo(x + radius, y + barHeight)
      ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()

      if (x + barWidth <= progressX) {
        // Played gradient: bright cyan to purple
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight)
        grad.addColorStop(0, '#06b6d4')
        grad.addColorStop(1, '#a855f7')
        ctx.fillStyle = grad
      } else {
        // Unplayed: translucent slate
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
      }
      ctx.fill()
    }

    // Playhead line
    if (progressX > 0 && progressX < rect.width) {
      ctx.beginPath()
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = 8
      ctx.moveTo(progressX, 2)
      ctx.lineTo(progressX, rect.height - 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Hover line
    if (hoverX !== null) {
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.moveTo(hoverX, 0)
      ctx.lineTo(hoverX, rect.height)
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.restore()
  }, [peaks, currentTime, duration, hoverX])

  useEffect(() => {
    drawWaveform()
  }, [drawWaveform])

  const seekTo = (seconds: number) => {
    if (!audioRef.current) return
    const clamped = Math.max(0, Math.min(seconds, duration))
    audioRef.current.currentTime = clamped
    setCurrentTime(clamped)
    onSeek?.(clamped)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || duration <= 0) return
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const targetTime = (clickX / rect.width) * duration
    seekTo(targetTime)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || duration <= 0) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    setHoverX(x)
    setHoverTime((x / rect.width) * duration)
  }

  const handleMouseLeave = () => {
    setHoverX(null)
    setHoverTime(null)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      void audio.play()
    }
  }

  const skip = (delta: number) => {
    if (audioRef.current) {
      seekTo(currentTime + delta)
    }
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    setIsMuted(newVol === 0)
    if (audioRef.current) {
      audioRef.current.volume = newVol
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    if (isMuted) {
      const restored = volume || 0.8
      audioRef.current.volume = restored
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const handleRateChange = () => {
    const rates = [0.75, 1, 1.25, 1.5]
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length
    const nextRate = rates[nextIdx]
    setPlaybackRate(nextRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }

  const toggleLoop = () => {
    const next = !isLooping
    setIsLooping(next)
    if (audioRef.current) {
      audioRef.current.loop = next
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface-lowest/70 backdrop-blur-md p-4 space-y-4 shadow-xl">
      {/* Hidden audio element synced with controls */}
      <audio ref={audioRef as React.RefObject<HTMLAudioElement>} src={url} preload="metadata" />

      {/* Waveform Canvas Container */}
      <div ref={containerRef} className="relative w-full select-none cursor-pointer group">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-24 rounded-lg bg-black/40 hover:bg-black/50 transition-colors"
        />

        {/* Hover Timecode Tooltip */}
        {hoverX !== null && hoverTime !== null && (
          <div
            className="absolute top-1 -translate-x-1/2 pointer-events-none rounded bg-brand-cyan/90 px-1.5 py-0.5 text-[10px] font-mono font-bold text-black shadow-lg"
            style={{ left: hoverX }}
          >
            {timecode(hoverTime)}
          </div>
        )}

        {/* Comment Pins directly on waveform */}
        {duration > 0 &&
          commentMarkers.map((marker) => {
            const leftPercent = Math.min(100, Math.max(0, (marker.atSeconds / duration) * 100))
            return (
              <div
                key={marker.id}
                className="absolute top-0 bottom-0 flex flex-col items-center group/pin z-10"
                style={{ left: `${leftPercent}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  seekTo(marker.atSeconds)
                }}
              >
                <div className="h-full w-0.5 bg-brand-yellow/80 hover:bg-brand-yellow transition-colors" />
                <button
                  type="button"
                  title={`Note at ${timecode(marker.atSeconds)}: ${marker.body}`}
                  onMouseEnter={() =>
                    setActiveTooltip({
                      text: `${marker.authorName ? marker.authorName + ': ' : ''}${marker.body}`,
                      x: leftPercent,
                    })
                  }
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="absolute -top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-yellow border-2 border-surface-lowest flex items-center justify-center text-[8px] font-bold text-black shadow-md hover:scale-125 transition-transform"
                >
                  ●
                </button>
              </div>
            )
          })}

        {/* Active Comment Pin Floating Tooltip */}
        {activeTooltip && (
          <div
            className="absolute -top-9 -translate-x-1/2 z-20 pointer-events-none rounded-md bg-neutral-900 border border-brand-yellow/40 px-2 py-1 text-xs text-white shadow-xl max-w-xs truncate"
            style={{ left: `${activeTooltip.x}%` }}
          >
            <span className="text-brand-yellow font-bold mr-1">💬</span>
            {activeTooltip.text}
          </div>
        )}
      </div>

      {/* Transport Controls & Time Readouts */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Playback buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => skip(-10)}
            title="Rewind 10 seconds"
            className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => skip(10)}
            title="Fast forward 10 seconds"
            className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCw size={16} />
          </button>

          {/* Time display */}
          <div className="font-mono text-xs text-text-primary ml-2 tracking-wide">
            <span className="text-brand-cyan font-bold">{timecode(currentTime)}</span>
            <span className="text-text-muted mx-1">/</span>
            <span className="text-text-muted">{timecode(duration)}</span>
          </div>
        </div>

        {/* Right: Volume, Speed & Loop */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRateChange}
            className="px-2 py-1 rounded-md text-xs font-mono font-medium border border-white/10 text-text-muted hover:text-white hover:border-white/20 transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onClick={toggleLoop}
            className={`p-1.5 rounded-md transition-colors ${
              isLooping ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40' : 'text-text-muted hover:text-white'
            }`}
            title="Loop playback"
          >
            <Repeat size={15} />
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={toggleMute}
              className="text-text-muted hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
