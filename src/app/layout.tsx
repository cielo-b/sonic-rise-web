import type { Metadata, Viewport } from 'next'
import { Sora, Geist, JetBrains_Mono } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { Toaster } from 'sonner'
import './globals.css'

// ─── Font definitions (next/font — zero-CLS, self-hosted) ─────────────────
const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

// ─── Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'SonicRise Cinematic Studio',
    template: '%s | SonicRise',
  },
  description: "Rwanda's premier cinematic creative studio — music production, film, and visual storytelling.",
  keywords: ['SonicRise', 'Rwanda', 'cinematic studio', 'music production', 'film production'],
}

export const viewport: Viewport = {
  themeColor: '#0B0B0F',
  colorScheme: 'dark',
}

// ─── Root layout ──────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // `dark` class is always present — this app enforces a strict dark aesthetic
      className={`dark ${sora.variable} ${geist.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-bg-main text-text-primary antialiased">
        <QueryProvider>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1A1A22',
                border: '1px solid #2E2D35',
                color: '#E4E1EC',
                fontFamily: 'var(--font-geist)',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
