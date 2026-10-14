'use client'

import { useState } from 'react'
import { Wrench, Plus, CheckCircle2, AlertTriangle, Calendar, Clock, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { api, type Equipment, type EquipmentStatus } from '@/lib/api'
import { formatDateTime, money } from '@/lib/format'
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'

interface MaintenanceModalProps {
  open: boolean
  onClose: () => void
  item: Equipment | null
  currency: string
  onUpdated: () => void
}

export function MaintenanceModal({ open, onClose, item, currency, onUpdated }: MaintenanceModalProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [technician, setTechnician] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [nextScheduledDate, setNextScheduledDate] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('OPERATIONAL')
  const [submitting, setSubmitting] = useState(false)

  if (!item) return null

  const history = item.maintenanceHistory ?? []

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('Please enter a description of the maintenance')
      return
    }
    setSubmitting(true)
    try {
      await api.equipment.addMaintenance(item.id, {
        technician: technician.trim() || undefined,
        description: description.trim(),
        cost: cost ? Number(cost) : undefined,
        nextScheduledDate: nextScheduledDate || undefined,
        status,
      })
      toast.success('Maintenance log recorded')
      setShowAddForm(false)
      setDescription('')
      setTechnician('')
      setCost('')
      setNextScheduledDate('')
      onUpdated()
    } catch {
      toast.error('Failed to record maintenance log')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Maintenance History — ${item.name}`} wide>
      <div className="space-y-5">
        {/* Hardware Asset Overview Card */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-text-muted">{item.category || 'Studio Hardware'}</p>
            <h4 className="font-headline font-bold text-lg text-text-primary">{item.name}</h4>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-mono text-text-muted">
              {item.serialNumber && <span>SN: <strong className="text-text-primary">{item.serialNumber}</strong></span>}
              {item.barcode && <span>BARCODE: <strong className="text-brand-cyan">{item.barcode}</strong></span>}
              {item.lastMaintainedAt && (
                <span>Last Serviced: {formatDateTime(item.lastMaintainedAt, 'UTC')}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showAddForm ? 'quiet' : 'glass'}
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={14} className="mr-1" /> {showAddForm ? 'Cancel' : 'Log Maintenance'}
            </Button>
          </div>
        </div>

        {/* Add Maintenance Log Form */}
        {showAddForm && (
          <form onSubmit={handleAddLog} className="p-4 rounded-xl border border-brand-cyan/30 bg-black/50 space-y-3">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <Wrench size={15} className="text-brand-cyan" /> New Service & Calibration Entry
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Technician / Engineer" hint="Who performed the work">
                <Input
                  placeholder="e.g. Master Tech Alex"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                />
              </Field>

              <Field label={`Service Cost (${currency})`} hint="Parts & labor">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </Field>

              <Field label="Equipment Status" hint="Status after service">
                <Select value={status} onChange={(e) => setStatus(e.target.value as EquipmentStatus)}>
                  <option value="OPERATIONAL">Operational (Ready)</option>
                  <option value="NEEDS_MAINTENANCE">Needs Maintenance</option>
                  <option value="IN_REPAIR">In Repair / Bench Testing</option>
                  <option value="RETIRED">Retired</option>
                </Select>
              </Field>
            </div>

            <Field label="Work Performed / Calibration Notes" hint="e.g., Replaced vacuum tube 12AX7, cleaned potentiometers, recalibrated frequency response">
              <Textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field label="Next Scheduled Service Date" hint="Optional future reminder">
              <input
                type="date"
                value={nextScheduledDate}
                onChange={(e) => setNextScheduledDate(e.target.value)}
                className="input-studio text-sm w-auto"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="quiet" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Save Maintenance Entry
              </Button>
            </div>
          </form>
        )}

        {/* Maintenance Log Timeline */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Service & Inspection History ({history.length})
          </p>

          {history.length === 0 ? (
            <div className="text-center py-8 text-sm text-text-muted border border-dashed border-white/10 rounded-xl">
              <Wrench size={28} className="mx-auto mb-2 opacity-30" />
              No service logs recorded yet. Click &quot;Log Maintenance&quot; to track tube changes, calibrations, or inspections.
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary">
                        {log.technician ? log.technician : 'Studio Technician'}
                      </span>
                      <span className="text-xs text-text-muted font-mono flex items-center gap-1">
                        <Calendar size={12} /> {formatDateTime(log.date, 'UTC')}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted whitespace-pre-line">{log.description}</p>
                    {log.nextScheduledDate && (
                      <p className="text-[11px] text-brand-cyan flex items-center gap-1 mt-1">
                        <Clock size={11} /> Next Due: {log.nextScheduledDate}
                      </p>
                    )}
                  </div>

                  {log.cost !== undefined && log.cost > 0 && (
                    <span className="font-mono text-xs font-semibold text-text-primary px-2.5 py-1 rounded bg-white/5 border border-white/10">
                      {money(log.cost, currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
