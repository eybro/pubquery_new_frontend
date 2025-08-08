import type { Pub } from "../types/Pub"

export const lineLengthLabels = {
  short: { text: 'Kort kö', emoji: '🟢', color: 'text-green-500' },
  medium: { text: 'Medellång kö', emoji: '🟡', color: 'text-yellow-400' },
  long: { text: 'Lång kö', emoji: '🔴', color: 'text-red-500' },
}

export function getCapacityInfo(pub: Pub, isOpen: boolean) {
  const hasMemberData =
    typeof pub.member_count === 'number' && typeof pub.non_member_count === 'number'
  const hasTotalAttendance = typeof pub.total_attendance === 'number'

  let totalVisitors: number | null = null
  let externalPercentage: number | null = null

  if (isOpen) {
    if (hasMemberData) {
      totalVisitors = pub.member_count + pub.non_member_count
      externalPercentage =
        totalVisitors > 0
          ? Math.round((pub.non_member_count / totalVisitors) * 100)
          : 0
    } else if (hasTotalAttendance) {
      totalVisitors = pub.total_attendance
    }
  }

  if (externalPercentage !== null && externalPercentage > 50) {
    externalPercentage = 50
  }

  const capacity = totalVisitors !== null ? totalVisitors / pub.max_capacity : null

  return {
    hasMemberData,
    hasTotalAttendance,
    totalVisitors,
    externalPercentage,
    capacity
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

export function isShortCard(pub: Pub, isOpen: boolean, totalVisitors: number | null) {
  return (
    !isOpen ||
    (
      (!pub.line_length || pub.line_length === 'no_line' || !(pub.line_length in lineLengthLabels))
      && totalVisitors === null
    )
  )
}

type StatusLabelProps = { text: string; emoji: string; color: string }
export function StatusLabel({ text, emoji, color }: StatusLabelProps) {
  return (
    <span className="flex items-center gap-1 font-medium">
      <span className={color}>{emoji}</span>
      <span>{text}</span>
    </span>
  )
}