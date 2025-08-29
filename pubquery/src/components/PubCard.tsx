import { MapPin, Users, Clock, Calendar, Beer } from 'lucide-react'
import type { Pub } from '../types/Pub'
import { format, differenceInCalendarDays, isToday, isTomorrow, isYesterday } from 'date-fns'
import { getOpenString, getPastDateString } from '../utils/dateString'
import { getCapacityInfo, getVisitorStatus, isShortCard, lineLengthLabels } from '../utils/pubUtils'
import { StatusLabel } from '../utils/capacity'

type Props = {
  pub: Pub
  onClick?: () => void
}

export default function PubCard({ pub, onClick }: Props) {
  const openTime = new Date(pub.date)
  const now = new Date()
  const isOpen = now >= openTime
  const timeStr = format(openTime, 'HH:mm')
  const isSameDay = openTime.toDateString() === now.toDateString()
  const statusText = isOpen ? `Öppnade ${timeStr}` : `Öppnar ${timeStr} idag`

  const { totalVisitors, externalPercentage, capacity } = getCapacityInfo(pub, isOpen)

  const attendanceStarted = isOpen
  const visitorStatus = capacity !== null ? getVisitorStatus(capacity * 100) : null
  const shortCard = isShortCard(isOpen, totalVisitors)

  return (
    <div
      className="
        bg-white text-black rounded-xl shadow-md p-4 min-h-[195px]
        flex flex-col transition-all duration-200
        hover:shadow-2xl hover:scale-[1.03] hover:z-10
        cursor-pointer
        relative
      "
      onClick={onClick}
    >
      {/* Logo or Beer icon at top right */}
     {/* Logo(s) top right */}
{/* Logo(s) top right — let clicks pass through to the card */}
<div
  className="absolute top-4 right-4 z-10 flex -space-x-2 pointer-events-none select-none"
  aria-hidden="true"
>
  <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center overflow-hidden">
    {pub.logo_url ? (
      <img
        src={pub.logo_url}
        alt="Host Logo"
        className="object-contain w-10 h-10"
        draggable={false}
      />
    ) : (
      <Beer size={28} className="text-blue-500" />
    )}
  </div>

  {pub.cohost_logo_url && (
    <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center overflow-hidden">
      <img
        src={pub.cohost_logo_url}
        alt="Cohost Logo"
        className="object-contain w-10 h-10"
        draggable={false}
      />
    </div>
  )}
</div>


      {/* Overline / subtitle */}
      <div className="text-xs uppercase tracking-wide font-semibold mb-1 text-blue-700 truncate max-w-[calc(100%-40px)]">
        {pub.title}
      </div>
      <h3 className="font-bold text-lg">{pub.venue_name}</h3>

      <div className="flex-1 flex flex-col justify-start">
        <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
          <MapPin size={14} /> {pub.location}
        </p>

        <div className="text-sm flex items-center gap-2 mb-1">
          {isOpen && !isSameDay ? (
            <>
              <Clock size={14} className="text-blue-500" />
              <span>{getPastDateString(openTime, now)}</span>
            </>
          ) : isOpen && now.getHours() < 3 && isYesterday(openTime) ? (
            <>
              <Clock size={14} className="text-green-500" />
              <span>{statusText}</span>
            </>
          ) : isSameDay && !isOpen ? (
            <>
              <Clock size={14} className="text-blue-500" />
              <span>{statusText}</span>
            </>
          ) : isSameDay && isOpen ? (
            <>
              <Clock size={14} className="text-green-500" />
              <span>{statusText}</span>
            </>
          ) : (
            <>
              <Calendar size={14} className="text-blue-500" />
              <span>{getOpenString(openTime, now)}</span>
            </>
          )}
        </div>

        {/* If queue info */}
        {attendanceStarted &&
          pub.line_length !== 'no_line' &&
          pub.line_length in lineLengthLabels && (
            <div className="mt-2 text-sm flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1 text-gray-700">
                <Users size={14} />
                <span>Kö</span>
              </div>
              {(() => {
                const label = lineLengthLabels[pub.line_length as keyof typeof lineLengthLabels]
                return <StatusLabel emoji={label.emoji} text={label.text} color={label.color} />
              })()}
            </div>
          )}

        {/* If visitor info */}
        {attendanceStarted &&
          (pub.line_length === 'no_line' || !(pub.line_length in lineLengthLabels)) &&
          totalVisitors !== null &&
          visitorStatus && (
            <>
              <div className="mt-2 text-sm flex items-center gap-2 justify-between">
                <div className="flex items-center gap-1 text-gray-700">
                  <Users size={14} />
                  <span>Besökare</span>
                </div>
                <StatusLabel
                  emoji={visitorStatus.emoji}
                  text={visitorStatus.text}
                  color={visitorStatus.color}
                />
              </div>

              {typeof pub.ratio_visible === 'number' && (
                <div className="mt-2 w-full h-2 rounded overflow-hidden bg-[rgb(39,44,62)]">
                  <div
                    className={`${visitorStatus.bar} h-full`}
                    style={{ width: `${(capacity ?? 0) * 100}%` }}
                  ></div>
                </div>
              )}

              {externalPercentage !== null && (
                <p className="text-xs text-gray-500 mt-1">{externalPercentage}% externa besökare</p>
              )}
            </>
          )}

        {/* If "no info" */}
        {attendanceStarted &&
          totalVisitors === null &&
          (pub.line_length === 'no_line' || !(pub.line_length in lineLengthLabels)) && (
            <>
              <div className="mt-2 text-sm flex items-center gap-2 justify-between text-gray-400">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>Besökare</span>
                </div>
                <span>-</span>
              </div>
              <div className="mt-2 w-full h-2 bg-gray-100 rounded overflow-hidden">
                <div className="w-full h-full bg-[repeating-linear-gradient(90deg,_#e5e7eb_0,_#e5e7eb_4px,_transparent_4px,_transparent_8px)]"></div>
              </div>
            </>
          )}

        {/* Subtle divider for short cards */}
        {shortCard && <div className="border-t border-gray-300 my-3" />}
      </div>

      {/* Footer always at the bottom */}
      <div>
        {!attendanceStarted && (
          <p className="text-sm text-gray-400 italic mt-1">
            {isToday(openTime)
              ? getOpenString(openTime, now)
              : isTomorrow(openTime)
                ? 'Öppnar imorgon'
                : `Öppnar om ${differenceInCalendarDays(openTime, now)} dagar`}
          </p>
        )}
      </div>
    </div>
  )
}
