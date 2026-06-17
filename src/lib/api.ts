// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiMonthStat {
  month: string
  bookings: number
  revenue: number
}

export interface ApiServiceStat {
  label: string
  pct: number
}

export interface ApiSummary {
  totalBookings: number
  activeBookings: number
  totalRevenue: number
}

export interface ApiPost {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  coverUrl: string | null
  readTime: string
  featured: boolean
  published: boolean
  authorName: string
  authorInitials: string
  createdAt: string
  updatedAt: string
}

export interface ApiUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'SUPERADMIN' | 'CLIENT'
  isActive: boolean
  avatarUrl: string | null
  company: string | null
  category: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  bookings?: ApiBooking[]
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: Pick<ApiUser, 'id' | 'name' | 'email' | 'role' | 'avatarUrl'>
}

export interface ApiBooking {
  id: string
  clientId: string | null
  guestName: string | null
  guestEmail: string | null
  serviceType: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVESTREAM'
  dateTime: string
  endsAt: string | null
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  totalAmount: number
  currency: string
  notes: string | null
  internalNotes: string | null
  createdAt: string
  updatedAt: string
  client?: ApiUser
}

export interface ApiPortfolioItem {
  id: string
  title: string
  category: string
  mediaUrl: string
  thumbnailUrl: string | null
  description: string | null
  isFeatured: boolean
  sortOrder: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ApiMediaAsset {
  id: string
  name: string
  type: 'video' | 'audio' | 'image'
  badge: string
  badgeColor: string
  size: string
  duration: string | null
  status: string
  statusColor: string
  src: string | null
  resolution: string | null
  tags: string[]
  isFolder: boolean
  parentId: string | null
  isFavorite: boolean
  isTrash: boolean
  createdAt: string
  updatedAt: string
}

// ─── Token helpers ─────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('sr_token') ??
    sessionStorage.getItem('sr_token') ??
    null
  )
}

export function setToken(token: string, persist: boolean) {
  sessionStorage.setItem('sr_token', token)
  if (persist) localStorage.setItem('sr_token', token)
}

export function clearToken() {
  localStorage.removeItem('sr_token')
  sessionStorage.removeItem('sr_token')
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    if (res.status === 401) {
      clearToken()
      if (typeof window !== 'undefined' && !path.startsWith('/auth/')) {
        window.location.href = '/admin/login'
      }
    }

    const body = await res.json().catch(() => ({}))
    let rawMsg = body.message
    let msg: string | undefined

    if (Array.isArray(rawMsg)) {
      msg = rawMsg.join(', ')
    } else if (typeof rawMsg === 'object' && rawMsg !== null) {
      msg = rawMsg.message || JSON.stringify(rawMsg)
    } else {
      msg = rawMsg
    }

    throw new Error(msg || (res.status === 401 ? 'Unauthorized' : `HTTP ${res.status}`))
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text)
}

async function upload<T>(path: string, file: File): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const fd = new FormData()
  fd.append('file', file)

  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: fd })

  if (!res.ok) {
    if (res.status === 401) {
      clearToken()
      if (typeof window !== 'undefined') window.location.href = '/admin/login'
    }

    const body = await res.json().catch(() => ({}))
    let rawMsg = body.message
    let msg: string | undefined

    if (Array.isArray(rawMsg)) {
      msg = rawMsg.join(', ')
    } else if (typeof rawMsg === 'object' && rawMsg !== null) {
      msg = rawMsg.message || JSON.stringify(rawMsg)
    } else {
      msg = rawMsg
    }

    throw new Error(msg || (res.status === 401 ? 'Unauthorized' : `HTTP ${res.status}`))
  }
  return res.json()
}

export const uploadToCloudinary = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; type: string; size: string; name: string }> => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset'
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText)
        resolve({
          url: res.secure_url,
          type: res.resource_type === 'video' && res.format === 'mp3' ? 'audio' : res.resource_type,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          name: file.name
        })
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText)
          reject(new Error(errRes.error?.message || 'Cloudinary upload failed'))
        } catch {
          reject(new Error(xhr.statusText || 'Upload failed'))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))

    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', uploadPreset)

    xhr.send(fd)
  })
}

// ─── API surface ───────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: { name: string; email: string; password: string; phone?: string }) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<ApiUser>('/users/me'),

    invite: (email: string, role?: string) =>
      request<void>('/auth/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }),

    acceptInvite: (token: string, name: string, password: string) =>
      request<void>('/auth/accept-invite', {
        method: 'POST',
        body: JSON.stringify({ token, name, password }),
      }),

    forgotPassword: (email: string) =>
      request<void>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    verifyOtp: (email: string, otp: string) =>
      request<{ resetToken: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),

    resetPassword: (resetToken: string, password: string) =>
      request<void>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, password }),
      }),
  },

  bookings: {
    list: () => request<ApiBooking[]>('/bookings'),

    create: (data: {
      clientId?: string
      guestName?: string
      guestEmail?: string
      serviceType: string
      dateTime: string
      endsAt?: string
      totalAmount: number
      notes?: string
    }) =>
      request<ApiBooking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: {
        status?: string
        dateTime?: string
        endsAt?: string
        notes?: string
        internalNotes?: string
        serviceType?: string
        totalAmount?: number
        guestName?: string
        guestEmail?: string
      },
    ) =>
      request<ApiBooking>(`/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/bookings/${id}`, { method: 'DELETE' }),
  },

  portfolio: {
    list: () => request<ApiPortfolioItem[]>('/portfolio'),
    featured: () => request<ApiPortfolioItem[]>('/portfolio/featured'),
    upload: (file: File, onProgress?: (p: number) => void) => uploadToCloudinary(file, onProgress),

    create: (data: {
      title: string
      category: string
      mediaUrl: string
      thumbnailUrl?: string
      description?: string
      isFeatured?: boolean
      sortOrder?: number
      tags?: string[]
    }) =>
      request<ApiPortfolioItem>('/portfolio', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{
      title: string; category: string; mediaUrl: string
      thumbnailUrl?: string; description?: string
      isFeatured?: boolean; sortOrder?: number; tags?: string[]
    }>) =>
      request<ApiPortfolioItem>(`/portfolio/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    remove: (id: string) => request<void>(`/portfolio/${id}`, { method: 'DELETE' }),
  },

  media: {
    list: () => request<ApiMediaAsset[]>('/media'),
    upload: (file: File, onProgress?: (p: number) => void) => uploadToCloudinary(file, onProgress),

    create: (data: {
      name: string
      type: string
      badge: string
      badgeColor: string
      size: string
      duration?: string
      status: string
      statusColor: string
      src?: string
      resolution?: string
      tags?: string[]
      isFolder?: boolean
      parentId?: string | null
      isFavorite?: boolean
      isTrash?: boolean
    }) =>
      request<ApiMediaAsset>('/media', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{
      name: string
      type: string
      badge: string
      badgeColor: string
      size: string
      duration?: string
      status: string
      statusColor: string
      src?: string
      resolution?: string
      tags?: string[]
      isFolder?: boolean
      parentId?: string | null
      isFavorite?: boolean
      isTrash?: boolean
    }>) =>
      request<ApiMediaAsset>(`/media/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    remove: (id: string) => request<void>(`/media/${id}`, { method: 'DELETE' }),
  },

  clients: {
    list: () => request<ApiUser[]>('/clients'),
    get: (id: string) => request<ApiUser & { bookings: ApiBooking[] }>(`/clients/${id}`),
    create: (data: { name: string; email: string; phone?: string; company?: string; category?: string; notes?: string }) =>
      request<ApiUser>('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; email?: string; company?: string; category?: string; notes?: string; phone?: string }) =>
      request<ApiUser>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/clients/${id}`, { method: 'DELETE' }),
    sendMessage: (id: string, subject: string, message: string) => request<void>(`/clients/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ subject, message })
    }),
  },

  analytics: {
    monthly: (year?: number) =>
      request<ApiMonthStat[]>(`/analytics/monthly${year ? `?year=${year}` : ''}`),
    services: () => request<ApiServiceStat[]>('/analytics/services'),
    summary:  () => request<ApiSummary>('/analytics/summary'),
  },

  posts: {
    list:    (all = false) => request<ApiPost[]>(`/posts${all ? '?all=true' : ''}`),
    get:     (slug: string) => request<ApiPost>(`/posts/${slug}`),
    create:  (data: Partial<ApiPost>) =>
      request<ApiPost>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update:  (id: string, data: Partial<ApiPost>) =>
      request<ApiPost>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove:  (id: string) => request<void>(`/posts/${id}`, { method: 'DELETE' }),
  },

  contact: {
    send: (data: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
      request<{ ok: boolean }>('/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  users: {
    list: () => request<ApiUser[]>('/users'),
    me: () => request<ApiUser>('/users/me'),
    update: (data: { name?: string; phone?: string; avatarUrl?: string; password?: string }) =>
      request<ApiUser>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    deactivate: (id: string) => request<ApiUser>(`/users/${id}`, { method: 'DELETE' }),
    remove: (id: string) => request<void>(`/users/${id}/hard`, { method: 'DELETE' }),
    create: (data: { name: string; email: string; phone?: string; company?: string; category?: string; notes?: string }) =>
      request<ApiUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: string, data: { name?: string; email?: string; password?: string; company?: string; category?: string; notes?: string; phone?: string; role?: string; isActive?: boolean }) =>
      request<ApiUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  twofa: {
    setup: () => request<{ secret: string; qrDataUrl: string }>('/auth/2fa/setup', { method: 'POST' }),
    enable: (code: string) => request<void>('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) }),
    disable: (code: string) => request<void>('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code }) }),
  },

  sessions: {
    list: () => request<{ id: string; device: string | null; ipAddress: string | null; createdAt: string; expiresAt: string; jti: string }[]>('/auth/sessions'),
    revoke: (id: string) => request<void>(`/auth/sessions/${id}`, { method: 'DELETE' }),
    revokeAll: () => request<void>('/auth/sessions', { method: 'DELETE' }),
  },

  loginHistory: {
    list: () => request<{ id: string; status: 'success' | 'failed'; device: string | null; ipAddress: string | null; createdAt: string }[]>('/auth/login-history'),
  },
}
