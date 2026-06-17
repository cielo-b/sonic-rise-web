import Link from 'next/link'
import { SonicRiseMark } from '@/components/ui/SonicRiseLogo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-brand-cyan/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2.5 opacity-70 hover:opacity-100 transition-opacity">
        <SonicRiseMark className="w-7 h-7 text-brand-purple" />
        <span className="font-headline font-bold text-lg tracking-tight text-text-primary">SonicRise</span>
      </Link>

      {/* 404 */}
      <div className="relative mb-6">
        <p className="font-headline font-extrabold text-[160px] md:text-[220px] leading-none tracking-[-0.05em] bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-brand-purple to-transparent" />
        </div>
      </div>

      {/* Waveform decoration */}
      <div className="flex items-end gap-0.5 h-8 mb-8 opacity-30">
        {[4,7,12,5,9,14,6,10,3,8,13,5,11,4,7,14,9,6,12,5,8,3,10,7,4].map((h, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-brand-cyan"
            style={{ height: `${h * 2}px` }}
          />
        ))}
      </div>

      <span className="font-mono text-xs tracking-widest text-brand-cyan uppercase mb-4">
        Signal Not Found
      </span>
      <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-text-primary mb-4 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-text-muted text-lg max-w-md leading-relaxed mb-10">
        The frequency you&apos;re looking for isn&apos;t in our signal chain. It may have moved, been removed, or never existed.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="bg-brand-purple hover:opacity-90 transition-all px-8 py-3.5 rounded-lg font-headline font-bold text-sm tracking-wide text-white hero-glow"
        >
          Back to Home
        </Link>
        <Link
          href="/portfolio"
          className="glass-card px-8 py-3.5 rounded-lg font-mono text-sm text-text-muted hover:text-text-primary hover:bg-white/10 transition-all"
        >
          Browse Portfolio
        </Link>
      </div>

      {/* Bottom mono label */}
      <p className="absolute bottom-8 font-mono text-[10px] text-text-muted/40 uppercase tracking-widest">
        SonicRise Cinematic Studio · Kigali, Rwanda
      </p>
    </div>
  )
}
