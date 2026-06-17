'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRole } from '@/hooks/useRole'
import {
  Search, Upload, Grid2X2, List, Play, FileAudio,
  X, Download, Share2, ChevronRight, ChevronLeft,
  CheckCircle2, Plus, Trash2, Star, Edit2, Folder, FolderPlus, RefreshCcw
} from 'lucide-react'
import {
  usePortfolioAll,
  useCreatePortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
  useMediaAll,
  useCreateMedia,
  useUpdateMedia,
  useDeleteMedia,
} from '@/lib/queries'
import { api, type ApiPortfolioItem, type ApiMediaAsset } from '@/lib/api'
import { toast } from 'sonner'

type FilterTab = 'All Assets' | 'Favorites' | 'Trash' | 'Portfolio'
type ViewMode  = 'grid' | 'list'



const FILTER_TABS: FilterTab[] = ['All Assets', 'Favorites', 'Trash', 'Portfolio']

/* ─── Portfolio CRUD Tab ─────────────────────────────────────────────────── */
function PortfolioTab({ canUpload }: { canUpload: boolean }) {
  const { data: items = [], isLoading } = usePortfolioAll()
  const { mutate: create, isPending: creating } = useCreatePortfolioItem()
  const { mutate: update } = useUpdatePortfolioItem()
  const { mutate: remove } = useDeletePortfolioItem()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ApiPortfolioItem | null>(null)
  const [form, setForm] = useState({ title: '', category: '', mediaUrl: '', thumbnailUrl: '', description: '', isFeatured: false })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setUploadError('')
    try {
      const { url } = await api.portfolio.upload(file, (p) => setUploadProgress(p))
      setForm((f) => ({ ...f, mediaUrl: url }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      e.target.value = ''
    }
  }

  function openNew() { setEditing(null); setForm({ title: '', category: '', mediaUrl: '', thumbnailUrl: '', description: '', isFeatured: false }); setFormOpen(true) }
  function openEdit(item: ApiPortfolioItem) {
    setEditing(item)
    setForm({ title: item.title, category: item.category, mediaUrl: item.mediaUrl, thumbnailUrl: item.thumbnailUrl ?? '', description: item.description ?? '', isFeatured: item.isFeatured })
    setFormOpen(true)
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = { ...form, thumbnailUrl: form.thumbnailUrl || undefined, description: form.description || undefined }
    if (editing) {
      update(
        { id: editing.id, data },
        {
          onSuccess: () => { setFormOpen(false); toast.success('Portfolio item updated.') },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update item.'),
        },
      )
    } else {
      create(
        data,
        {
          onSuccess: () => { setFormOpen(false); toast.success('Portfolio item added.') },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add item.'),
        },
      )
    }
  }

  if (isLoading) return <div className="py-20 text-center text-[#929095] font-mono text-sm">Loading portfolio…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[#929095] text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        {canUpload && (
          <button onClick={openNew} className="btn-primary text-sm gap-2 py-2 px-4">
            <Plus size={14} /> Add Item
          </button>
        )}
      </div>

      {items.length === 0 && (
        <div className="py-20 text-center text-[#929095] font-mono text-sm uppercase tracking-widest">
          No portfolio items yet. Add one above.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((item) => (
          <div key={item.id} className="group relative bg-[#1B1B23] rounded-xl border border-white/10 overflow-hidden hover:border-brand-cyan/50 transition-all duration-300">
            <div className="aspect-video relative bg-[#13131A]">
              <Image src={item.thumbnailUrl ?? item.mediaUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              {item.isFeatured && (
                <div className="absolute top-2 left-2">
                  <span className="flex items-center gap-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 font-mono text-[9px] px-2 py-0.5 rounded-full">
                    <Star size={9} className="fill-brand-gold" /> Featured
                  </span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {canUpload && (
                  <>
                    <button onClick={() => openEdit(item)} className="w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg text-[#C8C5CB] hover:text-brand-cyan transition-colors">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => remove(item.id, {
                      onSuccess: () => toast.success('Portfolio item deleted.'),
                      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete item.'),
                    })} className="w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg text-[#C8C5CB] hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-3">
              <p className="font-mono text-[10px] text-brand-cyan mb-0.5">{item.category}</p>
              <p className="text-[#E4E1EC] text-sm font-medium truncate">{item.title}</p>
              {item.description && <p className="text-[#929095] text-xs mt-0.5 line-clamp-1">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setFormOpen(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="glass-card rounded-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-headline text-[#E4E1EC] font-bold">{editing ? 'Edit Portfolio Item' : 'New Portfolio Item'}</h3>
                <button onClick={() => setFormOpen(false)} className="text-[#929095] hover:text-[#E4E1EC] transition-colors"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Title *</label>
                    <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Echoes of Rwanda" className="input-studio text-sm w-full" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Category *</label>
                    <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Music Video" className="input-studio text-sm w-full" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Media File *</label>
                    <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime" className="hidden" onChange={handleFileSelect} />
                    <div className="flex gap-2">
                      <input value={form.mediaUrl} onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))} placeholder="https://… or upload below" className="input-studio text-sm flex-1 min-w-0" required />
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="btn-glass text-xs px-3 py-2 shrink-0 disabled:opacity-60 whitespace-nowrap">
                        {uploading ? `${uploadProgress}%` : <><Upload size={12} className="inline mr-1" />Upload</>}
                      </button>
                    </div>
                    {uploading && uploadProgress > 0 && (
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-cyan transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                    {uploadError && <p className="text-red-400 text-[10px] font-mono">{uploadError}</p>}
                    {form.mediaUrl && !form.mediaUrl.startsWith('http') === false && (
                      <p className="text-brand-cyan text-[10px] font-mono truncate">✓ {form.mediaUrl}</p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Thumbnail URL</label>
                    <input value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))} placeholder="https://… (optional)" className="input-studio text-sm w-full" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="input-studio text-sm w-full resize-none" />
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <input type="checkbox" id="featured" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded accent-brand-purple cursor-pointer" />
                    <label htmlFor="featured" className="font-mono text-xs text-[#C8C5CB] cursor-pointer select-none">Show in homepage Featured section</label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setFormOpen(false)} className="btn-ghost text-sm flex-1 py-2.5">Cancel</button>
                  <button type="submit" disabled={creating} className="btn-primary text-sm flex-1 py-2.5 disabled:opacity-60">
                    {creating ? 'Saving…' : editing ? 'Save Changes' : 'Add to Portfolio'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── New Folder Modal ───────────────────────────────────────────────────── */
function NewFolderModal({ onClose, parentId }: { onClose: () => void, parentId: string | null }) {
  const [name, setName] = useState('')
  const { mutateAsync: createMedia } = useCreateMedia()
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await createMedia({
        name: name.trim(),
        type: 'folder',
        badge: 'DIR',
        badgeColor: 'text-[#929095]',
        size: '--',
        status: 'ACTIVE',
        statusColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        isFolder: true,
        parentId,
      })
      toast.success(`Folder "${name.trim()}" created.`)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create folder.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-headline text-[#E4E1EC] font-bold">New Folder</h3>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Folder Name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Raw Footage" className="input-studio text-sm w-full" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary text-sm flex-1 py-2.5 disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Folder'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ─── Confirm Modal ──────────────────────────────────────────────────────── */
function ConfirmModal({ title, message, confirmText = 'Confirm', confirmColor = 'bg-brand-cyan text-black hover:bg-brand-cyan/90', onConfirm, onClose }: {
  title: string
  message: string
  confirmText?: string
  confirmColor?: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card rounded-2xl w-full max-w-sm overflow-hidden border border-white/10"
      >
        <div className="px-6 py-5 border-b border-white/5 bg-[#1B1B23]">
          <h3 className="font-headline text-[#E4E1EC] font-bold text-lg">{title}</h3>
        </div>
        <div className="p-6 bg-[#13131A]">
          <p className="text-[#C8C5CB] text-sm mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost text-sm flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Cancel</button>
            <button onClick={() => { onConfirm(); onClose() }} className={`text-sm font-semibold rounded-lg flex-1 py-2.5 transition-colors ${confirmColor}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Upload Modal ───────────────────────────────────────────────────────── */
function UploadModal({ onClose, parentId }: { onClose: () => void, parentId: string | null }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [done, setDone]           = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const { mutateAsync: createMedia } = useCreateMedia()

  function handleFiles(files: FileList | null) {
    if (!files) return
    setSelectedFiles((prev) => [...prev, ...Array.from(files)])
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return
    setUploading(true)
    setUploadProgress(0)
    try {
      let totalFiles = selectedFiles.length
      let completedFiles = 0
      for (const file of selectedFiles) {
        const { url, type, size, name } = await api.media.upload(file, (p) => {
          const currentFileProgress = p / 100
          const overallProgress = Math.round(((completedFiles + currentFileProgress) / totalFiles) * 100)
          setUploadProgress(overallProgress)
        })
        completedFiles++
        let badge = 'FILE'
        let badgeColor = 'text-brand-cyan'
        if (type === 'video') { badge = 'RAW'; badgeColor = 'text-brand-cyan' }
        if (type === 'audio') { badge = 'WAV'; badgeColor = 'text-[#D2BBFF]' }
        if (type === 'image') { badge = 'PNG'; badgeColor = 'text-[#3CD7FF]' }

        await createMedia({
          name,
          type,
          badge,
          badgeColor,
          size,
          status: 'UPLOADED',
          statusColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          src: url,
          tags: [],
          parentId,
        })
      }
      setDone(true)
      toast.success(`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
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
          <h3 className="font-headline text-[#E4E1EC] text-lg font-bold">Upload Asset</h3>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <CheckCircle2 size={44} className="text-brand-cyan mx-auto mb-4" />
            <h4 className="font-headline text-xl font-bold text-[#E4E1EC] mb-2">Uploaded!</h4>
            <p className="text-[#929095] text-sm mb-5">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} added to the Media Library.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={onClose} className="btn-primary text-sm px-6 py-2.5">Done</button>
              <button onClick={() => { setDone(false); setSelectedFiles([]) }} className="btn-glass text-sm px-5 py-2.5">
                Upload More
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="audio/*,video/*,image/*,.zip,.aiff,.wav,.mp4,.mov"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
              className="border-2 border-dashed border-white/10 hover:border-[#D2BBFF]/40 rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/5 group"
            >
              <Upload size={36} className="text-[#929095] group-hover:text-[#D2BBFF] transition-colors" strokeWidth={1.5} />
              <div>
                <p className="text-[#E4E1EC] text-sm font-medium">Drop files here or click to browse</p>
                <p className="text-[#929095] text-xs font-mono mt-1">WAV · MP4 · PNG · JPG · ZIP — max 500 MB</p>
              </div>
            </div>

            {/* Selected file list */}
            {selectedFiles.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/8">
                    <span className="text-[#E4E1EC] text-xs font-mono truncate flex-1">{file.name}</span>
                    <button
                      onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="ml-2 text-[#929095] hover:text-red-400 transition-colors shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-1 flex-col">
              {uploading && uploadProgress > 0 && (
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-brand-cyan transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-ghost text-sm flex-1 py-2.5" disabled={uploading}>Cancel</button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="btn-primary text-sm flex-1 py-2.5 gap-2 disabled:opacity-50"
                >
                  {uploading ? `Uploading... ${uploadProgress}%` : <><Upload size={14} /> Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ─── File Detail Modal ──────────────────────────────────────────────────── */
function AssetModal({ asset, onClose }: { asset: ApiMediaAsset; onClose: () => void }) {
  const isAudio = asset.type === 'audio'
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!asset.src) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: asset.name,
          url: asset.src,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(asset.src)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!asset.src) return
    const a = document.createElement('a')
    a.href = asset.src
    a.download = asset.name
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col md:flex-row glass-card shadow-[0_0_80px_rgba(0,0,0,0.6)]"
      >
        {/* ── Left: Preview ─────────────────────────────────────────────── */}
        <div className="flex-[2] bg-black flex flex-col min-h-[300px]">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {isAudio && asset.src ? (
              <div className="flex flex-col items-center justify-center w-full h-full p-8 gap-4 bg-[#13131A]">
                <FileAudio size={80} className="text-[#D2BBFF]/40 mb-4" strokeWidth={1} />
                <audio controls src={asset.src} className="w-full max-w-md" />
              </div>
            ) : asset.type === 'video' && asset.src ? (
              <video controls src={asset.src} onDoubleClick={(e) => e.currentTarget.requestFullscreen()} className="w-full h-full max-h-[70vh] object-contain bg-black cursor-pointer" />
            ) : asset.src ? (
              <img src={asset.src} alt={asset.name} className="object-contain w-full h-full opacity-100" />
            ) : (
              <div className="w-full h-full bg-[#1F1F27] flex items-center justify-center">
                <Grid2X2 size={48} className="text-white/20" />
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Metadata ───────────────────────────────────────────── */}
        <div className="flex-1 p-8 bg-[#1B1B23] border-l border-white/10 flex flex-col min-w-[280px]">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="font-headline text-[#E4E1EC] text-lg font-bold">File Details</h2>
              <p className="font-mono text-xs text-[#929095] mt-0.5">Added {new Date(asset.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#929095] hover:text-[#E4E1EC] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <label className="font-mono text-[10px] text-brand-cyan uppercase tracking-widest block mb-1.5">
                Filename
              </label>
              <p className="text-[#E4E1EC] text-sm break-all">{asset.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-brand-cyan uppercase tracking-widest block mb-1.5">
                  Size
                </label>
                <p className="text-[#E4E1EC] text-sm">{asset.size}</p>
              </div>
              {asset.resolution && (
                <div>
                  <label className="font-mono text-[10px] text-brand-cyan uppercase tracking-widest block mb-1.5">
                    Resolution
                  </label>
                  <p className="text-[#E4E1EC] text-sm">{asset.resolution}</p>
                </div>
              )}
              {asset.duration && (
                <div>
                  <label className="font-mono text-[10px] text-brand-cyan uppercase tracking-widest block mb-1.5">
                    Duration
                  </label>
                  <p className="text-[#E4E1EC] text-sm">{asset.duration}</p>
                </div>
              )}
            </div>

            <div>
              <label className="font-mono text-[10px] text-brand-cyan uppercase tracking-widest block mb-1.5">
                Status
              </label>
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-medium ${asset.statusColor}`}>
                {asset.status}
              </span>
            </div>

            <div>
              <label className="font-mono text-[10px] text-brand-cyan uppercase tracking-widest block mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-[#929095]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 py-3 bg-[#D2BBFF] text-[#3F008E] rounded-xl font-mono text-sm font-bold hover:shadow-[0_0_20px_rgba(210,187,255,0.4)] transition-all">
              <Download size={15} />
              Download Full Res
            </button>
            <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 text-[#E4E1EC] rounded-xl font-mono text-sm hover:bg-white/5 transition-all">
              {copied ? <CheckCircle2 size={15} className="text-[#3CD7FF]" /> : <Share2 size={15} />}
              {copied ? <span className="text-[#3CD7FF]">Copied to Clipboard!</span> : 'Share Asset Link'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function MediaManagerPage() {
  const { can }                          = useRole()
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All Assets')
  const [viewMode, setViewMode]         = useState<ViewMode>(() =>
    (typeof window !== 'undefined' ? (localStorage.getItem('sr_media_view') as ViewMode | null) : null) ?? 'grid'
  )
  const [selected, setSelected]         = useState<ApiMediaAsset | null>(null)
  const [search, setSearch]             = useState('')
  const [currentPage, setCurrentPage]   = useState(1)
  const [uploadOpen, setUploadOpen]     = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; confirmText?: string; confirmColor?: string; onConfirm: () => void } | null>(null)

  const { data: assets = [] }           = useMediaAll()
  const { mutate: updateMedia }         = useUpdateMedia()
  const { mutate: deleteMedia }         = useDeleteMedia()

  const breadcrumbs = []
  let curr = currentFolderId
  while (curr) {
    const f = assets.find(a => a.id === curr)
    if (f) {
      breadcrumbs.unshift(f)
      curr = f.parentId
    } else {
      break
    }
  }

  let filtered = assets.filter((a) => {
    if (activeFilter === 'Trash') return a.isTrash
    if (a.isTrash) return false

    if (activeFilter === 'Favorites') return a.isFavorite
    if (activeFilter === 'Portfolio') return false // Handled inside PortfolioTab
    
    // Default for 'All Assets'
    return a.parentId === currentFolderId
  }).filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

  const ITEMS_PER_PAGE = 12
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const parseSizeMB = (sizeStr?: string | null) => {
    if (!sizeStr) return 0
    const val = parseFloat(sizeStr)
    if (Number.isNaN(val)) return 0
    if (sizeStr.includes('GB')) return val * 1024
    if (sizeStr.includes('MB')) return val
    if (sizeStr.includes('KB')) return val / 1024
    return val
  }
  
  const activeFiles = assets.filter(a => !a.isTrash && !a.isFolder)
  const totalMB = activeFiles.reduce((acc, a) => acc + parseSizeMB(a.size), 0)
  const totalGB = totalMB / 1024
  const storageLimitGB = 10
  const usedPct = Math.min(100, Math.max(0, (totalGB / storageLimitGB) * 100))
  const totalSize = totalGB < 1 ? `${totalMB.toFixed(1)} MB` : `${totalGB.toFixed(2)} GB`

  const videoCount = activeFiles.filter((a) => a.type === 'video').length
  const audioCount = activeFiles.filter((a) => a.type === 'audio').length

  return (
    <div className="p-5 md:p-8 min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-[#E4E1EC] text-2xl font-bold tracking-tight">Media Manager</h1>
          <p className="text-[#C8C5CB] text-sm mt-1">Browse, organize and distribute studio assets.</p>
        </div>
        {can('media:upload') && (
          <div className="flex gap-3 self-start sm:self-auto">
            <button
              onClick={() => setNewFolderOpen(true)}
              className="btn-glass text-sm gap-2 py-2.5 px-4"
            >
              <FolderPlus size={15} />
              New Folder
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="btn-primary text-sm gap-2 py-2.5 px-5"
            >
              <Upload size={15} />
              Upload Asset
            </button>
          </div>
        )}
      </div>

      {/* ── Storage stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-5 sm:col-span-2">
          <div className="flex items-end justify-between mb-3">
            <p className="font-mono text-[10px] text-[#929095] uppercase tracking-widest">Storage</p>
            <span className="font-mono text-xs text-red-400">{usedPct}% used</span>
          </div>
          <p className="font-headline text-2xl font-bold text-[#E4E1EC] mb-3">{totalSize} total</p>
          <div className="h-2 rounded-full bg-[#1F1F27] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#3CD7FF] transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <p className="font-mono text-[10px] text-[#929095] uppercase tracking-widest mb-3">Asset Breakdown</p>
          <div className="space-y-2">
            {[
              { label: 'Videos', count: videoCount, color: 'bg-brand-cyan'   },
              { label: 'Audio',  count: audioCount, color: 'bg-[#D2BBFF]'    },
              { label: 'Images', count: activeFiles.filter((a) => a.type === 'image').length, color: 'bg-[#D4AF37]' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${row.color}`} />
                  <span className="text-[#C8C5CB]">{row.label}</span>
                </div>
                <span className="font-mono text-[#E4E1EC] text-xs font-medium">{row.count} files</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xl w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929095]" />
          <input
            type="text"
            placeholder="Search studio assets, raw footage, mastered tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-studio pl-9 text-sm py-2.5 w-full"
          />
        </div>

        <div className="flex items-center bg-[#1B1B23] border border-white/8 rounded-lg p-1 gap-0.5 shrink-0">
          {([['grid', Grid2X2], ['list', List]] as [ViewMode, React.ElementType][]).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); localStorage.setItem('sr_media_view', mode) }}
              className={`p-2 rounded-md transition-colors ${
                viewMode === mode ? 'bg-[#2D2D38] text-[#E4E1EC]' : 'text-[#929095] hover:text-[#C8C5CB]'
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-[#47464B]/30 mb-6 overflow-x-auto pb-px">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2.5 text-sm font-mono whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeFilter === tab
                ? 'border-brand-cyan text-brand-cyan'
                : 'border-transparent text-[#929095] hover:text-[#C8C5CB]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Portfolio tab ─────────────────────────────────────────────────── */}
      {activeFilter === 'Portfolio' && (
        <PortfolioTab canUpload={can('media:upload')} />
      )}

      {/* ── Breadcrumbs ───────────────────────────────────────────────────── */}
      {activeFilter !== 'Portfolio' && activeFilter !== 'Favorites' && activeFilter !== 'Trash' && (
        <div className="flex items-center gap-2 mb-5 font-mono text-xs text-[#929095]">
          <button onClick={() => setCurrentFolderId(null)} className="hover:text-brand-cyan transition-colors">Home</button>
          {breadcrumbs.map(f => (
            <span key={f.id} className="flex items-center gap-2">
              <span className="text-white/20">/</span>
              <button onClick={() => setCurrentFolderId(f.id)} className="hover:text-brand-cyan transition-colors truncate max-w-[150px]">{f.name}</button>
            </span>
          ))}
        </div>
      )}

      {/* ── Media grid ────────────────────────────────────────────────────── */}
      {activeFilter !== 'Portfolio' && viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginated.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              onClick={() => asset.isFolder ? setCurrentFolderId(asset.id) : setSelected(asset)}
              className="group relative bg-[#1B1B23] rounded-xl border border-white/10 overflow-hidden hover:border-brand-cyan/50 transition-all duration-300 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden bg-[#13131A]">
                {asset.isFolder ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1F1F27]">
                    <Folder size={40} className="text-[#D2BBFF]/30 group-hover:scale-110 transition-transform" strokeWidth={1} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : asset.src ? (
                  <>
                    <img
                      src={asset.src}
                      alt={asset.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1F1F27]">
                    <FileAudio size={40} className="text-[#D2BBFF]/30 group-hover:scale-110 transition-transform" strokeWidth={1} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <div className="absolute top-3 left-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); updateMedia({ id: asset.id, data: { isFavorite: !asset.isFavorite }}) }} className="w-9 h-9 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl text-[#C8C5CB] hover:text-brand-gold hover:scale-105 transition-all shadow-lg">
                    <Star size={16} className={asset.isFavorite ? "fill-brand-gold text-brand-gold" : ""} />
                  </button>
                  {asset.isTrash ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmConfig({ title: 'Restore Asset', message: 'Are you sure you want to restore this item?', confirmText: 'Restore', confirmColor: 'bg-emerald-500 text-white hover:bg-emerald-600', onConfirm: () => updateMedia({ id: asset.id, data: { isTrash: false }}, { onSuccess: () => toast.success('Asset restored.'), onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to restore.') }) }) }} className="w-9 h-9 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl text-[#C8C5CB] hover:text-emerald-400 hover:scale-105 transition-all shadow-lg">
                        <RefreshCcw size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmConfig({ title: 'Permanently Delete', message: 'Are you sure you want to permanently delete this item? This action cannot be undone.', confirmText: 'Delete', confirmColor: 'bg-red-500 text-white hover:bg-red-600', onConfirm: () => deleteMedia(asset.id, { onSuccess: () => toast.success('Asset deleted.'), onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete.') }) }) }} className="w-9 h-9 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl text-[#C8C5CB] hover:text-red-400 hover:scale-105 transition-all shadow-lg">
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setConfirmConfig({ title: 'Move to Trash', message: 'Are you sure you want to move this item to the trash?', confirmText: 'Trash', confirmColor: 'bg-red-500 text-white hover:bg-red-600', onConfirm: () => updateMedia({ id: asset.id, data: { isTrash: true }}, { onSuccess: () => toast.success('Asset moved to trash.'), onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to trash asset.') }) }) }} className="w-9 h-9 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl text-[#C8C5CB] hover:text-red-400 hover:scale-105 transition-all shadow-lg">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className={`bg-black/60 backdrop-blur-sm font-mono text-[10px] px-2 py-0.5 rounded-full ${asset.badgeColor}`}>
                    {asset.badge}
                  </span>
                </div>

                {asset.type === 'video' && (
                  <div className="absolute bottom-2.5 left-2.5">
                    <Play size={18} className="text-white/70 fill-white/70" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-[#E4E1EC] text-sm font-medium truncate mb-1.5">{asset.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#929095]">
                    {asset.size}{asset.duration ? ` · ${asset.duration}` : ''}
                  </span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${asset.statusColor}`}>
                    {asset.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Upload drop zone */}
          {can('media:upload') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: filtered.length * 0.05 }}
              onClick={() => setUploadOpen(true)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); setUploadOpen(true) }}
              className="aspect-video border-2 border-dashed border-[#47464B]/50 hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 rounded-xl flex flex-col items-center justify-center gap-2 text-[#929095] hover:text-[#D2BBFF] transition-all cursor-pointer group"
            >
              <Upload size={24} strokeWidth={1.5} />
              <span className="font-mono text-xs uppercase tracking-wider">Drop files here</span>
            </motion.div>
          )}
        </div>
      ) : activeFilter !== 'Portfolio' ? (
        /* ── List view ─────────────────────────────────────────────────── */
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#47464B]/20">
                {['Name', 'Type', 'Size', 'Status', 'Added', ''].map((col) => (
                  <th key={col} className="px-6 py-3 text-left font-mono text-[10px] text-[#929095] uppercase tracking-widest font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((asset, i) => (
                <motion.tr
                  key={asset.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  onClick={() => asset.isFolder ? setCurrentFolderId(asset.id) : setSelected(asset)}
                  className="border-b border-[#47464B]/10 last:border-0 hover:bg-[#1F1F27]/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1F1F27] flex items-center justify-center shrink-0 overflow-hidden">
                        {asset.isFolder ? (
                          <Folder size={16} className="text-[#D2BBFF]/50" />
                        ) : asset.src ? (
                          <img src={asset.src} alt="" className="object-cover w-full h-full" />
                        ) : (
                          <FileAudio size={16} className="text-[#D2BBFF]/50" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#E4E1EC] text-sm font-medium truncate max-w-[200px]">{asset.name}</span>
                        <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); updateMedia({ id: asset.id, data: { isFavorite: !asset.isFavorite }}) }} className="text-[#929095] hover:text-brand-gold hover:scale-110 transition-all">
                            <Star size={14} className={asset.isFavorite ? "fill-brand-gold text-brand-gold" : ""} />
                          </button>
                          {asset.isTrash ? (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setConfirmConfig({ title: 'Restore Asset', message: 'Are you sure you want to restore this item?', confirmText: 'Restore', confirmColor: 'bg-emerald-500 text-white hover:bg-emerald-600', onConfirm: () => updateMedia({ id: asset.id, data: { isTrash: false }}, { onSuccess: () => toast.success('Asset restored.'), onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to restore.') }) }) }} className="text-[#929095] hover:text-emerald-400 hover:scale-110 transition-all"><RefreshCcw size={14} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setConfirmConfig({ title: 'Permanently Delete', message: 'Are you sure you want to permanently delete this item? This action cannot be undone.', confirmText: 'Delete', confirmColor: 'bg-red-500 text-white hover:bg-red-600', onConfirm: () => deleteMedia(asset.id, { onSuccess: () => toast.success('Asset deleted.'), onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete.') }) }) }} className="text-[#929095] hover:text-red-400 hover:scale-110 transition-all"><Trash2 size={14} /></button>
                            </>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); setConfirmConfig({ title: 'Move to Trash', message: 'Are you sure you want to move this item to the trash?', confirmText: 'Trash', confirmColor: 'bg-red-500 text-white hover:bg-red-600', onConfirm: () => updateMedia({ id: asset.id, data: { isTrash: true }}, { onSuccess: () => toast.success('Asset moved to trash.'), onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to trash asset.') }) }) }} className="text-[#929095] hover:text-red-400 hover:scale-110 transition-all"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border bg-black/30 ${asset.badgeColor} border-current/20`}>
                      {asset.badge}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[#929095] text-xs">
                    {asset.size}{asset.duration ? ` · ${asset.duration}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${asset.statusColor}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[#929095] text-xs">{new Date(asset.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <ChevronRight size={14} className="text-[#929095]" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeFilter !== 'Portfolio' && filtered.length === 0 && (
        <div className="py-20 text-center text-[#929095] font-mono text-sm uppercase tracking-wider">
          No assets match your search
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#47464B]/20">
        <p className="text-[#929095] font-mono text-xs">
          Showing {paginated.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} assets
        </p>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded hover:bg-[#1F1F27] disabled:opacity-50 text-[#929095] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const n = idx + 1
            return (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`w-8 h-8 rounded font-mono text-xs font-bold transition-colors ${
                  n === currentPage ? 'bg-[#D2BBFF] text-[#3F008E]' : 'text-[#929095] hover:bg-[#1F1F27]'
                }`}
              >
                {n}
              </button>
            )
          })}
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded hover:bg-[#1F1F27] disabled:opacity-50 text-[#929095] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} parentId={currentFolderId} />}
        {newFolderOpen && <NewFolderModal onClose={() => setNewFolderOpen(false)} parentId={currentFolderId} />}
        {selected    && <AssetModal asset={selected} onClose={() => setSelected(null)} />}
        {confirmConfig && (
          <ConfirmModal
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmText={confirmConfig.confirmText}
            confirmColor={confirmConfig.confirmColor}
            onConfirm={confirmConfig.onConfirm}
            onClose={() => setConfirmConfig(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
