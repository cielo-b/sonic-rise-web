'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, MessageSquare, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { api, type DeliverableDetail } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { useI18n } from '@/lib/i18n'
import { bytes, formatDateTime, money, timecode } from '@/lib/format'
import { Avatar, Badge, Button, Card, ErrorState, Field, Input, Loading, Select, Textarea, errorMessage } from './ui'
import { PayMobileMoney } from './PayMobileMoney'

function Player({ url, mime, mediaRef }: { url: string; mime: string; mediaRef: React.RefObject<HTMLMediaElement | null> }) {
  if (mime.startsWith('audio/')) return <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={url} controls className="w-full" />
  if (mime.startsWith('video/')) return <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={url} controls className="w-full rounded-lg bg-black max-h-[60vh]" />
  if (mime.startsWith('image/')) {
    // eslint-disable-next-line @next/next/no-img-element -- signed private file URL
    return <img src={url} alt="" className="w-full rounded-lg" />
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="btn-glass">
      Open file
    </a>
  )
}

export function DeliverableReview({ id }: { id: string }) {
  const studio = useRequiredStudio()
  const { user, isStaff, can } = useAuth()
  const { t, locale } = useI18n()
  const qc = useQueryClient()
  const key = ['deliverable', id]
  const q = useQuery({ queryKey: key, queryFn: () => api.deliverables.get(id) })
  const d = q.data
  const [versionId, setVersionId] = useState<string | null>(null)
  const version = d?.versions.find((v) => v.id === versionId) ?? d?.versions[0]
  const stream = useQuery({
    queryKey: ['deliverable-stream', id, version?.id],
    queryFn: () => api.deliverables.streamUrl(id, version!.id),
    enabled: !!version,
    staleTime: 10 * 60_000, // links last 15 minutes
  })
  const media = useRef<HTMLMediaElement | null>(null)
  const [comment, setComment] = useState('')
  const [at, setAt] = useState<number | null>(null)
  const [changes, setChanges] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const isClient = user?.role === 'CLIENT'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the newest version after an upload
    if (d && versionId && !d.versions.some((v) => v.id === versionId)) setVersionId(null)
  }, [d, versionId])

  const update = (next: DeliverableDetail) => qc.setQueryData(key, next)
  async function act(name: string, fn: () => Promise<DeliverableDetail | void>) {
    setBusy(name)
    try {
      const next = await fn()
      if (next) update(next)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  if (q.isLoading) return <Loading />
  if (!d) return <ErrorState error={q.error} onRetry={() => q.refetch()} />

  const versionComments = d.comments.filter((c) => !version || !c.versionId || c.versionId === version.id)
  const isMedia = !!version && /^(audio|video)\//.test(version.mimeType)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xs text-text-muted">{d.project.title}</p>
            <h2 className="font-headline text-2xl font-bold">{d.title}</h2>
          </div>
          <Badge status={d.status} />
        </div>
        {d.description && <p className="text-sm text-text-muted whitespace-pre-line">{d.description}</p>}

        {d.versions.length === 0 ? (
          <Card className="p-6 text-sm text-text-muted">No file uploaded yet.</Card>
        ) : (
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <Select value={version?.id} onChange={(e) => setVersionId(e.target.value)} className="w-auto">
                {d.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {t('portal.version', { n: v.version })} · {v.fileName}
                  </option>
                ))}
              </Select>
              {version && (
                <span className="text-xs text-outline">
                  {bytes(version.sizeBytes)} · {formatDateTime(version.createdAt, studio.timezone, locale)}
                </span>
              )}
            </div>
            {stream.data && version && <Player url={stream.data.url} mime={version.mimeType} mediaRef={media} />}
            {version?.note && <p className="text-sm text-text-muted whitespace-pre-line">{version.note}</p>}
          </Card>
        )}

        <Card className="p-5 space-y-4">
          <p className="font-headline font-semibold flex items-center gap-2"><MessageSquare size={16} /> Notes</p>
          {versionComments.length === 0 && <p className="text-sm text-text-muted">No notes yet.</p>}
          <ul className="space-y-3">
            {versionComments.map((c) => (
              <li key={c.id} className={`flex gap-3 ${c.resolved ? 'opacity-50' : ''}`}>
                <Avatar name={c.author?.name ?? '?'} url={c.author?.avatarUrl} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-muted">
                    <span className="text-text-primary font-medium">{c.author?.name}</span> · {formatDateTime(c.createdAt, studio.timezone, locale)}
                    {c.atSeconds !== null && (
                      <button
                        className="ml-2 font-mono text-brand-cyan hover:underline"
                        onClick={() => {
                          if (media.current) {
                            media.current.currentTime = c.atSeconds!
                            void media.current.play()
                          }
                        }}
                      >
                        {timecode(c.atSeconds)}
                      </button>
                    )}
                  </p>
                  <p className="text-sm whitespace-pre-line mt-0.5">{c.body}</p>
                </div>
                {isStaff && (
                  <Button
                    variant="quiet"
                    onClick={() => act(`resolve-${c.id}`, () => api.deliverables.resolveComment(id, c.id, !c.resolved))}
                  >
                    {c.resolved ? 'Reopen' : 'Resolve'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!comment.trim()) return
              void act('comment', async () => {
                const next = await api.deliverables.comment(id, { body: comment.trim(), atSeconds: at ?? undefined, versionId: version?.id })
                setComment('')
                setAt(null)
                return next
              })
            }}
          >
            <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('portal.addComment')} />
            <div className="flex flex-wrap gap-2 items-center">
              {isMedia && (
                <Button
                  type="button"
                  variant="glass"
                  onClick={() => setAt(media.current ? Math.floor(media.current.currentTime) : null)}
                >
                  {at !== null ? t('portal.commentAt', { time: timecode(at) }) : 'Pin to current time'}
                </Button>
              )}
              <Button type="submit" loading={busy === 'comment'} disabled={!comment.trim()}>{t('portal.addComment')}</Button>
            </div>
          </form>
        </Card>
      </div>

      <aside className="space-y-4">
        {isClient && d.versions.length > 0 && (
          <Card className="p-5 space-y-4">
            {d.status !== 'APPROVED' ? (
              <>
                <Button className="w-full" loading={busy === 'approve'} onClick={() => act('approve', () => api.deliverables.approve(id))}>
                  <CheckCircle2 size={16} /> {t('portal.approve')}
                </Button>
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!changes.trim()) return
                    void act('changes', async () => {
                      const next = await api.deliverables.requestChanges(id, changes.trim())
                      setChanges('')
                      return next
                    })
                  }}
                >
                  <Textarea rows={3} value={changes} onChange={(e) => setChanges(e.target.value)} placeholder="What should change?" />
                  <Button type="submit" variant="glass" className="w-full" loading={busy === 'changes'} disabled={!changes.trim()}>
                    {t('portal.requestChanges')}
                  </Button>
                </form>
              </>
            ) : d.canDownload ? (
              <Button
                className="w-full"
                loading={busy === 'download'}
                onClick={() => act('download', async () => { window.location.href = (await api.deliverables.downloadUrl(id)).url })}
              >
                <Download size={16} /> {t('portal.downloadFinal')}
              </Button>
            ) : d.price > 0 && !d.isPaid ? (
              <div className="space-y-3">
                <p className="text-sm">{t('portal.payToDownload', { amount: money(d.price, d.currency, locale) })}</p>
                {studio.onlinePayments ? (
                  <PayMobileMoney purpose="DELIVERABLE" targetId={id} amount={d.price} currency={d.currency} onPaid={() => q.refetch()} />
                ) : (
                  <p className="text-xs text-text-muted">{t('pay.notSetUp')}</p>
                )}
              </div>
            ) : null}
          </Card>
        )}

        {isStaff && can('deliverables.upload') && <StaffPanel d={d} onChange={update} />}
      </aside>
    </div>
  )
}

function StaffPanel({ d, onChange }: { d: DeliverableDetail; onChange: (d: DeliverableDetail) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [price, setPrice] = useState(String(d.price))
  const [saving, setSaving] = useState(false)

  async function upload(file?: File) {
    if (!file) return
    setProgress(0)
    try {
      onChange(await api.deliverables.uploadVersion(d.id, file, note.trim() || undefined, setProgress))
      setNote('')
      toast.success('Uploaded — the client has been emailed')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Card className="p-5 space-y-4">
      <p className="font-headline font-semibold">Upload a new version</p>
      <Field label="Note for the client" hint="Optional">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <input ref={fileRef} type="file" className="hidden" accept="audio/*,video/*,image/*,.zip,.pdf" onChange={(e) => upload(e.target.files?.[0])} />
      <Button className="w-full" loading={progress !== null} onClick={() => fileRef.current?.click()}>
        <Upload size={16} /> {progress !== null ? `${progress}%` : 'Choose file'}
      </Button>
      <form
        className="space-y-2 border-t border-white/10 pt-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          try {
            onChange(await api.deliverables.update(d.id, { price: Number(price) || 0 }))
            toast.success('Saved')
          } catch (err) {
            toast.error(errorMessage(err))
          } finally {
            setSaving(false)
          }
        }}
      >
        <Field label={`Download price (${d.currency})`} hint="0 = free once approved">
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} disabled={d.isPaid} />
        </Field>
        <Button type="submit" variant="glass" loading={saving} disabled={d.isPaid}>Save price</Button>
        {d.isPaid && <p className="text-xs text-emerald-300">Paid</p>}
      </form>
    </Card>
  )
}
