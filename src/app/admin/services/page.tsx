'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Wrench, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { api, type Equipment, type EquipmentStatus, type PricingType, type Room, type ServicePackage } from '@/lib/api'
import { useRequiredStudio } from '@/context/StudioContext'
import { duration, money } from '@/lib/format'
import { Button, Card, Checkbox, ConfirmButton, EmptyState, Field, ImageUpload, Input, Loading, Modal, PageHeader, Select, Tabs, Textarea, errorMessage } from '@/components/ui'
import { MaintenanceModal } from '@/components/admin/MaintenanceModal'

type Tab = 'packages' | 'rooms' | 'equipment'

function useSaver(key: string[]) {
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  async function save(fn: () => Promise<unknown>, done: () => void, message = 'Saved') {
    setBusy(true)
    try {
      await fn()
      toast.success(message)
      void qc.invalidateQueries({ queryKey: key })
      void qc.invalidateQueries({ queryKey: [key[0], 'public'] })
      done()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return { busy, save }
}

function removeLabel(r: { deleted?: true; deactivated?: true }) {
  return r.deactivated ? 'Has booking history — turned off instead of deleted' : 'Deleted'
}

// ─── Packages ────────────────────────────────────────────────────────────────
function PackageForm({ pkg, rooms, open, onClose }: { pkg: ServicePackage | null; rooms: Room[]; open: boolean; onClose: () => void }) {
  const studio = useRequiredStudio()
  const { busy, save } = useSaver(['packages', 'all'])
  const init = () => ({
    name: pkg?.name ?? '',
    category: pkg?.category ?? '',
    description: pkg?.description ?? '',
    includes: pkg?.includes.join('\n') ?? '',
    pricingType: pkg?.pricingType ?? ('FIXED' as PricingType),
    price: pkg ? String(pkg.price) : '',
    durationMinutes: pkg?.durationMinutes ?? 120,
    depositPercent: pkg?.depositPercent === null || pkg?.depositPercent === undefined ? '' : String(pkg.depositPercent),
    roomIds: pkg?.roomIds ?? [],
    bookableOnline: pkg?.bookableOnline ?? true,
    isActive: pkg?.isActive ?? true,
  })
  const [f, setF] = useState(init)
  const [lastId, setLastId] = useState<string | null | undefined>(undefined)
  if (open && lastId !== (pkg?.id ?? null)) {
    setLastId(pkg?.id ?? null)
    setF(init())
  }
  if (!open && lastId !== undefined) setLastId(undefined)

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={pkg ? 'Edit service' : 'New service'}
      footer={<><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" form="pkg-form" loading={busy}>Save</Button></>}
    >
      <form
        id="pkg-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          const data = {
            name: f.name.trim(),
            category: f.category.trim(),
            description: f.description.trim() || undefined,
            includes: f.includes.split('\n').map((s) => s.trim()).filter(Boolean),
            pricingType: f.pricingType,
            price: Number(f.price),
            durationMinutes: Number(f.durationMinutes),
            depositPercent: f.depositPercent === '' ? null : Number(f.depositPercent),
            roomIds: f.roomIds,
            bookableOnline: f.bookableOnline,
            isActive: f.isActive,
          } as Partial<ServicePackage>
          void save(() => (pkg ? api.packages.update(pkg.id, data) : api.packages.create(data)), onClose)
        }}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" hint='e.g. "Vocal recording", "Single: record, mix & master"'><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Category" hint="Groups services on the website, e.g. Audio, Video, Podcast"><Input required value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
        </div>
        <Field label="Description"><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="What’s included" hint="One per line"><Textarea rows={3} value={f.includes} onChange={(e) => setF({ ...f, includes: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Pricing">
            <Select value={f.pricingType} onChange={(e) => setF({ ...f, pricingType: e.target.value as PricingType })}>
              <option value="FIXED">Fixed price</option>
              <option value="HOURLY">Per hour</option>
            </Select>
          </Field>
          <Field label={`Price (${studio.currency})${f.pricingType === 'HOURLY' ? ' / hour' : ''}`}><Input type="number" min={0} required value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
          <Field label={f.pricingType === 'HOURLY' ? 'Minimum length' : 'Session length'}>
            <Select value={f.durationMinutes} onChange={(e) => setF({ ...f, durationMinutes: Number(e.target.value) })}>
              {[30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720].map((m) => <option key={m} value={m}>{duration(m)}</option>)}
            </Select>
          </Field>
          <Field label="Deposit %" hint={`Empty = studio default (${studio.depositPercent}%)`}><Input type="number" min={0} max={100} value={f.depositPercent} onChange={(e) => setF({ ...f, depositPercent: e.target.value })} /></Field>
        </div>
        {rooms.length > 0 && (
          <fieldset>
            <legend className="text-xs font-medium text-text-muted mb-2">Rooms (none selected = any room)</legend>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => {
                const on = f.roomIds.includes(r.id)
                return (
                  <button type="button" key={r.id} className={`chip ${on ? 'chip-purple' : 'bg-white/5 text-text-muted'}`} onClick={() => setF({ ...f, roomIds: on ? f.roomIds.filter((x) => x !== r.id) : [...f.roomIds, r.id] })}>
                    {r.name}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
        <div className="flex flex-wrap gap-6">
          <Checkbox checked={f.bookableOnline} onChange={(e) => setF({ ...f, bookableOnline: e.target.checked })} label="Clients can book this online" />
          <Checkbox checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} label="Active" />
        </div>
      </form>
    </Modal>
  )
}

function Packages() {
  const studio = useRequiredStudio()
  const q = useQuery({ queryKey: ['packages', 'all'], queryFn: api.packages.all })
  const rooms = useQuery({ queryKey: ['rooms', 'all'], queryFn: api.rooms.all })
  const [edit, setEdit] = useState<ServicePackage | null | 'new'>(null)
  const { save } = useSaver(['packages', 'all'])
  if (q.isLoading) return <Loading />
  return (
    <>
      <div className="flex justify-end mb-4"><Button onClick={() => setEdit('new')}><Plus size={16} /> New service</Button></div>
      {!q.data?.length ? (
        <EmptyState title="No services yet">Add what clients can book: recording hours, mixing, a music video package…</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {q.data.map((p) => (
            <Card key={p.id} className={`p-5 ${p.isActive ? '' : 'opacity-50'}`}>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs font-mono uppercase text-brand-cyan">{p.category}</p>
                  <p className="font-headline font-semibold">{p.name}</p>
                  <p className="text-sm text-text-muted mt-1">
                    {money(p.price, studio.currency)}{p.pricingType === 'HOURLY' ? ' / hour' : ''} · {duration(p.durationMinutes)}
                    {p.depositPercent !== null && ` · ${p.depositPercent}% deposit`}
                  </p>
                  <p className="text-xs text-outline mt-1">
                    {p.roomIds.length ? (rooms.data ?? []).filter((r) => p.roomIds.includes(r.id)).map((r) => r.name).join(', ') : 'Any room'}
                    {!p.bookableOnline && ' · staff only'}{!p.isActive && ' · inactive'}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="quiet" onClick={() => setEdit(p)}>Edit</Button>
                  <ConfirmButton variant="quiet" onConfirm={async () => { const r = await api.packages.remove(p.id); await save(async () => r, () => undefined, removeLabel(r)) }}>Delete</ConfirmButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <PackageForm open={!!edit} onClose={() => setEdit(null)} pkg={edit === 'new' ? null : edit} rooms={rooms.data ?? []} />
    </>
  )
}

// ─── Rooms ───────────────────────────────────────────────────────────────────
function RoomForm({ room, open, onClose }: { room: Room | null; open: boolean; onClose: () => void }) {
  const { busy, save } = useSaver(['rooms', 'all'])
  const init = () => ({
    name: room?.name ?? '',
    description: room?.description ?? '',
    capacity: room?.capacity ? String(room.capacity) : '',
    color: room?.color ?? '#7C3AED',
    imageUrl: room?.imageUrl ?? null,
    isActive: room?.isActive ?? true,
  })
  const [f, setF] = useState(init)
  const [lastId, setLastId] = useState<string | null | undefined>(undefined)
  if (open && lastId !== (room?.id ?? null)) {
    setLastId(room?.id ?? null)
    setF(init())
  }
  if (!open && lastId !== undefined) setLastId(undefined)
  return (
    <Modal open={open} onClose={onClose} title={room ? 'Edit room' : 'New room'} footer={<><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" form="room-form" loading={busy}>Save</Button></>}>
      <form
        id="room-form"
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const data = {
            name: f.name.trim(),
            description: f.description.trim() || undefined,
            capacity: f.capacity ? Number(f.capacity) : undefined,
            color: f.color,
            ...(f.imageUrl ? { imageUrl: f.imageUrl } : {}),
            isActive: f.isActive,
          } as Partial<Room>
          void save(() => (room ? api.rooms.update(room.id, data) : api.rooms.create(data)), onClose)
        }}
      >
        <Field label="Name" hint='e.g. "Studio A", "Podcast booth", "Video stage"'><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Description"><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capacity (people)"><Input type="number" min={1} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
          <Field label="Calendar colour"><input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} className="h-10 w-full rounded-lg bg-transparent cursor-pointer" /></Field>
        </div>
        <Field label="Photo"><ImageUpload value={f.imageUrl} onChange={(url) => setF({ ...f, imageUrl: url })} /></Field>
        <Checkbox checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} label="Active (can be booked)" />
      </form>
    </Modal>
  )
}

function Rooms() {
  const q = useQuery({ queryKey: ['rooms', 'all'], queryFn: api.rooms.all })
  const [edit, setEdit] = useState<Room | null | 'new'>(null)
  const { save } = useSaver(['rooms', 'all'])
  if (q.isLoading) return <Loading />
  return (
    <>
      <div className="flex justify-end mb-4"><Button onClick={() => setEdit('new')}><Plus size={16} /> New room</Button></div>
      {!q.data?.length ? (
        <EmptyState title="No rooms yet">Every booking happens in a room. Add at least one to start taking bookings.</EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {q.data.map((r) => (
            <Card key={r.id} className={`p-5 ${r.isActive ? '' : 'opacity-50'}`}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                <p className="font-headline font-semibold">{r.name}</p>
              </div>
              {r.description && <p className="text-sm text-text-muted mt-1 line-clamp-2">{r.description}</p>}
              <p className="text-xs text-outline mt-1">{r.capacity ? `${r.capacity} people` : ''}{!r.isActive && ' · inactive'}</p>
              <div className="flex gap-1 mt-3">
                <Button variant="quiet" onClick={() => setEdit(r)}>Edit</Button>
                <ConfirmButton variant="quiet" onConfirm={async () => { const res = await api.rooms.remove(r.id); await save(async () => res, () => undefined, removeLabel(res)) }}>Delete</ConfirmButton>
              </div>
            </Card>
          ))}
        </div>
      )}
      <RoomForm open={!!edit} onClose={() => setEdit(null)} room={edit === 'new' ? null : edit} />
    </>
  )
}

// ─── Equipment ───────────────────────────────────────────────────────────────
function EquipmentForm({ item, open, onClose }: { item: Equipment | null; open: boolean; onClose: () => void }) {
  const studio = useRequiredStudio()
  const { busy, save } = useSaver(['equipment', 'all'])
  const init = () => ({
    name: item?.name ?? '',
    category: item?.category ?? '',
    description: item?.description ?? '',
    price: item ? String(item.pricePerBooking) : '0',
    serialNumber: item?.serialNumber ?? '',
    barcode: item?.barcode ?? '',
    status: item?.status ?? ('OPERATIONAL' as EquipmentStatus),
    purchaseDate: item?.purchaseDate ?? '',
    purchasePrice: item?.purchasePrice !== undefined && item?.purchasePrice !== null ? String(item.purchasePrice) : '',
    isActive: item?.isActive ?? true,
  })
  const [f, setF] = useState(init)
  const [lastId, setLastId] = useState<string | null | undefined>(undefined)
  if (open && lastId !== (item?.id ?? null)) {
    setLastId(item?.id ?? null)
    setF(init())
  }
  if (!open && lastId !== undefined) setLastId(undefined)
  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit equipment' : 'New equipment'} wide footer={<><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" form="eq-form" loading={busy}>Save</Button></>}>
      <form
        id="eq-form"
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const data = {
            name: f.name.trim(),
            category: f.category.trim() || undefined,
            description: f.description.trim() || undefined,
            pricePerBooking: Number(f.price) || 0,
            serialNumber: f.serialNumber.trim() || undefined,
            barcode: f.barcode.trim() || undefined,
            status: f.status,
            purchaseDate: f.purchaseDate || undefined,
            purchasePrice: f.purchasePrice ? Number(f.purchasePrice) : undefined,
            isActive: f.isActive,
          } as Partial<Equipment>
          void save(() => (item ? api.equipment.update(item.id, data) : api.equipment.create(data)), onClose)
        }}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Category" hint="e.g. Microphone, Outboard, Monitoring, Guitar"><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Serial Number" hint="Hardware serial"><Input placeholder="e.g. SN-849102" value={f.serialNumber} onChange={(e) => setF({ ...f, serialNumber: e.target.value })} /></Field>
          <Field label="Barcode / Asset Tag" hint="Scan or inventory ID"><Input placeholder="e.g. BC-0042" value={f.barcode} onChange={(e) => setF({ ...f, barcode: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as EquipmentStatus })}>
              <option value="OPERATIONAL">Operational</option>
              <option value="NEEDS_MAINTENANCE">Needs Maintenance</option>
              <option value="IN_REPAIR">In Repair</option>
              <option value="RETIRED">Retired</option>
            </Select>
          </Field>
        </div>
        <Field label="Description"><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label={`Charge per booking (${studio.currency})`} hint="0 = included"><Input type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
          <Field label="Purchase Date"><input type="date" className="input-studio text-sm w-full" value={f.purchaseDate} onChange={(e) => setF({ ...f, purchaseDate: e.target.value })} /></Field>
          <Field label={`Purchase Price (${studio.currency})`}><Input type="number" min={0} value={f.purchasePrice} onChange={(e) => setF({ ...f, purchasePrice: e.target.value })} /></Field>
        </div>
        <Checkbox checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} label="Active (can be reserved)" />
      </form>
    </Modal>
  )
}

function EquipmentList() {
  const studio = useRequiredStudio()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['equipment', 'all'], queryFn: api.equipment.all })
  const [edit, setEdit] = useState<Equipment | null | 'new'>(null)
  const [maintenanceItem, setMaintenanceItem] = useState<Equipment | null>(null)
  const { save } = useSaver(['equipment', 'all'])
  if (q.isLoading) return <Loading />

  const statusBadges: Record<EquipmentStatus, { label: string; cls: string }> = {
    OPERATIONAL: { label: 'Operational', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' },
    NEEDS_MAINTENANCE: { label: 'Needs Maintenance', cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
    IN_REPAIR: { label: 'In Repair', cls: 'bg-rose-500/20 text-rose-400 border border-rose-500/40' },
    RETIRED: { label: 'Retired', cls: 'bg-white/10 text-text-muted border border-white/20' },
  }

  return (
    <>
      <div className="flex justify-end mb-4"><Button onClick={() => setEdit('new')}><Plus size={16} /> New equipment</Button></div>
      {!q.data?.length ? (
        <EmptyState title="No equipment listed">List gear that clients can reserve with a session. Each item can only be in one session at a time.</EmptyState>
      ) : (
        <div className="glass-card rounded-xl divide-y divide-white/5">
          {q.data.map((g) => {
            const st = statusBadges[g.status ?? 'OPERATIONAL']
            return (
              <div key={g.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${g.isActive ? '' : 'opacity-50'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">{g.name}</p>
                    {g.category && <span className="text-xs text-outline">{g.category}</span>}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-text-muted font-mono">
                    {g.serialNumber && <span>SN: <strong className="text-text-primary">{g.serialNumber}</strong></span>}
                    {g.barcode && <span className="flex items-center gap-1"><QrCode size={12} className="text-brand-cyan" /> {g.barcode}</span>}
                    {g.lastMaintainedAt && <span className="text-outline">Serviced: {g.lastMaintainedAt.slice(0, 10)}</span>}
                  </div>
                  {g.description && <p className="text-xs text-text-muted mt-1">{g.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono mr-2">{g.pricePerBooking > 0 ? money(g.pricePerBooking, studio.currency) : 'Included'}</span>
                  <Button variant="glass" size="sm" onClick={() => setMaintenanceItem(g)} title="Maintenance history & calibrations">
                    <Wrench size={13} className="mr-1 text-brand-cyan" /> Maintenance
                  </Button>
                  <Button variant="quiet" size="sm" onClick={() => setEdit(g)}>Edit</Button>
                  <ConfirmButton variant="quiet" size="sm" onConfirm={async () => { const r = await api.equipment.remove(g.id); await save(async () => r, () => undefined, removeLabel(r)) }}>Delete</ConfirmButton>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <EquipmentForm open={!!edit} onClose={() => setEdit(null)} item={edit === 'new' ? null : edit} />
      <MaintenanceModal
        open={!!maintenanceItem}
        onClose={() => setMaintenanceItem(null)}
        item={maintenanceItem}
        currency={studio.currency}
        onUpdated={() => {
          void qc.invalidateQueries({ queryKey: ['equipment', 'all'] })
          setMaintenanceItem(null)
        }}
      />
    </>
  )
}

function Services() {
  const initial = (useSearchParams().get('tab') as Tab) || 'packages'
  const [tab, setTab] = useState<Tab>(initial)
  return (
    <>
      <PageHeader title="Services, rooms & gear" subtitle="What clients can book, where, and with what." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'packages', label: 'Services & prices' }, { value: 'rooms', label: 'Rooms' }, { value: 'equipment', label: 'Equipment' }]} />
      {tab === 'packages' && <Packages />}
      {tab === 'rooms' && <Rooms />}
      {tab === 'equipment' && <EquipmentList />}
    </>
  )
}

export default function ServicesPage() {
  return <Suspense><Services /></Suspense>
}
