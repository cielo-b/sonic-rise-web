/** Studio-local date/time ↔ instants, using the studio's IANA time zone. */

function partsIn(instant: Date, timeZone: string) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>
}

/** Offset of the zone from UTC at that instant, in minutes. */
function offsetMinutes(instant: Date, timeZone: string): number {
  const p = partsIn(instant, timeZone)
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute)
  return Math.round((asUtc - Math.floor(instant.getTime() / 60_000) * 60_000) / 60_000)
}

/** ISO instant for a studio-local date (YYYY-MM-DD) and time (HH:mm). */
export function studioDateTime(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, hh, mm)
  const first = guess - offsetMinutes(new Date(guess), timeZone) * 60_000
  return new Date(guess - offsetMinutes(new Date(first), timeZone) * 60_000).toISOString()
}

/** Studio-local date and time strings for form inputs. */
export function toStudioInputs(iso: string, timeZone: string): { date: string; time: string } {
  const p = partsIn(new Date(iso), timeZone)
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }
}

/** Today's date in the studio's zone (YYYY-MM-DD). */
export function studioToday(timeZone: string): string {
  return toStudioInputs(new Date().toISOString(), timeZone).date
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return t.toISOString().slice(0, 10)
}

/** 0 = Sunday … 6 = Saturday for a YYYY-MM-DD date. */
export function weekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
