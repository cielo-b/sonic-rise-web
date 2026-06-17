import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, clearToken } from '@/lib/api'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const QK = {
  bookings:          ['bookings']             as const,
  portfolioAll:      ['portfolio', 'all']     as const,
  portfolioFeatured: ['portfolio', 'featured'] as const,
  clients:           ['clients']              as const,
  users:             ['users']                as const,
  me:                ['me']                   as const,
  mediaAll:          ['media', 'all']         as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useBookings() {
  return useQuery({
    queryKey: QK.bookings,
    queryFn:  () => api.bookings.list(),
  })
}

export function usePortfolioFeatured() {
  return useQuery({
    queryKey: QK.portfolioFeatured,
    queryFn:  () => api.portfolio.featured(),
    staleTime: 5 * 60 * 1000, // 5 min — portfolio changes rarely
  })
}

export function usePortfolioAll() {
  return useQuery({
    queryKey: QK.portfolioAll,
    queryFn:  () => api.portfolio.list(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useClients() {
  return useQuery({
    queryKey: QK.clients,
    queryFn:  () => api.clients.list(),
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.clients.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.clients }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.clients.update>[1] }) =>
      api.clients.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.clients }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.clients.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.clients }),
  })
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ id, subject, message }: { id: string; subject: string; message: string }) => 
      api.clients.sendMessage(id, subject, message)
  })
}

export function useMediaAll() {
  return useQuery({
    queryKey: QK.mediaAll,
    queryFn:  () => api.media.list(),
    staleTime: 1 * 60 * 1000,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: QK.users,
    queryFn:  () => api.users.list(),
  })
}

export function useAnalyticsMonthly(year?: number) {
  return useQuery({
    queryKey: ['analytics', 'monthly', year],
    queryFn:  () => api.analytics.monthly(year),
  })
}

export function useAnalyticsServices() {
  return useQuery({
    queryKey: ['analytics', 'services'],
    queryFn:  () => api.analytics.services(),
  })
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn:  () => api.analytics.summary(),
  })
}

export function usePosts(all = false) {
  return useQuery({
    queryKey: ['posts', all],
    queryFn:  () => api.posts.list(all),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.posts.create>[0]) => api.posts.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.posts.update>[1] }) =>
      api.posts.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.posts.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.users.deactivate(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QK.users }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.users.updateUser>[1] }) =>
      api.users.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.users }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.users.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.users }),
  })
}

export function useMe() {
  return useQuery({
    queryKey: QK.me,
    queryFn:  () => api.auth.me(),
    retry:    false,
    staleTime: 10 * 60 * 1000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateBookingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.bookings.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.bookings }),
  })
}

export function useUpdateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.bookings.update>[1] }) =>
      api.bookings.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.bookings }),
  })
}

export function useDeleteBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.bookings.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.bookings }),
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.bookings.create>[0]) =>
      api.bookings.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.bookings }),
  })
}

export function useRegisterAndBook() {
  return useMutation({
    mutationFn: async ({
      contact,
      booking,
    }: {
      contact: Parameters<typeof api.auth.register>[0]
      booking: Parameters<typeof api.bookings.create>[0]
    }) => {
      const auth = await api.auth.register(contact)
      sessionStorage.setItem('sr_token', auth.access_token)
      try {
        const newBooking = await api.bookings.create(booking)
        return { auth, booking: newBooking }
      } catch (err) {
        clearToken()
        throw err
      }
    },
  })
}

export function useCreatePortfolioItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.portfolio.create>[0]) =>
      api.portfolio.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.portfolioAll })
      qc.invalidateQueries({ queryKey: QK.portfolioFeatured })
    },
  })
}

export function useUpdatePortfolioItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.portfolio.update>[1] }) =>
      api.portfolio.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.portfolioAll })
      qc.invalidateQueries({ queryKey: QK.portfolioFeatured })
    },
  })
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.portfolio.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.portfolioAll })
      qc.invalidateQueries({ queryKey: QK.portfolioFeatured })
    },
  })
}

export function useCreateMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.media.create>[0]) =>
      api.media.create(data),
    onSuccess: () => {
      return qc.invalidateQueries({ queryKey: QK.mediaAll })
    },
  })
}

export function useUpdateMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.media.update>[1] }) =>
      api.media.update(id, data),
    onSuccess: () => {
      return qc.invalidateQueries({ queryKey: QK.mediaAll })
    },
  })
}

export function useDeleteMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.media.remove(id),
    onSuccess: () => {
      return qc.invalidateQueries({ queryKey: QK.mediaAll })
    },
  })
}
