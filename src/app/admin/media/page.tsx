'use client'

import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Copy, Folder, FolderPlus, Music, Star, Trash2, Undo2, Upload, Video } from 'lucide-react'
import { toast } from 'sonner'
import { api, type MediaAsset } from '@/lib/api'
import { Button, Card, ConfirmButton, EmptyState, Input, Loading, Modal, PageHeader, Tabs, errorMessage } from '@/components/ui'

type View = 'files' | 'favorites' | 'trash'

export default function MediaPage() {
  const q = useQuery({ queryKey: ['media'], queryFn: api.media.list })
  const [view, setView] = useState<View>('files')
  const [folder, setFolder] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [progress, setProgress] = useState<string | null>(null)
  const [newFolder, setNewFolder] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const all = useMemo(() => q.data ?? [], [q.data])

  const items = all.filter((m) => {
    if (search.trim()) return !m.isTrash && m.name.toLowerCase().includes(search.trim().toLowerCase())
    if (view === 'trash') return m.isTrash
    if (view === 'favorites') return m.isFavorite && !m.isTrash
    return !m.isTrash && m.parentId === folder
  })
  const crumbs: MediaAsset[] = []
  for (let f = all.find((m) => m.id === folder); f; f = all.find((m) => m.id === f!.parentId)) crumbs.unshift(f)

  async function upload(files: FileList | null) {
    if (!files?.length) return
    try {
      for (const [i, file] of Array.from(files).entries()) {
        const res = await api.upload(file, (p) => setProgress(`${i + 1}/${files.length} · ${p}%`))
        await api.media.create({ name: res.name, type: res.type, mimeType: res.mimeType, size: res.size, url: res.url, parentId: folder })
      }
      toast.success('Uploaded')
      void q.refetch()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function patch(m: MediaAsset, data: Partial<MediaAsset>) {
    try {
      await api.media.update(m.id, data)
      void q.refetch()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Media library"
        subtitle="Images, video and audio for your website. Client deliverables live in Projects."
        actions={
          <>
            <Button variant="glass" onClick={() => setNewFolder('')}><FolderPlus size={16} /> Folder</Button>
            <input ref={fileRef} type="file" multiple className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg" onChange={(e) => upload(e.target.files)} />
            <Button onClick={() => fileRef.current?.click()} loading={!!progress}><Upload size={16} /> {progress ?? 'Upload'}</Button>
          </>
        }
      />
      <Tabs value={view} onChange={(v) => { setView(v); setFolder(null) }} tabs={[{ value: 'files', label: 'Files' }, { value: 'favorites', label: 'Favourites' }, { value: 'trash', label: 'Trash', count: all.filter((m) => m.isTrash).length }]} />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {view === 'files' && (
          <nav className="flex items-center gap-1 text-sm">
            <button onClick={() => setFolder(null)} className="hover:text-brand-cyan">All files</button>
            {crumbs.map((c) => (
              <span key={c.id} className="flex items-center gap-1"><ChevronRight size={14} className="text-outline" /><button onClick={() => setFolder(c.id)} className="hover:text-brand-cyan">{c.name}</button></span>
            ))}
          </nav>
        )}
        <Input placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs ml-auto" />
      </div>
      {q.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState title={view === 'trash' ? 'Trash is empty' : 'No files here'} />
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <Card key={m.id} className="overflow-hidden group">
              <button
                className="block w-full aspect-square bg-surface-container"
                onClick={() => (m.isFolder ? (setView('files'), setFolder(m.id), setSearch('')) : m.url && window.open(m.url, '_blank'))}
              >
                {m.isFolder ? (
                  <Folder size={40} className="mx-auto text-brand-cyan" />
                ) : m.type === 'image' && m.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded media
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                ) : m.type === 'video' ? (
                  <Video size={36} className="mx-auto text-text-muted" />
                ) : (
                  <Music size={36} className="mx-auto text-text-muted" />
                )}
              </button>
              <div className="p-2.5">
                <p className="text-xs truncate" title={m.name}>{m.name}</p>
                <p className="text-[11px] text-outline">{m.isFolder ? `${all.filter((x) => x.parentId === m.id && !x.isTrash).length} items` : m.size}</p>
                <div className="flex gap-1 mt-1.5 text-text-muted">
                  {m.isTrash ? (
                    <>
                      <button aria-label="Restore" title="Restore" onClick={() => patch(m, { isTrash: false })} className="p-1 hover:text-text-primary"><Undo2 size={14} /></button>
                      <ConfirmButton variant="quiet" onConfirm={async () => { await api.media.remove(m.id); void q.refetch() }} confirmLabel="Delete forever?">
                        <Trash2 size={14} />
                      </ConfirmButton>
                    </>
                  ) : (
                    <>
                      <button aria-label="Favourite" title="Favourite" onClick={() => patch(m, { isFavorite: !m.isFavorite })} className="p-1 hover:text-text-primary">
                        <Star size={14} className={m.isFavorite ? 'fill-amber-300 text-amber-300' : ''} />
                      </button>
                      {m.url && (
                        <button aria-label="Copy link" title="Copy link" onClick={() => navigator.clipboard.writeText(m.url!).then(() => toast.success('Link copied'))} className="p-1 hover:text-text-primary">
                          <Copy size={14} />
                        </button>
                      )}
                      <button aria-label="Move to trash" title="Move to trash" onClick={() => patch(m, { isTrash: true })} className="p-1 hover:text-text-primary"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal
        open={newFolder !== null}
        onClose={() => setNewFolder(null)}
        title="New folder"
        footer={
          <Button
            disabled={!newFolder?.trim()}
            onClick={async () => {
              try {
                await api.media.create({ name: newFolder!.trim(), type: 'folder', isFolder: true, parentId: folder })
                setNewFolder(null)
                void q.refetch()
              } catch (err) {
                toast.error(errorMessage(err))
              }
            }}
          >
            Create
          </Button>
        }
      >
        <Input autoFocus value={newFolder ?? ''} onChange={(e) => setNewFolder(e.target.value)} placeholder="Folder name" />
      </Modal>
    </>
  )
}
