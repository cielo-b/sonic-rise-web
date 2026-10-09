import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="space-y-4">
        <p className="font-mono text-brand-cyan">404</p>
        <h1 className="font-headline text-3xl font-bold">Page not found</h1>
        <p className="text-text-muted">The page you are looking for does not exist or has moved.</p>
        <Link href="/" className="btn-primary">Go home</Link>
      </div>
    </main>
  )
}
