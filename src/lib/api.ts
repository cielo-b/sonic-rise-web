/**
 * Typed client for the studio platform API.
 * Every request carries the studio slug (X-Studio) so one deployment can
 * serve many studios, each on its own subdomain.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

// ─── Studio resolution ──────────────────────────────────────────────────────
/**
 * The studio this site is showing: the subdomain of NEXT_PUBLIC_BASE_DOMAIN
 * (sonicrise.example.com → "sonicrise"), else NEXT_PUBLIC_DEFAULT_STUDIO.
 * Returns null on the bare platform domain.
 */
export function studioSlug(): string | null {
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN?.toLowerCase()
  if (typeof window !== 'undefined' && base) {
    const host = window.location.hostname.toLowerCase()
    if (host.endsWith(`.${base}`)) {
      const sub = host.slice(0, -(base.length + 1))
      if (sub && !sub.includes('.') && sub !== 'www') return sub
    }
    if (host === base) return null
  }
  return process.env.NEXT_PUBLIC_DEFAULT_STUDIO ?? null
}

// ─── Types ──────────────────────────────────────────────────────────────────
export type Role = 'PLATFORM_ADMIN' | 'OWNER' | 'MANAGER' | 'ENGINEER' | 'FRONT_DESK' | 'CLIENT'
export type BookingStatus = 'PENDING_DEPOSIT' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type PricingType = 'FIXED' | 'HOURLY'
export type PaymentPurpose = 'DEPOSIT' | 'BOOKING_BALANCE' | 'INVOICE' | 'DELIVERABLE'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'
export type PaymentMethod = 'MOBILE_MONEY' | 'CASH' | 'BANK_TRANSFER' | 'CARD'
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'CONVERTED'
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
export type ProjectStage =
  | 'DEMO' | 'PRE_PRODUCTION' | 'RECORDING' | 'EDITING' | 'MIXING' | 'MASTERING' | 'DELIVERED' | 'RELEASED'
export type DeliverableStatus = 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED'
export type Locale = 'en' | 'fr' | 'rw'

export interface OpeningWindow { open: string; close: string }
export type OpeningHours = Partial<Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', OpeningWindow>>

export interface StudioContent {
  heroTitle?: string
  heroSubtitle?: string
  heroImageUrl?: string
  aboutTitle?: string
  aboutBody?: string
  aboutImageUrl?: string
  stats?: { label: string; value: string }[]
  testimonials?: { name: string; role?: string; quote: string }[]
  faq?: { question: string; answer: string }[]
  rules?: string[]
  privacyPolicy?: string
  termsOfService?: string
}

export interface StudioSocials {
  instagram?: string
  youtube?: string
  tiktok?: string
  x?: string
  facebook?: string
}

export interface StudioProfile {
  id: string
  slug: string
  name: string
  tagline: string | null
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string
  timezone: string
  currency: string
  usdRate: number | null
  defaultLocale: Locale
  depositPercent: number
  cancellationHours: number
  cancellationPolicy: string | null
  openingHours: OpeningHours
  content: StudioContent
  socials: StudioSocials
  /** The studio accepts mobile money online (public profile only). */
  onlinePayments?: boolean
}

export interface StudioSettings extends StudioProfile {
  bufferMinutes: number
  payments: { provider: 'PAWAPAY'; configured: boolean; sandbox: boolean }
}

export interface PublicUser { id: string; name: string; avatarUrl: string | null; role?: Role; email?: string; phone?: string | null }

export interface Me {
  id: string
  studioId: string | null
  name: string
  email: string
  phone: string | null
  role: Role
  avatarUrl: string | null
  company: string | null
  preferredLocale: Locale | null
  marketingOptIn: boolean
  twoFaEnabled: boolean
  isBookable: boolean
  consentAt: string | null
  createdAt: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: Pick<Me, 'id' | 'studioId' | 'name' | 'email' | 'role' | 'avatarUrl' | 'twoFaEnabled'>
}
export interface TwoFactorChallenge { requires2FA: true; tempToken: string }

export interface Room {
  id: string
  name: string
  description: string | null
  capacity: number | null
  imageUrl: string | null
  color: string
  isActive: boolean
  sortOrder: number
}

export type EquipmentStatus = 'OPERATIONAL' | 'NEEDS_MAINTENANCE' | 'IN_REPAIR' | 'RETIRED'

export interface Equipment {
  id: string
  name: string
  category: string | null
  description: string | null
  pricePerBooking: number
  serialNumber?: string | null
  barcode?: string | null
  purchaseDate?: string | null
  purchasePrice?: number | null
  status?: EquipmentStatus
  lastMaintainedAt?: string | null
  maintenanceNotes?: string | null
  maintenanceHistory?: Array<{
    id: string
    date: string
    technician: string
    description: string
    cost?: number
    nextScheduledDate?: string
  }>
  isActive: boolean
}

export interface ServicePackage {
  id: string
  name: string
  category: string
  description: string | null
  includes: string[]
  pricingType: PricingType
  price: number
  durationMinutes: number
  depositPercent: number | null
  roomIds: string[]
  bookableOnline: boolean
  isActive: boolean
  sortOrder: number
}

export interface Booking {
  id: string
  reference: string
  clientId: string | null
  client: PublicUser | null
  guestName: string | null
  guestEmail: string | null
  guestPhone: string | null
  packageId: string
  package: ServicePackage
  roomId: string
  room: Room
  engineerId: string | null
  engineer: PublicUser | null
  equipment: Equipment[]
  projectId: string | null
  startsAt: string
  endsAt: string
  status: BookingStatus
  source: 'WEB' | 'STAFF'
  totalAmount: number
  depositAmount: number
  amountPaid: number
  currency: string
  notes: string | null
  internalNotes: string | null
  cancelledAt: string | null
  cancelReason: string | null
  createdAt: string
}

export interface Availability {
  date: string
  timezone: string
  bufferMinutes: number
  openingHours?: OpeningWindow | null
  busy: { roomId: string; engineerId: string | null; equipmentIds: string[]; startsAt: string; endsAt: string }[]
}

export interface Payment {
  id: string
  purpose: PaymentPurpose
  bookingId: string | null
  invoiceId: string | null
  deliverableId: string | null
  payerId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  provider: 'PAWAPAY' | 'MANUAL'
  method: PaymentMethod
  phone: string | null
  paidAt: string | null
  failureReason: string | null
  note: string | null
  createdAt: string
}

export interface LineItem { description: string; quantity: number; unitPrice: number }

interface BillingDoc {
  id: string
  number: number
  displayNumber: string
  clientId: string
  client: PublicUser & { email: string }
  title: string
  lines: LineItem[]
  discount: number
  total: number
  currency: string
  notes: string | null
  createdAt: string
}
export interface Quote extends BillingDoc { status: QuoteStatus; validUntil: string | null; invoiceId: string | null }
export interface Invoice extends BillingDoc {
  status: InvoiceStatus
  amountPaid: number
  dueDate: string | null
  issuedAt: string | null
  bookingId: string | null
  quoteId: string | null
}

export interface Project {
  id: string
  clientId: string
  client: PublicUser | null
  leadId: string | null
  lead: PublicUser | null
  title: string
  description: string | null
  stage: ProjectStage
  dueDate: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  deliverableCount?: number
  inReviewCount?: number
}

export interface Note {
  id: string
  body: string
  visibleToClient: boolean
  bookingId: string | null
  author: PublicUser | null
  createdAt: string
}

export interface Deliverable {
  id: string
  projectId: string
  title: string
  description: string | null
  status: DeliverableStatus
  price: number
  currency: string
  isPaid: boolean
  approvedAt: string | null
  latestVersion: number
  createdAt: string
}

export interface StemTrack {
  id: string
  name: string
  fileKey?: string
  fileName: string
  mimeType: string
  sizeBytes: string
  url?: string
}

export type ContractStatus = 'DRAFT' | 'PENDING_SIGNATURES' | 'SIGNED'

export interface SplitContributor {
  id: string
  name: string
  email: string
  role: string
  masterShare: number
  publishingShare: number
  proAffiliation?: string
  ipiNumber?: string
  signedAt?: string
  signatureData?: string
}

export interface Contract {
  id: string
  studioId: string
  projectId: string
  title: string
  trackTitle: string
  type: string
  status: ContractStatus
  splits: SplitContributor[]
  terms: string | null
  clientSignature: string | null
  clientSignedAt: string | null
  staffSignature: string | null
  staffSignedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DeliverableDetail extends Deliverable {
  project: { id: string; title: string; clientId: string }
  canDownload: boolean
  versions: {
    id: string
    version: number
    fileName: string
    mimeType: string
    sizeBytes: string
    note: string | null
    stems?: StemTrack[]
    uploadedBy: PublicUser | null
    createdAt: string
  }[]
  comments: {
    id: string
    versionId: string | null
    body: string
    atSeconds: number | null
    resolved: boolean
    author: PublicUser | null
    createdAt: string
  }[]
}

export interface ProjectDetail extends Project {
  deliverables: Deliverable[]
  sessions: {
    id: string
    startsAt: string
    endsAt: string
    status: BookingStatus
    package: { id: string; name: string }
    room: { id: string; name: string }
    engineer: PublicUser | null
  }[]
  notes: Note[]
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  category: string | null
  notes: string | null
  avatarUrl: string | null
  isActive: boolean
  hasPortalAccess: boolean
  marketingOptIn: boolean
  createdAt: string
  bookingCount: number
  totalPaid: number
  lastSessionAt: string | null
}

export interface ClientDetail extends Omit<Client, 'bookingCount' | 'totalPaid' | 'lastSessionAt'> {
  bookings: {
    id: string
    reference: string
    startsAt: string
    endsAt: string
    status: BookingStatus
    totalAmount: number
    amountPaid: number
    currency: string
    package: { id: string; name: string }
    room: { id: string; name: string }
  }[]
  projects: Project[]
  invoices: Invoice[]
}

export interface TeamMember extends Me {
  isActive: boolean
  invitePending: boolean
  inviteExpiry: string | null
  lastLoginAt: string | null
}

export interface PortfolioItem {
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
}

export interface Post {
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

export interface MediaAsset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'folder'
  mimeType: string | null
  size: string | null
  url: string | null
  tags: string[]
  isFolder: boolean
  parentId: string | null
  isFavorite: boolean
  isTrash: boolean
  createdAt: string
}

export interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  isHandled: boolean
  createdAt: string
}

export interface Session { id: string; device: string | null; ipAddress: string | null; createdAt: string; expiresAt: string }
export interface LoginEntry { id: string; status: 'success' | 'failed'; device: string | null; ipAddress: string | null; createdAt: string }

export interface ReportsOverview {
  period: { from: string; to: string }
  currency: string
  revenue: { total: number; payments: number }
  revenueByPurpose: { purpose: PaymentPurpose; total: number }[]
  revenueByMethod: { method: PaymentMethod; total: number }[]
  revenueByRoom: { id: string; name: string; revenue: number; sessions: number }[]
  revenueByEngineer: { id: string; name: string; revenue: number; sessions: number }[]
  revenueByPackage: { id: string; name: string; revenue: number; sessions: number }[]
  bookings: { total: number; byStatus: Partial<Record<BookingStatus, number>>; noShowRate: number | null; cancellationRate: number | null }
  utilization: { id: string; name: string; bookedHours: number; openHours: number | null; rate: number | null }[]
  topClients: { id: string; name: string; paid: number }[]
  monthly: { month: string; revenue: number; bookings: number }[]
}

export interface TodayView {
  date: string
  timezone: string
  currency: string
  sessions: {
    id: string
    startsAt: string
    endsAt: string
    status: BookingStatus
    guestName: string | null
    client: string | null
    room: string
    roomColor: string
    engineer: string | null
    package: string
  }[]
  pendingRequests: number
  unpaidInvoices: { count: number; due: number }
  filesAwaitingClient: number
  openInquiries: number
}

export interface PlatformStudio { id: string; slug: string; name: string; isActive: boolean; createdAt: string }

// ─── Token storage ──────────────────────────────────────────────────────────
const TOKEN_KEY = 'sr_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string, persist: boolean) {
  clearToken()
  ;(persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

// ─── Core request ───────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

function headers(json: boolean, opts: { studio?: boolean } = {}): Record<string, string> {
  const h: Record<string, string> = {}
  if (json) h['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) h.Authorization = `Bearer ${token}`
  const slug = opts.studio === false ? null : studioSlug()
  if (slug) h['X-Studio'] = slug
  return h
}

function messageFrom(body: unknown, status: number): string {
  const raw = (body as { message?: unknown })?.message
  if (Array.isArray(raw)) return raw.join(', ')
  if (raw && typeof raw === 'object' && 'message' in raw) return String((raw as { message: unknown }).message)
  if (typeof raw === 'string') return raw
  return status === 401 ? 'Please sign in again' : `Request failed (${status})`
}

/** Called when a signed-in request comes back 401 (expired or revoked session). */
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn
}

async function request<T>(path: string, init: RequestInit & { studio?: boolean } = {}): Promise<T> {
  const { studio, ...rest } = init
  const isForm = rest.body instanceof FormData
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { ...headers(!isForm && !!rest.body, { studio }), ...(rest.headers as Record<string, string>) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401 && getToken() && !path.startsWith('/auth/')) onUnauthorized?.()
    throw new ApiError(messageFrom(body, res.status), res.status)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

const get = <T>(path: string) => request<T>(path)
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
const patch = <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
const put = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
const del = <T = void>(path: string) => request<T>(path, { method: 'DELETE' })
const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '') as [string, string][],
  ).toString()
  return s ? `?${s}` : ''
}

/** Multipart upload with progress (XHR: fetch has no upload progress). */
function upload<T>(path: string, file: File, fields: Record<string, string> = {}, onProgress?: (pct: number) => void) {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}${path}`)
    for (const [k, v] of Object.entries(headers(false))) xhr.setRequestHeader(k, v)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
    }
    xhr.onload = () => {
      let body: unknown = {}
      try { body = JSON.parse(xhr.responseText) } catch { /* empty */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as T)
      else reject(new ApiError(messageFrom(body, xhr.status), xhr.status))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    const fd = new FormData()
    fd.append('file', file)
    for (const [k, v] of Object.entries(fields)) fd.append(k, v)
    xhr.send(fd)
  })
}

// ─── Endpoints ──────────────────────────────────────────────────────────────
export const api = {
  studio: {
    profile: () => get<StudioProfile>('/studio'),
    settings: () => get<StudioSettings>('/studio/settings'),
    update: (data: Partial<Omit<StudioSettings, 'id' | 'slug' | 'payments'>>) => patch<StudioSettings>('/studio/settings', data),
    setPayments: (data: { apiToken: string; sandbox: boolean }) => put<StudioSettings>('/studio/payments', data),
  },

  auth: {
    login: (email: string, password: string) =>
      post<AuthResponse | TwoFactorChallenge>('/auth/login', { email, password }),
    platformLogin: (email: string, password: string) =>
      request<AuthResponse | TwoFactorChallenge>('/auth/platform/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        studio: false,
      }),
    login2fa: (tempToken: string, code: string) => post<AuthResponse>('/auth/login/2fa', { tempToken, code }),
    register: (data: { name: string; email: string; password: string; phone?: string; acceptPrivacy: boolean; marketingOptIn?: boolean; locale?: Locale }) =>
      post<AuthResponse>('/auth/register', data),
    invite: (data: { email: string; name?: string; role: Role; isBookable?: boolean }) =>
      post<{ inviteUrl: string }>('/auth/invite', data),
    describeInvite: (token: string) =>
      get<{ email: string; name: string; role: Role; studio: string }>(`/auth/invite/${encodeURIComponent(token)}`),
    acceptInvite: (token: string, name: string, password: string) => post<void>('/auth/accept-invite', { token, name, password }),
    forgotPassword: (email: string) => post<void>('/auth/forgot-password', { email }),
    verifyOtp: (email: string, otp: string) => post<{ resetToken: string }>('/auth/verify-otp', { email, otp }),
    resetPassword: (resetToken: string, password: string) => post<void>('/auth/reset-password', { resetToken, password }),
    sessions: () => get<Session[]>('/auth/sessions'),
    revokeSession: (id: string) => del(`/auth/sessions/${id}`),
    revokeAll: () => del('/auth/sessions'),
    loginHistory: () => get<LoginEntry[]>('/auth/login-history'),
    twoFaSetup: () => post<{ secret: string; qrDataUrl: string }>('/auth/2fa/setup'),
    twoFaEnable: (code: string) => post<void>('/auth/2fa/enable', { code }),
    twoFaDisable: (code: string) => post<void>('/auth/2fa/disable', { code }),
  },

  me: {
    get: () => get<Me>('/users/me'),
    update: (data: Partial<Pick<Me, 'name' | 'email' | 'phone' | 'avatarUrl' | 'company' | 'preferredLocale' | 'marketingOptIn'>> & { password?: string; currentPassword?: string }) =>
      patch<Me>('/users/me', data),
    export: () => get<Record<string, unknown>>('/users/me/export'),
    delete: (password: string) => post<{ deleted: true }>('/users/me/delete', { password }),
  },

  team: {
    list: () => get<TeamMember[]>('/team'),
    update: (id: string, data: { role?: Role; isBookable?: boolean; isActive?: boolean; name?: string }) => patch<TeamMember>(`/team/${id}`, data),
    resendInvite: (id: string) => post<{ inviteUrl: string }>(`/team/${id}/resend-invite`),
    withdraw: (id: string) => del(`/team/${id}`),
  },

  rooms: {
    list: () => get<Room[]>('/rooms'),
    all: () => get<Room[]>('/rooms/all'),
    create: (data: Partial<Room>) => post<Room>('/rooms', data),
    update: (id: string, data: Partial<Room>) => patch<Room>(`/rooms/${id}`, data),
    remove: (id: string) => del<{ deleted?: true; deactivated?: true }>(`/rooms/${id}`),
  },
  equipment: {
    list: () => get<Equipment[]>('/equipment'),
    all: () => get<Equipment[]>('/equipment/all'),
    create: (data: Partial<Equipment>) => post<Equipment>('/equipment', data),
    update: (id: string, data: Partial<Equipment>) => patch<Equipment>(`/equipment/${id}`, data),
    addMaintenance: (id: string, data: { technician?: string; description: string; cost?: number; nextScheduledDate?: string; status?: EquipmentStatus }) =>
      post<Equipment>(`/equipment/${id}/maintenance`, data),
    remove: (id: string) => del<{ deleted?: true; deactivated?: true }>(`/equipment/${id}`),
  },
  packages: {
    list: () => get<ServicePackage[]>('/packages'),
    all: () => get<ServicePackage[]>('/packages/all'),
    create: (data: Partial<ServicePackage>) => post<ServicePackage>('/packages', data),
    update: (id: string, data: Partial<ServicePackage>) => patch<ServicePackage>(`/packages/${id}`, data),
    remove: (id: string) => del<{ deleted?: true; deactivated?: true }>(`/packages/${id}`),
  },
  engineers: { list: () => get<PublicUser[]>('/engineers') },

  bookings: {
    availability: (date: string) => get<Availability>(`/bookings/availability${qs({ date })}`),
    list: (q: { from?: string; to?: string; roomId?: string; engineerId?: string; clientId?: string; status?: BookingStatus } = {}) =>
      get<Booking[]>(`/bookings${qs(q)}`),
    get: (id: string) => get<Booking>(`/bookings/${id}`),
    create: (data: {
      packageId: string
      roomId?: string
      engineerId?: string
      equipmentIds?: string[]
      startsAt: string
      endsAt?: string
      notes?: string
      clientId?: string
      guestName?: string
      guestEmail?: string
      guestPhone?: string
      projectId?: string
      totalOverride?: number
      status?: BookingStatus
      internalNotes?: string
    }) => post<Booking>('/bookings', data),
    update: (id: string, data: Partial<{ roomId: string; engineerId: string | null; equipmentIds: string[]; startsAt: string; endsAt: string; status: BookingStatus; totalAmount: number; internalNotes: string; projectId: string | null; cancelReason: string }>) =>
      patch<Booking>(`/bookings/${id}`, data),
    cancel: (id: string, reason?: string) => post<Booking & { lateCancellation: boolean }>(`/bookings/${id}/cancel`, { reason }),
    remove: (id: string) => del(`/bookings/${id}`),
    calendarIcsUrl: (engineerId?: string) =>
      `${BASE}/bookings/calendar.ics${qs({ engineerId, studio: studioSlug() || undefined })}`,
  },

  payments: {
    mobileMoney: (data: { purpose: PaymentPurpose; targetId: string; phone: string }) =>
      post<Payment & { provider: string }>('/payments/mobile-money', data),
    record: (data: { purpose: PaymentPurpose; targetId: string; amount: number; method: PaymentMethod; note?: string }) =>
      post<Payment>('/payments/manual', data),
    list: (q: { status?: PaymentStatus; purpose?: PaymentPurpose; bookingId?: string; invoiceId?: string; from?: string; to?: string } = {}) =>
      get<Payment[]>(`/payments${qs(q)}`),
    status: (id: string) => get<Payment>(`/payments/${id}`),
  },

  quotes: {
    list: () => get<Quote[]>('/quotes'),
    get: (id: string) => get<Quote>(`/quotes/${id}`),
    create: (data: { clientId: string; title: string; lines: LineItem[]; discount?: number; notes?: string; validUntil?: string }) =>
      post<Quote>('/quotes', data),
    update: (id: string, data: Partial<{ clientId: string; title: string; lines: LineItem[]; discount: number; notes: string; validUntil: string }>) =>
      patch<Quote>(`/quotes/${id}`, data),
    send: (id: string) => post<Quote>(`/quotes/${id}/send`),
    respond: (id: string, accept: boolean) => post<Quote>(`/quotes/${id}/respond`, { accept }),
    convert: (id: string, dueDate?: string) => post<Invoice>(`/quotes/${id}/convert`, { dueDate }),
    remove: (id: string) => del(`/quotes/${id}`),
  },

  invoices: {
    list: () => get<Invoice[]>('/invoices'),
    get: (id: string) => get<Invoice>(`/invoices/${id}`),
    create: (data: { clientId: string; title: string; lines: LineItem[]; discount?: number; notes?: string; dueDate?: string; bookingId?: string }) =>
      post<Invoice>('/invoices', data),
    fromBooking: (bookingId: string, dueDate?: string) => post<Invoice>('/invoices/from-booking', { bookingId, dueDate }),
    update: (id: string, data: Partial<{ clientId: string; title: string; lines: LineItem[]; discount: number; notes: string; dueDate: string }>) =>
      patch<Invoice>(`/invoices/${id}`, data),
    issue: (id: string) => post<Invoice>(`/invoices/${id}/issue`),
    void: (id: string) => post<Invoice>(`/invoices/${id}/void`),
  },

  projects: {
    list: (archived = false) => get<Project[]>(`/projects${qs({ archived: archived || undefined })}`),
    get: (id: string) => get<ProjectDetail>(`/projects/${id}`),
    create: (data: { clientId: string; title: string; description?: string; stage?: ProjectStage; leadId?: string; dueDate?: string }) =>
      post<ProjectDetail>('/projects', data),
    update: (id: string, data: Partial<{ clientId: string; title: string; description: string; stage: ProjectStage; leadId: string; dueDate: string; isArchived: boolean }>) =>
      patch<ProjectDetail>(`/projects/${id}`, data),
    addNote: (id: string, data: { body: string; visibleToClient?: boolean; bookingId?: string }) => post<Note[]>(`/projects/${id}/notes`, data),
    deleteNote: (noteId: string) => del(`/notes/${noteId}`),
    addDeliverable: (id: string, data: { title: string; description?: string; price?: number }) =>
      post<DeliverableDetail>(`/projects/${id}/deliverables`, data),
  },

  deliverables: {
    get: (id: string) => get<DeliverableDetail>(`/deliverables/${id}`),
    update: (id: string, data: Partial<{ title: string; description: string; price: number }>) => patch<DeliverableDetail>(`/deliverables/${id}`, data),
    remove: (id: string) => del(`/deliverables/${id}`),
    uploadVersion: (id: string, file: File, note?: string, onProgress?: (p: number) => void) =>
      upload<DeliverableDetail>(`/deliverables/${id}/versions`, file, note ? { note } : {}, onProgress),
    streamUrl: (id: string, versionId: string) => get<{ url: string }>(`/deliverables/${id}/versions/${versionId}/stream`),
    downloadUrl: (id: string) => get<{ url: string }>(`/deliverables/${id}/download`),
    comment: (id: string, data: { body: string; atSeconds?: number; versionId?: string }) => post<DeliverableDetail>(`/deliverables/${id}/comments`, data),
    resolveComment: (id: string, commentId: string, resolved: boolean) =>
      patch<DeliverableDetail>(`/deliverables/${id}/comments/${commentId}`, { resolved }),
    uploadStem: (id: string, versionId: string, file: File, name: string, onProgress?: (p: number) => void) =>
      upload<DeliverableDetail>(`/deliverables/${id}/versions/${versionId}/stems`, file, { name }, onProgress),
    deleteStem: (id: string, versionId: string, stemId: string) =>
      del<DeliverableDetail>(`/deliverables/${id}/versions/${versionId}/stems/${stemId}`),
    approve: (id: string) => post<DeliverableDetail>(`/deliverables/${id}/approve`),
    requestChanges: (id: string, body: string) => post<DeliverableDetail>(`/deliverables/${id}/request-changes`, { body }),
  },

  contracts: {
    list: (projectId: string) => get<Contract[]>(`/contracts/project/${projectId}`),
    get: (id: string) => get<Contract>(`/contracts/${id}`),
    create: (projectId: string, data: { title: string; trackTitle: string; type?: string; splits: SplitContributor[]; terms?: string }) =>
      post<Contract>(`/contracts/project/${projectId}`, data),
    sign: (id: string, data: { signatureData: string; contributorId?: string }) =>
      post<Contract>(`/contracts/${id}/sign`, data),
    remove: (id: string) => del(`/contracts/${id}`),
  },

  clients: {
    list: (q?: string) => get<Client[]>(`/clients${qs({ q })}`),
    get: (id: string) => get<ClientDetail>(`/clients/${id}`),
    create: (data: { name: string; email: string; phone?: string; company?: string; category?: string; notes?: string }) =>
      post<Client>('/clients', data),
    update: (id: string, data: Partial<{ name: string; email: string; phone: string; company: string; category: string; notes: string }>) =>
      patch<Client>(`/clients/${id}`, data),
    deactivate: (id: string) => del(`/clients/${id}`),
    reactivate: (id: string) => post<Client>(`/clients/${id}/reactivate`),
    invite: (id: string) => post<{ inviteUrl: string }>(`/clients/${id}/invite`),
    message: (id: string, subject: string, message: string) => post<{ sent: true }>(`/clients/${id}/message`, { subject, message }),
  },

  inquiries: {
    list: () => get<Inquiry[]>('/inquiries'),
    setHandled: (id: string, isHandled: boolean) => patch<Inquiry>(`/inquiries/${id}`, { isHandled }),
  },
  subscribers: {
    list: () => get<{ id: string; email: string; consentAt: string; createdAt: string }[]>('/subscribers'),
  },
  contact: {
    send: (data: { name: string; email: string; phone?: string; subject?: string; message: string }) => post<{ ok: true }>('/contact', data),
    subscribe: (email: string) => post<{ ok: true }>('/newsletter', { email, consent: true }),
  },

  portfolio: {
    list: () => get<PortfolioItem[]>('/portfolio'),
    featured: () => get<PortfolioItem[]>('/portfolio/featured'),
    create: (data: Partial<PortfolioItem>) => post<PortfolioItem>('/portfolio', data),
    update: (id: string, data: Partial<PortfolioItem>) => patch<PortfolioItem>(`/portfolio/${id}`, data),
    remove: (id: string) => del(`/portfolio/${id}`),
  },

  posts: {
    list: () => get<Post[]>('/posts'),
    all: () => get<Post[]>('/posts/admin/all'),
    get: (slug: string) => get<Post>(`/posts/${encodeURIComponent(slug)}`),
    create: (data: Partial<Post>) => post<Post>('/posts', data),
    update: (id: string, data: Partial<Post>) => patch<Post>(`/posts/${id}`, data),
    remove: (id: string) => del(`/posts/${id}`),
  },

  media: {
    list: () => get<MediaAsset[]>('/media'),
    create: (data: Partial<MediaAsset>) => post<MediaAsset>('/media', data),
    update: (id: string, data: Partial<MediaAsset>) => patch<MediaAsset>(`/media/${id}`, data),
    remove: (id: string) => del(`/media/${id}`),
  },

  /** Public website files (images, video, audio). */
  upload: (file: File, onProgress?: (p: number) => void) =>
    upload<{ url: string; type: 'image' | 'video' | 'audio'; size: string; name: string; mimeType: string }>('/uploads', file, {}, onProgress),

  reports: {
    overview: (from?: string, to?: string) => get<ReportsOverview>(`/reports/overview${qs({ from, to })}`),
    today: () => get<TodayView>('/reports/today'),
  },

  platform: {
    studios: () => request<PlatformStudio[]>('/platform/studios', { studio: false }),
    createStudio: (data: { name: string; slug: string; ownerEmail: string; ownerName?: string }) =>
      request<{ studio: PlatformStudio; inviteUrl: string }>('/platform/studios', { method: 'POST', body: JSON.stringify(data), studio: false }),
    setActive: (id: string, isActive: boolean) =>
      request<PlatformStudio>(`/platform/studios/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }), studio: false }),
  },
}
