import { X, MapPin, Calendar, CalendarClock, Ticket } from 'lucide-react'
import type { Dinner } from '../types/Dinner'
import { useState } from 'react'

type Props = {
  dinner: Dinner | null
  open: boolean
  onClose: () => void
}

function splitDescription(text: string, wordLimit: number) {
  const words = text.split(/\s+/)
  const needsTruncate = words.length > wordLimit
  const shown = words.slice(0, wordLimit).join(' ')
  const rest = words.slice(wordLimit).join(' ')
  return { shown, rest, needsTruncate }
}

export default function DinnerModal({ dinner, open, onClose }: Props) {
  const [descExpanded, setDescExpanded] = useState(false)
  if (!open || !dinner) return null

  // Opening logic

  const eventTime = new Date(dinner.date)
  const signupTime = dinner.signup_date ? new Date(dinner.signup_date) : undefined
  const now = new Date()

  const dateStr = eventTime.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
  })
  const timeStr = eventTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  const signupDateStr = signupTime
    ? signupTime.toLocaleDateString('sv-SE', {
        day: 'numeric',
        month: 'long',
      })
    : ''

  const signupTimeStr = signupTime
    ? signupTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    : ''

  const signupClosed = signupTime && now > signupTime



  const wordLimit = 35
  let descriptionNode = null
  if (dinner.description) {
    const { shown, rest, needsTruncate } = splitDescription(dinner.description, wordLimit)
    descriptionNode = needsTruncate ? (
      <>
        <span>{shown}</span>
        {!descExpanded && <span className="text-gray-400"> ...</span>}
        {descExpanded && <span>{' ' + rest}</span>}
        <button
          onClick={() => setDescExpanded((v) => !v)}
          className="ml-2 text-blue-600 text-xs underline cursor-pointer"
        >
          {descExpanded ? 'Visa mindre' : 'Visa mer'}
        </button>
      </>
    ) : (
      <span>{dinner.description}</span>
    )
  }

  const priceBlock = (label: string, price?: number, desc?: string) => (
    <div className="bg-gray-200 rounded-lg py-4 flex-1 text-center min-w-[110px]">
      <div className="text-xl font-semibold text-gray-900">{price ? `${price} kr` : '-'}</div>
      <div className="text-gray-600 text-sm">{label}</div>
      {desc && <div className="text-xs text-gray-400 mt-1">{desc}</div>}
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 animate-fadein 
                    max-h-[90vh] overflow-y-auto text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Header row: icon, venue, organiser */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow"
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {dinner.logo_url ? (
              <img
                src={dinner.logo_url}
                alt="Organisation Logo"
                className="object-contain w-10 h-10"
                draggable={false}
              />
            ) : (
              <Ticket size={28} className="text-blue-500" />
            )}
          </div>
          <div>
            {/* Venue Name */}
            <div className="font-bold text-2xl text-gray-900">{dinner.title}</div>
            {/* Organiser (if present) */}
            {dinner.display_name && (
              <div className="text-gray-500 text-base -mt-1">{dinner.display_name}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-2 mb-3 text-sm">
          <div className="text-sm flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>
                {dateStr} kl {timeStr}
              </span>
            </div>
            {signupTime && (
              <div className="flex items-center gap-1">
                <CalendarClock size={14} />
                {signupClosed ? (
                  <span className="text-red-500 font-semibold">Anmälan stängd</span>
                ) : (
                  <span>
                    OSA innan {signupDateStr} {signupTimeStr && <span>kl {signupTimeStr}</span>}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <MapPin size={14} />
            <a href={dinner.venue_maps_link} target="_blank" rel="noopener noreferrer" className="">
              {dinner.venue_name}, {dinner.venue_address}
            </a>
          </div>
        </div>

        {/* Om sittningen */}
        {dinner.description && (
          <>
            <div className="font-bold mb-1 mt-2 text-gray-800">Om sittningen</div>
            <div className="text-gray-700 mb-4">{descriptionNode}</div>
          </>
        )}

        {/* Priser */}
        <div className="font-bold mb-1 text-gray-800">Priser</div>
        <div className="flex gap-3 mb-6">
          {priceBlock('Utan alkohol', dinner.price_without_alcohol)}
          {priceBlock('Med alkohol', dinner.price_with_alcohol)}
        </div>

        {/* Action buttons at the bottom */}
        <div className="flex gap-3 mt-4">
          {dinner.signup_link && (
            <a
              href={dinner.signup_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium shadow hover:bg-green-700 transition"
            >
              Anmälan
            </a>
          )}
          {dinner.event_link && (
            <a
              href={dinner.event_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
            >
              Event
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
