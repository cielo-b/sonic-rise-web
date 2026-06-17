'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Edit2, Trash2, Eye, EyeOff, Star, ChevronDown } from 'lucide-react'
import { usePosts, useCreatePost, useUpdatePost, useDeletePost } from '@/lib/queries'
import { toast } from 'sonner'
import type { ApiPost } from '@/lib/api'

const CATEGORIES = ['Studio Notes', 'Music', 'Film', 'Tech', 'Industry', 'Events']

type FormData = {
  title: string; slug: string; category: string; excerpt: string
  content: string; coverUrl: string; readTime: string
  authorName: string; featured: boolean; published: boolean
}

const EMPTY: FormData = {
  title: '', slug: '', category: 'Studio Notes', excerpt: '', content: '',
  coverUrl: '', readTime: '5 min', authorName: '', featured: false, published: false,
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function ConfirmModal({
  title, message, onConfirm, onCancel, confirmText = 'Confirm', isDestructive = false
}: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText?: string; isDestructive?: boolean
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card rounded-2xl p-8 max-w-sm w-full border border-white/10 shadow-2xl">
        <h3 className="font-headline text-xl font-bold text-[#E4E1EC] mb-2">{title}</h3>
        <p className="text-[#929095] text-sm mb-8">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm text-[#929095] hover:text-[#E4E1EC] transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${isDestructive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-brand-cyan text-[#004e5f] hover:bg-[#3CD7FF] hover:shadow-[0_0_15px_rgba(60,215,255,0.4)]'}`}>
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}


function PostForm({
  initial, onSubmit, onClose, isPending,
}: { initial: FormData; onSubmit: (d: FormData) => void; onClose: () => void; isPending: boolean }) {
  const [form, setForm] = useState<FormData>(initial)
  const set = (k: keyof FormData, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22, ease: 'easeOut' }}
        className="glass-card rounded-2xl w-full max-w-2xl my-8"
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-headline text-[#E4E1EC] font-bold text-lg">
            {initial.title ? 'Edit Post' : 'New Post'}
          </h3>
          <button onClick={onClose} className="text-[#929095] hover:text-[#E4E1EC] transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Title *</label>
              <input value={form.title} onChange={(e) => { set('title', e.target.value); if (!initial.title) set('slug', toSlug(e.target.value)) }}
                placeholder="Inside Dolby Atmos: How We Mix…" className="input-studio text-sm w-full" required />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Slug</label>
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated" className="input-studio text-sm w-full font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Category</label>
              <div className="relative">
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-studio text-sm w-full appearance-none pr-9">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929095] pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Author Name *</label>
              <input value={form.authorName} onChange={(e) => set('authorName', e.target.value)} placeholder="Jean-Luc Amahoro" className="input-studio text-sm w-full" required />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Read Time</label>
              <input value={form.readTime} onChange={(e) => set('readTime', e.target.value)} placeholder="5 min" className="input-studio text-sm w-full" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Cover Image URL</label>
              <input value={form.coverUrl} onChange={(e) => set('coverUrl', e.target.value)} placeholder="https://…" className="input-studio text-sm w-full" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Excerpt *</label>
              <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} placeholder="A compelling summary shown on the blog listing…" className="input-studio text-sm w-full resize-none" required />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[#929095]">Content (Markdown or plain text)</label>
              <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={8} placeholder="Write your post here…" className="input-studio text-sm w-full resize-y font-mono text-xs" />
            </div>
            <div className="md:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="w-4 h-4 rounded accent-brand-purple" />
                <span className="text-[#C8C5CB] text-sm">Featured post</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="w-4 h-4 rounded accent-brand-cyan" />
                <span className="text-[#C8C5CB] text-sm">Published (visible to public)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn-ghost text-sm flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary text-sm flex-1 py-2.5 disabled:opacity-60">
              {isPending ? 'Saving…' : initial.title ? 'Save Changes' : 'Publish Post'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function AdminBlogPage() {
  const { data: posts = [], isLoading } = usePosts(true) // all=true → includes drafts
  const { mutate: create, isPending: creating } = useCreatePost()
  const { mutate: update, isPending: updating } = useUpdatePost()
  const { mutate: remove } = useDeletePost()

  const [formOpen, setFormOpen]   = useState(false)
  const [editing, setEditing]     = useState<ApiPost | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  function openNew()           { setEditing(null); setFormOpen(true) }
  function openEdit(p: ApiPost){ setEditing(p);    setFormOpen(true) }

  function handleSubmit(data: FormData) {
    const payload = { ...data, coverUrl: data.coverUrl || undefined }
    if (editing) {
      update(
        { id: editing.id, data: payload },
        {
          onSuccess: () => { setFormOpen(false); toast.success('Post updated.') },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update post.'),
        },
      )
    } else {
      create(
        payload,
        {
          onSuccess: () => { setFormOpen(false); toast.success('Post published.') },
          onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create post.'),
        },
      )
    }
  }

  const initialForm: FormData = editing
    ? { title: editing.title, slug: editing.slug, category: editing.category, excerpt: editing.excerpt, content: editing.content, coverUrl: editing.coverUrl ?? '', readTime: editing.readTime, authorName: editing.authorName, featured: editing.featured, published: editing.published }
    : EMPTY

  return (
    <div className="p-5 md:p-8 min-h-screen">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-headline text-[#E4E1EC] text-2xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-[#C8C5CB] text-sm mt-1">Manage articles published on the SonicRise Journal.</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm gap-2 py-2.5 px-5 shrink-0">
          <Plus size={15} /> New Post
        </button>
      </div>

      {isLoading && (
        <div className="py-20 text-center text-[#929095] font-mono text-sm">Loading posts…</div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="glass-card rounded-xl p-16 text-center">
          <p className="text-[#929095] font-mono text-sm uppercase tracking-widest mb-4">No posts yet</p>
          <button onClick={openNew} className="btn-primary text-sm px-8 py-2.5">Write your first post</button>
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="glass-card rounded-xl p-5 flex items-start gap-4 hover:border-white/20 transition-colors">
            {/* Cover thumb */}
            {post.coverUrl && (
              <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-[#1B1B23]">
                <img src={post.coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[10px] text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full">{post.category}</span>
                {post.featured && <span className="flex items-center gap-1 font-mono text-[10px] text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-2 py-0.5 rounded-full"><Star size={9} className="fill-brand-gold" />Featured</span>}
                {post.published
                  ? <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400"><Eye size={10} />Published</span>
                  : <span className="flex items-center gap-1 font-mono text-[10px] text-[#929095]"><EyeOff size={10} />Draft</span>
                }
              </div>
              <h3 className="text-[#E4E1EC] font-semibold text-sm leading-snug mb-0.5">{post.title}</h3>
              <p className="text-[#929095] text-xs line-clamp-1">{post.excerpt}</p>
              <p className="font-mono text-[10px] text-[#929095] mt-1">
                {post.authorName} · {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {post.readTime}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(post)} className="w-8 h-8 flex items-center justify-center rounded-lg glass-card text-[#929095] hover:text-brand-cyan transition-colors">
                <Edit2 size={13} />
              </button>
              <button onClick={() => setDeleteTarget({ id: post.id, title: post.title })} className="w-8 h-8 flex items-center justify-center rounded-lg glass-card text-[#929095] hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {formOpen && (
          <PostForm
            initial={initialForm}
            onSubmit={handleSubmit}
            onClose={() => setFormOpen(false)}
            isPending={creating || updating}
          />
        )}
        {deleteTarget && (
          <ConfirmModal
            title="Delete Blog Post"
            message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
            confirmText="Delete Post"
            isDestructive={true}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => {
              remove(deleteTarget.id, {
                onSuccess: () => toast.success('Post deleted.'),
                onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete post.'),
              });
              setDeleteTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
