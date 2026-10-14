'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Trash2, Plus, Music2, Sliders } from 'lucide-react'
import { toast } from 'sonner'
import { api, type DeliverableDetail, type StemTrack } from '@/lib/api'
import { bytes, timecode } from '@/lib/format'
import { Button, Card, ConfirmationModal, Field, Input } from './ui'

interface StemsMixerProps {
  deliverableId: string
  versionId: string
  stems: StemTrack[]
  isStaff: boolean
  onStemsUpdated: (d: DeliverableDetail) => void
}

interface TrackState {
  volume: number // 0 to 1
  isMuted: boolean
  isSoloed: boolean
}

export function StemsMixer({ deliverableId, versionId, stems, isStaff, onStemsUpdated }: StemsMixerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [masterVolume, setMasterVolume] = useState(1)
  const [isMasterMuted, setIsMasterMuted] = useState(false)
  const [trackStates, setTrackStates] = useState<Record<string, TrackState>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [showAddStem, setShowAddStem] = useState(false)
  const [stemName, setStemName] = useState('')
  const [stemFile, setStemFile] = useState<File | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [stemToDelete, setStemToDelete] = useState<StemTrack | null>(null)

  // Map of audio elements keyed by stem ID
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  // Initialize track states
  useEffect(() => {
    setTrackStates((prev) => {
      const next = { ...prev }
      stems.forEach((stem) => {
        if (!next[stem.id]) {
          next[stem.id] = { volume: 0.85, isMuted: false, isSoloed: false }
        }
      })
      return next
    })
  }, [stems])

  // Sync duration and current time from first active audio element
  useEffect(() => {
    const primaryId = stems[0]?.id
    const primaryAudio = primaryId ? audioRefs.current[primaryId] : null
    if (!primaryAudio) return

    const handleLoadedMetadata = () => {
      if (primaryAudio.duration) setDuration(primaryAudio.duration)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(primaryAudio.currentTime)
    }
    const handleEnded = () => {
      setIsPlaying(false)
    }

    primaryAudio.addEventListener('loadedmetadata', handleLoadedMetadata)
    primaryAudio.addEventListener('timeupdate', handleTimeUpdate)
    primaryAudio.addEventListener('ended', handleEnded)

    if (primaryAudio.duration) setDuration(primaryAudio.duration)

    return () => {
      primaryAudio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      primaryAudio.removeEventListener('timeupdate', handleTimeUpdate)
      primaryAudio.removeEventListener('ended', handleEnded)
    }
  }, [stems])

  // Compute effective volume for each track based on Solo & Mute & Master
  const updateAudioVolumes = useCallback(() => {
    const hasAnySolo = Object.values(trackStates).some((s) => s.isSoloed)
    const effectiveMaster = isMasterMuted ? 0 : masterVolume

    stems.forEach((stem) => {
      const audio = audioRefs.current[stem.id]
      if (!audio) return
      const state = trackStates[stem.id] || { volume: 0.85, isMuted: false, isSoloed: false }

      if (state.isMuted) {
        audio.volume = 0
      } else if (hasAnySolo) {
        audio.volume = state.isSoloed ? state.volume * effectiveMaster : 0
      } else {
        audio.volume = state.volume * effectiveMaster
      }
    })
  }, [stems, trackStates, masterVolume, isMasterMuted])

  useEffect(() => {
    updateAudioVolumes()
  }, [updateAudioVolumes])

  const togglePlay = () => {
    if (isPlaying) {
      stems.forEach((s) => {
        audioRefs.current[s.id]?.pause()
      })
      setIsPlaying(false)
    } else {
      // Align all tracks to the same currentTime before playing
      stems.forEach((s) => {
        const audio = audioRefs.current[s.id]
        if (audio) {
          audio.currentTime = currentTime
          void audio.play().catch(() => {})
        }
      })
      setIsPlaying(true)
    }
  }

  const seekAll = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration))
    setCurrentTime(clamped)
    stems.forEach((s) => {
      const audio = audioRefs.current[s.id]
      if (audio) audio.currentTime = clamped
    })
  }

  const toggleSolo = (stemId: string) => {
    setTrackStates((prev) => {
      const current = prev[stemId] || { volume: 0.85, isMuted: false, isSoloed: false }
      return {
        ...prev,
        [stemId]: { ...current, isSoloed: !current.isSoloed },
      }
    })
  }

  const toggleMute = (stemId: string) => {
    setTrackStates((prev) => {
      const current = prev[stemId] || { volume: 0.85, isMuted: false, isSoloed: false }
      return {
        ...prev,
        [stemId]: { ...current, isMuted: !current.isMuted },
      }
    })
  }

  const setTrackVolume = (stemId: string, vol: number) => {
    setTrackStates((prev) => {
      const current = prev[stemId] || { volume: 0.85, isMuted: false, isSoloed: false }
      return {
        ...prev,
        [stemId]: { ...current, volume: vol },
      }
    })
  }

  const handleUploadStem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stemFile || !stemName.trim()) {
      toast.error('Please enter a track name and choose an audio stem file')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    try {
      const updated = await api.deliverables.uploadStem(
        deliverableId,
        versionId,
        stemFile,
        stemName.trim(),
        (p) => setUploadProgress(p),
      )
      toast.success(`Stem "${stemName.trim()}" uploaded successfully`)
      setStemName('')
      setStemFile(null)
      setShowAddStem(false)
      onStemsUpdated(updated)
    } catch {
      toast.error('Failed to upload stem file')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDeleteStem = async (stemId: string, name: string) => {
    setDeletingId(stemId)
    try {
      const updated = await api.deliverables.deleteStem(deliverableId, versionId, stemId)
      toast.success(`Removed stem "${name}"`)
      onStemsUpdated(updated)
      setStemToDelete(null)
    } catch {
      toast.error('Failed to remove stem')
    } finally {
      setDeletingId(null)
    }
  }

  if (stems.length === 0 && !isStaff) {
    return null
  }

  return (
    <Card className="p-5 space-y-5 border-white/10 bg-surface-lowest/80 backdrop-blur-md shadow-2xl">
      {/* Header with Title and Add Stem Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-purple/20 text-brand-purple border border-brand-purple/30 flex items-center justify-center">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="font-headline font-semibold text-lg flex items-center gap-2">
              Multi-Track Stems Mixer
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/40 font-mono">
                {stems.length} {stems.length === 1 ? 'Stem' : 'Stems'}
              </span>
            </h3>
            <p className="text-xs text-text-muted">Solo, mute, and adjust level per individual studio stem channel</p>
          </div>
        </div>

        {isStaff && (
          <Button
            variant={showAddStem ? 'quiet' : 'glass'}
            size="sm"
            onClick={() => setShowAddStem(!showAddStem)}
          >
            <Plus size={14} className="mr-1" /> {showAddStem ? 'Cancel' : 'Add Stem Track'}
          </Button>
        )}
      </div>

      {/* Staff Add Stem Modal / Drawer */}
      {showAddStem && isStaff && (
        <form onSubmit={handleUploadStem} className="p-4 rounded-xl border border-brand-purple/30 bg-black/40 space-y-3">
          <p className="text-sm font-semibold text-text-primary">Upload New Stem Track</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Track / Channel Name" hint="e.g., Lead Vocals, 808 Bass, Synth Lead">
              <Input
                placeholder="Track name"
                value={stemName}
                onChange={(e) => setStemName(e.target.value)}
                required
              />
            </Field>
            <Field label="Audio File" hint="WAV, MP3, FLAC, AIFF">
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.flac,.aiff"
                className="w-full text-xs text-text-muted file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-white/10 file:text-white file:cursor-pointer hover:file:bg-white/20"
                onChange={(e) => setStemFile(e.target.files?.[0] || null)}
                required
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              loading={uploading}
              disabled={!stemFile || !stemName.trim()}
            >
              {uploadProgress !== null ? `Uploading ${uploadProgress}%` : 'Upload Stem'}
            </Button>
          </div>
        </form>
      )}

      {stems.length === 0 ? (
        <div className="text-center py-8 text-sm text-text-muted border border-dashed border-white/10 rounded-xl">
          <Music2 size={32} className="mx-auto mb-2 opacity-30" />
          No isolated stems have been uploaded for this version yet.
        </div>
      ) : (
        <>
          {/* Master Transport Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-black/30 border border-white/5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-brand-cyan text-black font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                title={isPlaying ? 'Pause All Stems' : 'Play All Stems'}
              >
                {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => seekAll(0)}
                className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Restart from beginning"
              >
                <RotateCcw size={16} />
              </button>

              {/* Time display */}
              <div className="font-mono text-xs text-text-primary ml-1">
                <span className="text-brand-cyan font-bold">{timecode(currentTime)}</span>
                <span className="text-text-muted mx-1">/</span>
                <span className="text-text-muted">{timecode(duration)}</span>
              </div>
            </div>

            {/* Scrub Slider */}
            <div className="flex-1 max-w-xs mx-4 hidden sm:block">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekAll(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
            </div>

            {/* Master Volume */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">Master:</span>
              <button
                type="button"
                onClick={() => setIsMasterMuted(!isMasterMuted)}
                className="text-text-muted hover:text-white transition-colors"
              >
                {isMasterMuted || masterVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMasterMuted ? 0 : masterVolume}
                onChange={(e) => {
                  setMasterVolume(parseFloat(e.target.value))
                  setIsMasterMuted(false)
                }}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
            </div>
          </div>

          {/* Stem Channels List */}
          <div className="space-y-2">
            {stems.map((stem, index) => {
              const state = trackStates[stem.id] || { volume: 0.85, isMuted: false, isSoloed: false }
              const isDeleting = deletingId === stem.id

              return (
                <div
                  key={stem.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                    state.isSoloed
                      ? 'border-yellow-500/50 bg-yellow-500/5'
                      : state.isMuted
                      ? 'border-white/5 bg-white/[0.02] opacity-50'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  {/* Stem audio element */}
                  <audio
                    ref={(el) => {
                      audioRefs.current[stem.id] = el
                    }}
                    src={stem.url}
                    preload="metadata"
                  />

                  {/* Left: Track Name & Channel Number */}
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <span className="font-mono text-xs font-bold text-text-muted w-5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-text-primary truncate">{stem.name}</p>
                      <p className="text-[11px] text-text-muted font-mono">{bytes(stem.sizeBytes)}</p>
                    </div>
                  </div>

                  {/* Middle: Solo / Mute Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSolo(stem.id)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                        state.isSoloed
                          ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                          : 'bg-white/10 text-text-muted hover:text-white hover:bg-white/15'
                      }`}
                      title="Solo track"
                    >
                      S
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleMute(stem.id)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                        state.isMuted
                          ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                          : 'bg-white/10 text-text-muted hover:text-white hover:bg-white/15'
                      }`}
                      title="Mute track"
                    >
                      M
                    </button>
                  </div>

                  {/* Right: Volume Fader + Readout */}
                  <div className="flex items-center gap-2.5 flex-1 max-w-[200px]">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={state.isMuted ? 0 : state.volume}
                      disabled={state.isMuted}
                      onChange={(e) => setTrackVolume(stem.id, parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                    />
                    <span className="font-mono text-[11px] text-text-muted w-9 text-right">
                      {state.isMuted ? 'MUTE' : `${Math.round(state.volume * 100)}%`}
                    </span>
                  </div>

                  {/* Actions: Download & Delete */}
                  <div className="flex items-center gap-1">
                    {stem.url && (
                      <a
                        href={stem.url}
                        download={stem.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                        title="Download stem audio file"
                      >
                        <Download size={14} />
                      </a>
                    )}
                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => setStemToDelete(stem)}
                        disabled={deletingId === stem.id}
                        className="p-1.5 rounded text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete stem"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <ConfirmationModal
        open={!!stemToDelete}
        onClose={() => setStemToDelete(null)}
        loading={!!deletingId}
        title="Delete Audio Stem"
        message={`Are you sure you want to remove "${stemToDelete?.name}"? This audio track will be removed from this session.`}
        confirmText="Delete Stem"
        onConfirm={async () => {
          if (!stemToDelete) return
          await handleDeleteStem(stemToDelete.id, stemToDelete.name)
        }}
      />
    </Card>
  )
}
