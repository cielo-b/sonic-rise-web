'use client'

import type { Invoice, Quote } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { money } from '@/lib/format'

/** Line items and totals of a quote or invoice. */
export function DocumentLines({ doc }: { doc: Quote | Invoice }) {
  const { t, locale } = useI18n()
  const subtotal = doc.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const paid = 'amountPaid' in doc ? doc.amountPaid : 0
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[420px]">
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-white/10">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 font-medium text-right">Qty</th>
            <th className="py-2 font-medium text-right">Price</th>
            <th className="py-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="py-2">{l.description}</td>
              <td className="py-2 text-right font-mono">{l.quantity}</td>
              <td className="py-2 text-right font-mono">{money(l.unitPrice, doc.currency, locale)}</td>
              <td className="py-2 text-right font-mono">{money(l.quantity * l.unitPrice, doc.currency, locale)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="text-right">
          {doc.discount > 0 && (
            <>
              <tr><td colSpan={3} className="pt-3 text-text-muted">Subtotal</td><td className="pt-3 font-mono">{money(subtotal, doc.currency, locale)}</td></tr>
              <tr><td colSpan={3} className="text-text-muted">Discount</td><td className="font-mono">−{money(doc.discount, doc.currency, locale)}</td></tr>
            </>
          )}
          <tr><td colSpan={3} className="pt-2 font-semibold">{t('common.total')}</td><td className="pt-2 font-mono font-bold">{money(doc.total, doc.currency, locale)}</td></tr>
          {paid > 0 && (
            <>
              <tr><td colSpan={3} className="text-text-muted">{t('common.paid')}</td><td className="font-mono">{money(paid, doc.currency, locale)}</td></tr>
              <tr><td colSpan={3} className="font-semibold">{t('common.due')}</td><td className="font-mono font-bold">{money(doc.total - paid, doc.currency, locale)}</td></tr>
            </>
          )}
        </tfoot>
      </table>
    </div>
  )
}
