/** The studio runs on Kigali time (UTC+2, no daylight saving). */
export const STUDIO_TZ = 'Africa/Kigali'
const STUDIO_OFFSET = '+02:00'

/** Builds an ISO timestamp from date (YYYY-MM-DD) and time (HH:mm) inputs in studio time. */
export function studioDateTime(date: string, time: string): string {
  return `${date}T${time}:00${STUDIO_OFFSET}`
}

/** Splits a timestamp into studio-time values for date/time inputs. */
export function toStudioInputs(iso: string): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: STUDIO_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}
