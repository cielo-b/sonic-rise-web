'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { BookingStatus } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { initials } from '@/lib/format'

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} size={18} aria-hidden />
}

export function Button({
  children,
  loading,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  variant?: 'primary' | 'glass' | 'danger' | 'quiet'
  size?: 'sm' | 'md' | 'lg'
}) {
  const styles = {
    primary: 'btn-primary',
    glass: 'btn-glass',
    danger: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-colors',
    quiet: 'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors',
  }[variant]
  const sizeCls = size === 'sm' ? '!text-xs !px-2.5 !py-1' : size === 'lg' ? '!text-base !px-5 !py-3' : ''
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`${styles} ${sizeCls} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
  className = '',
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="block text-xs font-semibold text-text-primary/90 tracking-wide">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-outline">{hint}</span>}
      {error && <span className="block text-xs text-red-300">{error}</span>}
    </label>
  )
}

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`input-studio text-sm ${props.className ?? ''}`} />
)
export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea rows={4} {...props} className={`input-studio text-sm resize-y ${props.className ?? ''}`} />
)
export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`input-studio text-sm ${props.className ?? ''}`} />
)

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-text-muted cursor-pointer">
      <input type="checkbox" {...props} className="mt-0.5 w-4 h-4 accent-[var(--brand)] shrink-0" />
      <span>{label}</span>
    </label>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card rounded-xl ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="font-headline text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <p className="font-headline text-text-primary font-semibold">{title}</p>
      {children && <p className="text-sm text-text-muted mt-1.5 max-w-md mx-auto">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-text-muted">
      <Spinner />
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <EmptyState title="Couldn’t load this" action={onRetry && <Button variant="glass" onClick={onRetry}>Try again</Button>}>
      {errorMessage(error)}
    </EmptyState>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-[#161622] border border-white/10 rounded-2xl w-full ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        } max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col shadow-2xl overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-[#161622]">
          <h2 className="font-headline text-lg font-semibold text-text-primary truncate pr-2">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          {children}
        </div>
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-white/10 flex items-center justify-end gap-2.5 shrink-0 bg-[#161622]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

const STATUS_STYLE: Record<string, string> = {
  PENDING_DEPOSIT: 'chip-warning',
  PENDING: 'chip-warning',
  CONFIRMED: 'chip-info',
  COMPLETED: 'chip-success',
  CANCELLED: 'chip-error',
  NO_SHOW: 'chip-error',
  DRAFT: 'chip-purple',
  SENT: 'chip-info',
  ACCEPTED: 'chip-success',
  DECLINED: 'chip-error',
  CONVERTED: 'chip-purple',
  ISSUED: 'chip-info',
  PARTIALLY_PAID: 'chip-warning',
  PAID: 'chip-success',
  VOID: 'chip-error',
  IN_REVIEW: 'chip-warning',
  CHANGES_REQUESTED: 'chip-error',
  APPROVED: 'chip-success',
  SUCCESS: 'chip-success',
  FAILED: 'chip-error',
}

export function Badge({ status, label }: { status: string; label?: string }) {
  const { t } = useI18n()
  const text =
    label ??
    (['PENDING_DEPOSIT', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)
      ? t(`status.${status as BookingStatus}`)
      : status.replace(/_/g, ' ').toLowerCase())
  return <span className={`chip ${STATUS_STYLE[status] ?? 'chip-purple'}`}>{text}</span>
}

export function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL on any host
    return <img src={url} alt="" width={size} height={size} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  }
  return (
    <span
      className="rounded-full bg-brand-purple/20 text-text-primary flex items-center justify-center font-mono font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size / 3 }}
    >
      {initials(name) || '?'}
    </span>
  )
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-white/10 mb-5" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
            value === tab.value ? 'border-brand-purple text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && <span className="ml-1.5 text-xs text-outline">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Uploads a public website file and returns its URL. */
export function ImageUpload({
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  label = 'Upload image',
}: {
  value?: string | null
  onChange: (url: string | null) => void
  accept?: string
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  async function pick(file?: File) {
    if (!file) return
    setProgress(0)
    try {
      const res = await api.upload(file, setProgress)
      onChange(res.url)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setProgress(null)
      if (ref.current) ref.current.value = ''
    }
  }
  const isVideo = !!value && /\.(mp4|mov|webm)$/i.test(value)
  return (
    <div className="flex items-center gap-3">
      {value &&
        (isVideo ? (
          <video src={value} className="w-20 h-14 rounded-lg object-cover bg-black" muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded file on the studio's storage
          <img src={value} alt="" className="w-20 h-14 rounded-lg object-cover bg-black" />
        ))}
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <Button type="button" variant="glass" onClick={() => ref.current?.click()} loading={progress !== null}>
        <Upload size={14} /> {progress !== null ? `${progress}%` : value ? 'Replace' : label}
      </Button>
      {value && (
        <Button type="button" variant="quiet" onClick={() => onChange(null)}>
          Remove
        </Button>
      )}
    </div>
  )
}

export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Are you sure you want to proceed?',
  confirmText = 'Yes, Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title?: string
  message?: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  loading?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, loading])

  if (!open || typeof document === 'undefined') return null

  const isDanger = variant === 'danger'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-[#161622] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="font-headline text-base font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="glass" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Opens a dedicated confirmation modal before running the action. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel,
  title,
  message,
  variant = 'danger',
  size = 'md',
  className = '',
}: {
  onConfirm: () => Promise<unknown> | void
  children: React.ReactNode
  confirmLabel?: string
  title?: string
  message?: string
  variant?: 'danger' | 'glass' | 'quiet' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const actionText = typeof children === 'string' ? children : 'proceed'
  const computedTitle = title || (confirmLabel ? confirmLabel.replace(/\?$/, '') : `Confirm ${actionText}`)
  const computedMessage =
    message || `Are you sure you want to ${actionText.toLowerCase()}? This action cannot be undone.`
  const buttonLabel = confirmLabel || (variant === 'danger' ? `Yes, ${actionText}` : 'Confirm')

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setModalOpen(true)}
      >
        {children}
      </Button>

      <ConfirmationModal
        open={modalOpen}
        onClose={() => !busy && setModalOpen(false)}
        loading={busy}
        title={computedTitle}
        message={computedMessage}
        confirmText={buttonLabel}
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onConfirm={async () => {
          setBusy(true)
          try {
            await onConfirm()
            setModalOpen(false)
          } catch (err) {
            toast.error(errorMessage(err))
          } finally {
            setBusy(false)
          }
        }}
      />
    </>
  )
}

/** Copies text with feedback. */
export function CopyField({ value }: { value: string }) {
  return (
    <div className="flex gap-2">
      <Input readOnly value={value} onFocus={(e) => e.target.select()} />
      <Button
        type="button"
        variant="glass"
        onClick={() => navigator.clipboard.writeText(value).then(() => toast.success('Copied'))}
      >
        Copy
      </Button>
    </div>
  )
}
