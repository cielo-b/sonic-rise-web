import type { PaymentMethod, PaymentPurpose, ProjectStage, Role } from './api'

export const STAGES: ProjectStage[] = ['DEMO', 'PRE_PRODUCTION', 'RECORDING', 'EDITING', 'MIXING', 'MASTERING', 'DELIVERED', 'RELEASED']

export const STAGE_LABEL: Record<ProjectStage, string> = {
  DEMO: 'Demo',
  PRE_PRODUCTION: 'Pre-production',
  RECORDING: 'Recording',
  EDITING: 'Editing',
  MIXING: 'Mixing',
  MASTERING: 'Mastering',
  DELIVERED: 'Delivered',
  RELEASED: 'Released',
}

export const ROLE_LABEL: Record<Role, string> = {
  PLATFORM_ADMIN: 'Platform admin',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  ENGINEER: 'Engineer',
  FRONT_DESK: 'Front desk',
  CLIENT: 'Client',
}

export const ROLE_HINT: Record<Role, string> = {
  PLATFORM_ADMIN: '',
  OWNER: 'Everything, including payment settings',
  MANAGER: 'Everything except payment provider settings',
  ENGINEER: 'Calendar, projects, notes and file uploads',
  FRONT_DESK: 'Bookings, clients, quotes, invoices and payments',
  CLIENT: '',
}

export const PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  DEPOSIT: 'Deposit',
  BOOKING_BALANCE: 'Booking balance',
  INVOICE: 'Invoice',
  DELIVERABLE: 'File download',
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  MOBILE_MONEY: 'Mobile Money (MTN MoMo / Airtel Money)',
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank transfer',
  CARD: 'Card / POS Terminal',
}
