'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { PortfolioTile } from '@/components/site/PortfolioTile'
import { Loading } from '@/components/ui'

export default function PortfolioPage() {
  const { t } = useI18n()
  const q = useQuery({ queryKey: ['portfolio', 'all'], queryFn: api.portfolio.list })
  const [category, setCategory] = useState<string | null>(null)
  const categories = useMemo(() => Array.from(new Set((q.data ?? []).map((i) => i.category))), [q.data])
  const items = (q.data ?? []).filter((i) => !category || i.category === category)

  return (
    <div className="container-studio py-16">
      <h1 className="font-headline text-4xl font-bold">{t('portfolio.title')}</h1>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? 'all'}
              onClick={() => setCategory(c)}
              className={`chip ${category === c ? 'chip-purple' : 'bg-white/5 text-text-muted'}`}
            >
              {c ?? t('portfolio.all')}
            </button>
          ))}
        </div>
      )}
      {q.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="text-text-muted mt-8">{t('portfolio.empty')}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <PortfolioTile key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
