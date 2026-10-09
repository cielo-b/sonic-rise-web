'use client'

/** Animated equalizer bars — decorative, hidden from screen readers. */
export function Equalizer({ bars = 48, className = '' }: { bars?: number; className?: string }) {
  return (
    <div aria-hidden className={`flex items-end gap-[3px] ${className}`}>
      {Array.from({ length: bars }, (_, i) => {
        // Deterministic pseudo-random heights and timings so SSR and client match.
        const h = 30 + ((i * 37) % 70)
        const delay = ((i * 53) % 100) / 100
        const dur = 0.8 + ((i * 29) % 60) / 100
        return (
          <span
            key={i}
            className="eq-bar flex-1 rounded-t-sm bg-gradient-to-t from-brand-purple via-brand-cyan to-[#ff4fd8]"
            style={{ height: `${h}%`, animationDelay: `-${delay}s`, animationDuration: `${dur}s`, opacity: 0.35 + (h / 100) * 0.55 }}
          />
        )
      })}
    </div>
  )
}

/** Endless horizontal ticker of words. */
export function Marquee({ items, className = '' }: { items: string[]; className?: string }) {
  if (!items.length) return null
  const row = [...items, ...items, ...items, ...items]
  return (
    <div className={`overflow-hidden whitespace-nowrap select-none ${className}`} aria-hidden>
      <div className="marquee-track inline-flex">
        {[0, 1].map((copy) => (
          <span key={copy} className="inline-flex items-center">
            {row.map((w, i) => (
              <span key={`${copy}-${i}`} className="inline-flex items-center">
                <span className={i % 2 ? 'text-outline-loud' : 'text-text-primary'}>{w}</span>
                <span className="mx-8 text-brand-cyan">✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Drifting blurred colour orbs for backgrounds. */
export function Orbs() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="orb absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-brand-purple/40" />
      <div className="orb absolute top-1/3 -right-1/4 w-[50vw] h-[50vw] rounded-full bg-brand-cyan/25" style={{ animationDelay: '-6s' }} />
      <div className="orb absolute -bottom-1/3 left-1/4 w-[45vw] h-[45vw] rounded-full bg-[#ff4fd8]/20" style={{ animationDelay: '-12s' }} />
    </div>
  )
}
