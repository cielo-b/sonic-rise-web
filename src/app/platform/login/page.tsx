'use client'

import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/AuthForms'

export default function PlatformLoginPage() {
  const router = useRouter()
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-8">
        <h1 className="font-headline text-2xl font-bold mb-6">Platform sign-in</h1>
        <LoginForm platform onDone={(u) => router.replace(u.role === 'PLATFORM_ADMIN' ? '/platform' : '/')} />
      </div>
    </main>
  )
}
