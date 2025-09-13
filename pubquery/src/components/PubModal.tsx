import { X, Beer, Users, MapPin, Clock, Spool, Share2 } from 'lucide-react'
import { format, differenceInMinutes, isToday, isSameDay } from 'date-fns'
import type { Pub } from '../types/Pub'
import { useState } from 'react'
import { getOpenString, getPastDateString } from '../utils/dateString'
import { StatusLabel } from '../utils/capacity'
import { getCapacityInfo, getVisitorStatus, lineLengthLabels } from '../utils/pubUtils'

type Props = {
  pub: Pub | null
  open: boolean
  onClose: () => void
}

function isMacDesktopChrome() {
  const ua = navigator.userAgent
  return ua.includes('Macintosh') && ua.includes('Chrome') && !/Mobile|iP(hone|od|ad)/.test(ua)
}

function canNativeShare(data: ShareData) {
  try {
    // canShare is safer where available
    // @ts-ignore
    if (typeof navigator.canShare === 'function') {
      // @ts-ignore
      return navigator.canShare(data)
    }
  } catch {
    /* ignore */
  }
  return !!navigator.share
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback prompt as last resort
    const ok = window.prompt('Kopiera länken:', text)
    return ok !== null
  }
}


function splitDescription(text: string, wordLimit: number) {
  const words = text.split(/\s+/)
  const needsTruncate = words.length > wordLimit
  const shown = words.slice(0, wordLimit).join(' ')
  const rest = words.slice(wordLimit).join(' ')
  return { shown, rest, needsTruncate }
}

/** helpers for share URL */
function slugify(text: string = '') {
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
  const isSameCalDay = isSameDay(openTime, now)
  const { totalVisitors, externalPercentage, capacity } = getCapacityInfo(pub, isOpen)
  const visitorStatus = capacity !== null ? getVisitorStatus(capacity * 100) : null
  const attendanceStarted = isOpen

  const timeLabel = isOpen
    ? isSameCalDay
      ? `Öppnade ${timeStr}`
      : getPastDateString(openTime, now)
    : isToday(openTime)
      ? `Öppnar om ${Math.floor(minutesUntilOpen / 60)}h ${minutesUntilOpen % 60}min`
      : getOpenString(openTime, now)

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

  // NEW: combined organizer names for display + share
  const organizerNames = [pub.display_name, pub.cohost_display_name]
    .filter(Boolean)
    .join(' & ')

  async function handleShare() {
  if (!pub) return
  const path = buildSharePath(pub)
  const url = `${window.location.origin}${path}`
  const title = pub.title || pub.venue_name || 'Studentpub'
  const text = `${organizerNames ? organizerNames + ' – ' : ''}${pub.venue_name || pub.location || ''}`
  const payload: ShareData = { title, text, url }

  // Workaround: avoid native share on macOS desktop Chrome
  if (isMacDesktopChrome() || !canNativeShare(payload)) {
    const ok = await copyToClipboard(url)
    setShareState(ok ? 'copied' : 'error')
    setTimeout(() => setShareState('idle'), 1500)
    return
  }

  try {
    // Native share path
    // Important: do NOT run fallbacks if the user cancels (AbortError)
    // or you risk locking the native sheet on macOS Chrome.
    // @ts-ignore - TS may not know ShareData
    await navigator.share(payload)
  } catch (err: any) {
    const name = err?.name || ''
    const msg = err?.message || ''
    // User canceled → silently ignore to avoid the ghost popup bug
    if (name === 'AbortError' || /abort/i.test(msg)) {
      return
    }
    // Other errors → fallback to copy
    const ok = await copyToClipboard(url)
    setShareState(ok ? 'copied' : 'error')
    setTimeout(() => setShareState('idle'), 1500)
  }
}

console.log(pub.line_length)
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
      onClick={onClose}
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

        {/* Header row: logos, venue, organisers */}
        <div className="flex items-center gap-3 mb-3">
          {/* NEW: Dual-logo cluster (host + optional co-host) */}
          <div className="relative flex -space-x-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {pub.logo_url ? (
                <img
                  src={pub.logo_url}
                  alt="Värd organisation"
                  className="object-contain w-10 h-10"
                  draggable={false}
                />
              ) : (
                <Beer size={28} className="text-blue-500" />
              )}
            </div>

            {pub.cohost_logo_url && (
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={pub.cohost_logo_url}
                  alt="Medvärd organisation"
                  className="object-contain w-10 h-10"
                  draggable={false}
                />
              </div>
            )}
          </div>

          <div>
            {/* Venue Name */}
            <div className="font-bold text-2xl text-gray-900">{pub.venue_name}</div>
            {/* Organisers (host [& co-host]) */}
            {(pub.display_name || pub.cohost_display_name) && (
              <div className="text-gray-500 text-base -mt-1">
                {organizerNames}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-2 mb-3 text-sm">
          <div className="flex items-center text-gray-600">
            <span className="w-5 flex-shrink-0 flex items-center justify-center">
              <Clock size={16} />
            </span>
            <span className="ml-2">{timeLabel}</span>
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
