'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Star } from 'lucide-react'
import { toast } from 'sonner'
import { api, type PortfolioItem } from '@/lib/api'
import { Button, Card, Checkbox, ConfirmButton, EmptyState, Field, ImageUpload, Input, Loading, Modal, PageHeader, Textarea, errorMessage } from '@/components/ui'

function ItemForm({ item, open, onClose }: { item: PortfolioItem | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const init = () => ({
    title: item?.title ?? '',
    category: item?.category ?? '',
    mediaUrl: item?.mediaUrl ?? '',
    thumbnailUrl: item?.thumbnailUrl ?? '',
    description: item?.description ?? '',
    isFeatured: item?.isFeatured ?? false,
    sortOrder: item?.sortOrder ?? 0,
  })
  const [f, setF] = useState(init)
  const [lastId, setLastId] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  if (open && lastId !== (item?.id ?? null)) {
    setLastId(item?.id ?? null)
    setF(init())
  }
  if (!open && lastId !== undefined) setLastId(undefined)

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit work' : 'Add work'} footer={<><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" form="pf-form" loading={busy}>Save</Button></>}>
      <form
        id="pf-form"
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            const data = {
              title: f.title.trim(),
              category: f.category.trim(),
              mediaUrl: f.mediaUrl.trim(),
              thumbnailUrl: f.thumbnailUrl.trim() || undefined,
              description: f.description.trim() || undefined,
              isFeatured: f.isFeatured,
              sortOrder: Number(f.sortOrder) || 0,
            } as Partial<PortfolioItem>
            if (item) await api.portfolio.update(item.id, data)
            else await api.portfolio.create(data)
            void qc.invalidateQueries({ queryKey: ['portfolio'] })
            onClose()
          } catch (err) {
            toast.error(errorMessage(err))
          } finally {
            setBusy(false)
          }
        }}
      >
        <Field label="Title"><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Category" hint="e.g. Music video, Album, Podcast, Commercial"><Input required value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
        <Field label="Media" hint="Upload an image, video or audio file — or paste a YouTube / Vimeo link">
          <div className="space-y-2">
            <ImageUpload value={f.mediaUrl || null} onChange={(url) => setF({ ...f, mediaUrl: url ?? '' })} accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4" label="Upload file" />
            <Input type="url" placeholder="https://youtube.com/watch?v=…" value={f.mediaUrl} onChange={(e) => setF({ ...f, mediaUrl: e.target.value })} required />
          </div>
        </Field>
        <Field label="Cover image" hint="Shown for videos and audio"><ImageUpload value={f.thumbnailUrl || null} onChange={(url) => setF({ ...f, thumbnailUrl: url ?? '' })} /></Field>
        <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="flex items-center gap-6">
          <Checkbox checked={f.isFeatured} onChange={(e) => setF({ ...f, isFeatured: e.target.checked })} label="Feature on the home page" />
          <Field label="Order" className="w-24"><Input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></Field>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminPortfolio() {
  const q = useQuery({ queryKey: ['portfolio', 'all'], queryFn: api.portfolio.list })
  const [edit, setEdit] = useState<PortfolioItem | null | 'new'>(null)
  return (
    <>
      <PageHeader title="Portfolio" subtitle="Your work, shown on the website." actions={<Button onClick={() => setEdit('new')}><Plus size={16} /> Add work</Button>} />
      {q.isLoading ? (
        <Loading />
      ) : !q.data?.length ? (
        <EmptyState title="Nothing published yet">Add music videos, albums or projects you’re proud of.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((i) => {
            const cover = i.thumbnailUrl ?? (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(i.mediaUrl) ? i.mediaUrl : null)
            return (
              <Card key={i.id} className="overflow-hidden">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- studio-uploaded media
                  <img src={cover} alt="" className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-brand-purple/30 to-brand-cyan/10" />
                )}
                <div className="p-4">
                  <p className="text-xs font-mono uppercase text-brand-cyan">{i.category}</p>
                  <p className="font-medium flex items-center gap-2">{i.title}{i.isFeatured && <Star size={14} className="text-amber-300 fill-amber-300" />}</p>
                  <div className="flex gap-1 mt-2">
                    <Button variant="quiet" onClick={() => setEdit(i)}>Edit</Button>
                    <ConfirmButton variant="quiet" onConfirm={async () => { await api.portfolio.remove(i.id); void q.refetch() }}>Delete</ConfirmButton>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <ItemForm open={!!edit} onClose={() => setEdit(null)} item={edit === 'new' ? null : edit} />
    </>
  )
}
