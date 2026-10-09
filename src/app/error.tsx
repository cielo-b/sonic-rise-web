'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="space-y-4">
        <h1 className="font-headline text-3xl font-bold">Something went wrong</h1>
        <p className="text-text-muted">Please try again. If it keeps happening, contact the studio.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-glass">Go home</Link>
        </div>
      </div>
    </main>
  )
}
