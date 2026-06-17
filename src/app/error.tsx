'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[SonicRise error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2.5 opacity-70 hover:opacity-100 transition-opacity">
        <SonicRiseMark className="w-7 h-7 text-brand-purple" />
        <span className="font-headline font-bold text-lg tracking-tight text-text-primary">SonicRise</span>
      </Link>

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
        <AlertTriangle size={36} className="text-red-400" strokeWidth={1.5} />
      </div>

      <span className="font-mono text-xs tracking-widest text-red-400 uppercase mb-4">
        Unexpected Error
      </span>
      <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-text-primary mb-4 tracking-tight">
        Something Broke
      </h1>
      <p className="text-text-muted text-lg max-w-md leading-relaxed mb-4">
        We hit an unexpected error. Your session data is safe — try reloading the page or head back home.
      </p>

      {/* Error digest for support */}
      {error.digest && (
        <p className="font-mono text-[11px] text-text-muted/50 mb-8">
          Error ID: <span className="text-text-muted">{error.digest}</span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
        <button
          onClick={reset}
          className="bg-brand-purple hover:opacity-90 transition-all px-8 py-3.5 rounded-lg font-headline font-bold text-sm tracking-wide text-white flex items-center gap-2"
        >
          <RotateCcw size={15} /> Try Again
        </button>
        <Link
          href="/"
          className="glass-card px-8 py-3.5 rounded-lg font-mono text-sm text-text-muted hover:text-text-primary hover:bg-white/10 transition-all"
        >
          Back to Home
        </Link>
      </div>

      <p className="absolute bottom-8 font-mono text-[10px] text-text-muted/40 uppercase tracking-widest">
        SonicRise Cinematic Studio · Kigali, Rwanda
      </p>
    </div>
  )
}
