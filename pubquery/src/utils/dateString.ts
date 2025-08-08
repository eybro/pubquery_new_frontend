import { format, isToday, isTomorrow, differenceInCalendarDays, isThisWeek, differenceInMinutes } from "date-fns"

const weekdayNames = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"]
const swedishMonths = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december"
]

export function getSwedishOrdinal(n: number): string {
  if ([1, 2, 21, 22, 31].includes(n)) return `${n}:a`
  if ([3, 23].includes(n)) return `${n}:e`
  return `${n}:e`
}

/**
 * Returns a Swedish opening time string for a pub event
 * @param openTime The event start time as a Date
 * @param now The current time as a Date
 */
export function getOpenString(openTime: Date, now: Date): string {
  if (isToday(openTime)) {
    const minutes = Math.max(0, differenceInMinutes(openTime, now))
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    let parts = []
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "timme" : "timmar"}`)
    if (mins > 0) parts.push(`${mins} minuter`)
    if (parts.length === 0) parts.push("mindre än en minut")
    return `Öppnar om ${parts.join(" ")}`
  }
  const hourMinute = format(openTime, "HH:mm")
  if (isTomorrow(openTime)) {
    return `Öppnar ${hourMinute} i morgon`
  }
  const daysDiff = differenceInCalendarDays(openTime, now)
  const weekday = weekdayNames[openTime.getDay()]
  if (isThisWeek(openTime, { weekStartsOn: 1 }) && daysDiff > 1) {
    return `Öppnar ${hourMinute} på ${weekday}`
  }
  const day = getSwedishOrdinal(openTime.getDate())
  const month = swedishMonths[openTime.getMonth()]
  return `Öppnar ${hourMinute} på ${weekday}en ${day} ${month}`
}
