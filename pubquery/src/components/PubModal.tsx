import { X, Beer, Users, MapPin, Clock, Spool, Share2 } from 'lucide-react'
import { format, differenceInMinutes, isToday } from 'date-fns'
import type { Pub } from '../types/Pub'
import { useState } from 'react'
import { getOpenString } from '../utils/dateString'
import { StatusLabel } from '../utils/capacity'
import { getCapacityInfo, getVisitorStatus } from '../utils/pubUtils'

type Props = {
  pub: Pub | null
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

/** helpers for share URL */
function slugify(text = '') {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-åäö]/g, '')
}
function base64UrlEncode(obj: unknown) {
  const json = JSON.stringify(obj)
  // encodeURIComponent → unescape → btoa to preserve unicode
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
function buildSharePath(pub: Pub) {
  const hasNumericId = Number.isFinite(Number(pub.event_id))
  if (hasNumericId) {
    const id = pub.event_id
    const t = slugify(pub.title || pub.display_name || 'pub')
    const v = slugify(pub.venue_name || pub.location || '')
    return `/event/${id}-${t}-${v}`
  }
  // synthetic: encode the full pub
  const data = base64UrlEncode(pub)
  return `/event/synth?data=${data}`
}

export default function PubModal({ pub, open, onClose }: Props) {
  const [descExpanded, setDescExpanded] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle')
  if (!open || !pub) return null

  // Opening logic
  const openTime = new Date(pub.date)
  const now = new Date()
  const isOpen = now >= openTime
  const timeStr = format(openTime, 'HH:mm')
  const minutesUntilOpen = differenceInMinutes(openTime, now)
  const { totalVisitors, externalPercentage, capacity } = getCapacityInfo(pub, isOpen)
  const visitorStatus = capacity !== null ? getVisitorStatus(capacity * 100) : null

  if (typeof pub.beer_price === 'number' && pub.beer_price < 1) {
    pub.beer_price = undefined
  }

  const hasAnyPrice =
    typeof pub.beer_price === 'number' ||
    typeof pub.cider_price === 'number' ||
    typeof pub.drink_price === 'number'

  const wordLimit = 35
  let descriptionNode = null
  if (pub.description) {
    const { shown, rest, needsTruncate } = splitDescription(pub.description, wordLimit)
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
      <span>{pub.description}</span>
    )
  }

  const priceBlock = (label: string, price?: number, desc?: string) => (
    <div className="bg-gray-200 rounded-lg py-4 flex-1 text-center min-w-[110px]">
      <div className="text-xl font-semibold text-gray-900">{price ? `${price} kr` : '-'}</div>
      <div className="text-gray-600 text-sm">{label}</div>
      {desc && <div className="text-xs text-gray-400 mt-1">{desc}</div>}
    </div>
  )

  async function handleShare() {
    if (!pub) return // TS is happy
    const path = buildSharePath(pub)
    const url = `${window.location.origin}${path}`
    const title = pub.title || pub.venue_name || 'Studentpub'
    const text = `${pub.display_name ? pub.display_name + ' – ' : ''}${pub.venue_name || pub.location || ''}`

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 1500)
    } catch {
      // last resort: select+copy via prompt
      try {
        const ok = window.prompt('Kopiera länken:', url)
        if (ok !== null) setShareState('copied')
        else setShareState('error')
      } catch {
        setShareState('error')
      }
      setTimeout(() => setShareState('idle'), 1500)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
      onClick={onClose} // Click outside triggers close
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-4 sm:p-8 animate-fadein 
  max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Overline (theme/title) */}
        {pub.title && (
          <div className="text-xs uppercase tracking-wide font-semibold mb-1 text-blue-700 ">
            {pub.title}
          </div>
        )}

        {/* Header row: icon, venue, organiser */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow"
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {pub.logo_url ? (
              <img
                src={pub.logo_url}
                alt="Organisation Logo"
                className="object-contain w-10 h-10"
                draggable={false}
              />
            ) : (
              <Beer size={28} className="text-blue-500" />
            )}
          </div>
          <div>
            {/* Venue Name */}
            <div className="font-bold text-2xl text-gray-900">{pub.venue_name}</div>
            {/* Organiser (if present) */}
            {pub.display_name && (
              <div className="text-gray-500 text-base -mt-1">{pub.display_name}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-2 mb-3 text-sm">
          <div className="flex items-center text-gray-600">
            <span className="w-5 flex-shrink-0 flex items-center justify-center">
              <Clock size={16} />
            </span>
            <span className="ml-2">
              {isOpen
                ? `Öppnade ${timeStr}`
                : isToday(openTime)
                  ? `Öppnar om ${Math.floor(minutesUntilOpen / 60)}h ${minutesUntilOpen % 60}min`
                  : getOpenString(openTime, now)}
            </span>
          </div>
          <div className="flex items-center text-gray-500">
            <span className="w-5 flex-shrink-0 flex items-center justify-center">
              <MapPin size={16} />
            </span>
            <a className="ml-2" href={pub.maps_link} target="_blank" rel="noopener noreferrer">
              {pub.address}
            </a>
          </div>
          {pub.patches === 1 && (
            <div className="flex items-center text-gray-700">
              <span className="w-5 flex-shrink-0 flex items-center justify-center">
                <Spool size={16} className="text-green-600" />
              </span>
              <span className="ml-2 text-xs">Märken säljs här!</span>
            </div>
          )}
        </div>

        {/* Om puben */}
        {pub.description && (
          <>
            <div className="font-bold mb-1 mt-2 text-gray-800">Om puben</div>
            <div className="text-gray-700 mb-4">{descriptionNode}</div>
          </>
        )}

        {/* Priser */}
        {hasAnyPrice && (
          <>
            <div className="font-bold mb-1 text-gray-800">Priser</div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {priceBlock('Öl', pub.beer_price)}
              {priceBlock('Cider', pub.cider_price)}
              {priceBlock('Drink', pub.drink_price)}
            </div>
          </>
        )}

        {/* Attendance info */}
        <div className="font-bold mb-2 text-gray-800">Kapacitet</div>
        <div className="flex items-center gap-2 mb-1 text-gray-700 text-sm">
          <Users size={16} />
          <span className="font-semibold">Besökare</span>
          <span className="ml-auto flex items-center gap-1">
            {visitorStatus ? (
              <StatusLabel {...visitorStatus} />
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </span>
        </div>

        <div
          className={`mt-2 w-full h-2 rounded overflow-hidden ${
            totalVisitors === null ? 'bg-gray-100' : 'bg-[rgb(39,44,62)]'
          }`}
        >
          {totalVisitors === null ? (
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,_#e5e7eb_0,_#e5e7eb_4px,_transparent_4px,_transparent_8px)]" />
          ) : (
            <div
              className={`${visitorStatus?.bar ?? 'bg-gray-200'} h-full`}
              style={{ width: `${(capacity ?? 0) * 100}%` }}
            />
          )}
        </div>

        {externalPercentage !== null && (
          <div className="text-xs text-gray-500 mb-4 mt-1">
            {externalPercentage}% externa besökare
          </div>
        )}

        {/* Action buttons at the bottom */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={handleShare}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium shadow transition
              ${shareState === 'copied' ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white hover:bg-black'}
            `}
            aria-label="Dela event"
            title="Dela event"
          >
            <Share2 size={18} />
            {shareState === 'copied' ? 'Kopierad!' : 'Dela'}
          </button>

          {pub.fb_link && (
            <a
              href={pub.fb_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
            >
              Facebook-event
            </a>
          )}
          {pub.maps_link && (
            <a
              href={pub.maps_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium shadow hover:bg-green-700 transition"
            >
              Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
