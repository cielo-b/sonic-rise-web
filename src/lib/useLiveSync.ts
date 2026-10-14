'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { studioSlug } from './api'

interface RealtimeEvent {
  type: string
  studioId?: string
  entity?: string
  action?: string
  data?: Record<string, unknown>
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export function useLiveSync() {
  const qc = useQueryClient()
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const slug = studioSlug()
    const url = `${BASE_URL}/events/stream${slug ? `?studio=${encodeURIComponent(slug)}` : ''}`
    
    // Connect to Server-Sent Events stream
    const es = new EventSource(url, { withCredentials: true })
    sourceRef.current = es

    es.onmessage = (event) => {
      try {
        const payload: RealtimeEvent = JSON.parse(event.data)
        if (!payload || !payload.type) return

        switch (payload.type) {
          case 'BOOKING_CREATED':
          case 'BOOKING_UPDATED':
          case 'BOOKING_CANCELLED':
            void qc.invalidateQueries({ queryKey: ['bookings'] })
            void qc.invalidateQueries({ queryKey: ['reports', 'today'] })
            break

          case 'DELIVERABLE_COMMENT':
          case 'DELIVERABLE_UPDATED':
            void qc.invalidateQueries({ queryKey: ['deliverable'] })
            void qc.invalidateQueries({ queryKey: ['deliverables'] })
            break

          case 'CONTRACT_UPDATED':
            void qc.invalidateQueries({ queryKey: ['contracts'] })
            break

          case 'EQUIPMENT_UPDATED':
            void qc.invalidateQueries({ queryKey: ['equipment'] })
            break

          default:
            break
        }
      } catch {
        // Ignore unparseable frames or heartbeat pings
      }
    }

    return () => {
      es.close()
    }
  }, [qc])
}
