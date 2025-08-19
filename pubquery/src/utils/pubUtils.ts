import type { Pub } from '../types/Pub'

export const lineLengthLabels = {
  short: { text: 'Kort kö', emoji: '🟢', color: 'text-green-500' },
  medium: { text: 'Medellång kö', emoji: '🟡', color: 'text-yellow-400' },
  long: { text: 'Lång kö', emoji: '🔴', color: 'text-red-500' },
}

// --- Type guard so TS narrows properly ---
function hasMemberCounts(pub: Pub): pub is Pub & {
  member_count: number
  non_member_count: number
} {
  return (
    typeof pub.member_count === 'number' &&
    typeof pub.non_member_count === 'number'
  )
}

export function getCapacityInfo(pub: Pub, isOpen: boolean) {
  const hasTotalAttendance = typeof pub.total_attendance === 'number'

  let totalVisitors: number | null = null
  let externalPercentage: number | null = null

  if (isOpen) {
    if (hasMemberCounts(pub)) {
      totalVisitors = pub.member_count + pub.non_member_count
      if (totalVisitors > 0) {
        externalPercentage = Math.round((pub.non_member_count / totalVisitors) * 100)
      } else {
        externalPercentage = 0
      }
    } else if (hasTotalAttendance) {
      // guaranteed number by the check above
      totalVisitors = pub.total_attendance as number
      // no member split available -> leave externalPercentage as null
    }
  }

  // Cap at 50 if we have a value
  if (externalPercentage !== null && externalPercentage > 50) {
    externalPercentage = 50
  }

  // Max capacity may be missing or 0; keep capacity as null in those cases
  const maxCap =
    typeof pub.max_capacity === 'number' && pub.max_capacity > 0
      ? (pub.max_capacity as number)
      : null

  const capacity = totalVisitors !== null && maxCap !== null ? totalVisitors / maxCap : null

  return {
    hasMemberData: hasMemberCounts(pub),
    hasTotalAttendance,
    totalVisitors,
    externalPercentage,
    capacity,
  }
}

export function getVisitorStatus(capacityPercent: number | null) {
  if (capacityPercent === null) return null
  if (capacityPercent >= 95)
    return { text: 'Fullt', emoji: '🚀', color: 'text-red-500', bar: 'bg-red-500' }
  if (capacityPercent >= 71)
    return { text: 'Många besökare', emoji: '🚀', color: 'text-red-500', bar: 'bg-red-500' }
  if (capacityPercent >= 31)
    return { text: 'Mellan', emoji: '🟡', color: 'text-yellow-400', bar: 'bg-yellow-400' }
  return { text: 'Få besökare', emoji: '🟢', color: 'text-green-500', bar: 'bg-green-500' }
}

export function isShortCard(isOpen: boolean, totalVisitors: number | null) {
  return !isOpen || totalVisitors === null
}
