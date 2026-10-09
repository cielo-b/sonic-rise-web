'use client'

import { use } from 'react'
import { DeliverableReview } from '@/components/DeliverableReview'

export default function FilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <DeliverableReview id={id} />
}
