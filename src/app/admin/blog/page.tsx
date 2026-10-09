'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api, type Post } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useRequiredStudio } from '@/context/StudioContext'
import { formatDate } from '@/lib/format'
import { Button, Card, Checkbox, ConfirmButton, EmptyState, Field, ImageUpload, Input, Loading, Modal, PageHeader, Textarea, errorMessage } from '@/components/ui'

function PostForm({ post, open, onClose }: { post: Post | null; open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const init = () => ({
    title: post?.title ?? '',
    category: post?.category ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    coverUrl: post?.coverUrl ?? '',
    authorName: post?.authorName ?? user?.name ?? '',
    featured: post?.featured ?? false,
    published: post?.published ?? false,
  })
  const [f, setF] = useState(init)
  const [lastId, setLastId] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  if (open && lastId !== (post?.id ?? null)) {
    setLastId(post?.id ?? null)
    setF(init())
  }
  if (!open && lastId !== undefined) setLastId(undefined)

  return (
    <Modal open={open} onClose={onClose} wide title={post ? 'Edit post' : 'New post'} footer={<><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" form="post-form" loading={busy}>{f.published ? 'Publish' : 'Save draft'}</Button></>}>
      <form
        id="post-form"
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            const data = { ...f, coverUrl: f.coverUrl || undefined } as Partial<Post>
            if (post) await api.posts.update(post.id, data)
            else await api.posts.create(data)
            void qc.invalidateQueries({ queryKey: ['posts'] })
            onClose()
          } catch (err) {
            toast.error(errorMessage(err))
          } finally {
            setBusy(false)
          }
        }}
      >
        <Field label="Title"><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Category"><Input required value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="e.g. Behind the scenes" /></Field>
          <Field label="Author"><Input required value={f.authorName} onChange={(e) => setF({ ...f, authorName: e.target.value })} /></Field>
        </div>
        <Field label="Summary" hint="Shown on the blog list"><Textarea rows={2} required value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} /></Field>
        <Field label="Article" hint="Blank lines start a new paragraph"><Textarea rows={12} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field>
        <Field label="Cover image"><ImageUpload value={f.coverUrl || null} onChange={(url) => setF({ ...f, coverUrl: url ?? '' })} /></Field>
        <div className="flex gap-6">
          <Checkbox checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} label="Published (visible on the website)" />
          <Checkbox checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} label="Featured" />
        </div>
      </form>
    </Modal>
  )
}

export default function AdminBlog() {
  const studio = useRequiredStudio()
  const q = useQuery({ queryKey: ['posts', 'all'], queryFn: api.posts.all })
  const subs = useQuery({ queryKey: ['subscribers'], queryFn: async () => (await api.subscribers.list()).length })
  const [edit, setEdit] = useState<Post | null | 'new'>(null)
  return (
    <>
      <PageHeader
        title="Blog"
        subtitle={subs.data !== undefined ? `${subs.data} newsletter subscriber${subs.data === 1 ? '' : 's'}` : undefined}
        actions={<Button onClick={() => setEdit('new')}><Plus size={16} /> New post</Button>}
      />
      {q.isLoading ? (
        <Loading />
      ) : !q.data?.length ? (
        <EmptyState title="No posts yet">Share studio news, behind-the-scenes and tips.</EmptyState>
      ) : (
        <div className="space-y-2">
          {q.data.map((p) => (
            <Card key={p.id} className="p-4 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-text-muted">{p.category} · {p.authorName} · {formatDate(p.createdAt, studio.timezone)} · {p.readTime}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.published ? <span className="chip chip-success">Published</span> : <span className="chip chip-purple">Draft</span>}
                {p.published && <a href={`/blog/${p.slug}`} target="_blank" className="text-sm text-brand-cyan hover:underline">View</a>}
                <Button variant="quiet" onClick={() => setEdit(p)}>Edit</Button>
                <ConfirmButton variant="quiet" onConfirm={async () => { await api.posts.remove(p.id); void q.refetch() }}>Delete</ConfirmButton>
              </div>
            </Card>
          ))}
        </div>
      )}
      <PostForm open={!!edit} onClose={() => setEdit(null)} post={edit === 'new' ? null : edit} />
    </>
  )
}

