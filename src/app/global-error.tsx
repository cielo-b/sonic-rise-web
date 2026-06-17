'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[SonicRise global error]', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <span className="text-red-400 text-2xl font-bold">!</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'sans-serif' }}>
          Critical Error
        </h1>
        <p className="text-gray-400 mb-8 max-w-sm" style={{ fontFamily: 'sans-serif' }}>
          The application encountered a critical error. Please reload the page.
        </p>
        {error.digest && (
          <p className="text-gray-600 text-xs mb-6 font-mono">ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
          style={{ fontFamily: 'sans-serif' }}
        >
          <RotateCcw size={15} /> Reload
        </button>
      </body>
    </html>
  )
}
