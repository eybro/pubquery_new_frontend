import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Pub } from '@/types/Pub'
import PubModal from '@/components/PubModal'
import { useJsonLd, usePageMeta, pubToEventJsonLd } from '@/utils/seo'
import { Link } from 'react-router-dom'

// Mirror modal UI/logic
import { Beer, Users, MapPin, Clock, Spool, Share2} from 'lucide-react'
import { format, differenceInMinutes, isToday, isSameDay } from 'date-fns'
import { getOpenString, getPastDateString } from '@/utils/dateString'
import { StatusLabel } from '@/utils/capacity'
import { getCapacityInfo, getVisitorStatus } from '@/utils/pubUtils'

type Props = { asModal?: boolean }

function extractNumericId(idSlug?: string) {
  if (!idSlug) return NaN
  const first = idSlug.split('-')[0] || ''
  const n = Number(first)
  return Number.isFinite(n) ? n : NaN
}

function slugify(text: string = '') {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-åäö]/g, '')
}

function base64UrlEncode(obj: unknown) {
  const json = JSON.stringify(obj)
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
  const data = base64UrlEncode(pub)
  return `/event/synth?data=${data}`
}

function base64UrlDecode(s: string) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const json = decodeURIComponent(escape(atob(b64)))
  return JSON.parse(json)
}

function splitDescription(text: string, wordLimit: number) {
  const words = text.split(/\s+/)
  const needsTruncate = words.length > wordLimit
  const shown = words.slice(0, wordLimit).join(' ')
  const rest = words.slice(wordLimit).join(' ')
  return { shown, rest, needsTruncate }
}

export default function EventPage({ asModal }: Props) {
  const { idSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const search = new URLSearchParams(location.search)
  const dataParam = search.get('data') || ''

  const state = (location.state as { returnTo?: string; pub?: Pub } | null) || null
  const passedPub = state?.pub || null

  const numericId = extractNumericId(idSlug)
  const isNumericRoute = Number.isFinite(numericId)

  const [pub, setPub] = useState<Pub | null>(passedPub)
  const [error, setError] = useState<string | null>(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle') // NEW


  // Fallback for synthetic deep-links (no state)
  useEffect(() => {
    if (pub || isNumericRoute) return
    if (!dataParam) return
    try {
      const decoded = base64UrlDecode(dataParam)
      setPub(decoded as Pub)
    } catch {
      setError('Kunde inte läsa eventdata')
    }
  }, [pub, isNumericRoute, dataParam])

  // Fetch for numeric routes (real events) if we don't already have pub
  useEffect(() => {
    if (pub || !isNumericRoute) return
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pubs/${numericId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Pub = await res.json()
        if (mounted) setPub(data)
      } catch {
        setError('Kunde inte hämta event')
      }
    })()
    return () => {
      mounted = false
    }
  }, [pub, isNumericRoute, numericId])

  // Organizer names (host [& co-host]) for SEO + UI
  const organizerNames = pub
    ? [pub.display_name, pub.cohost_display_name].filter(Boolean).join(' & ')
    : ''

  // SEO
  const title = pub
    ? `${pub.title || 'Pub'} – ${pub.venue_name || pub.location || ''} | Pubquery`
    : 'Pub – Pubquery'
  const desc = pub
    ? `Detaljer för ${pub.title || 'studentpub'}, arrangör ${organizerNames || pub.display_name || ''} på ${pub.venue_name || pub.location || 'plats'}.`
    : 'Pubdetaljer.'
  usePageMeta(title, desc)
  const jsonld = useMemo(() => (pub ? pubToEventJsonLd(pub) : null), [pub])
  useJsonLd(
    `event-${idSlug || 'synthetic'}`,
    jsonld ? { '@context': 'https://schema.org', ...jsonld } : null
  )

  // Close handler (uses explicit returnTo when provided)
  const returnTo = state?.returnTo
  const handleClose = () => {
    if (returnTo) navigate(returnTo, { replace: true })
    else if (window.history.length > 1) navigate(-1)
    else navigate('/kth', { replace: true })
  }

  // Modal variant (unchanged)
  if (asModal) {
    if (error) return null
    if (!pub) return null
    return <PubModal pub={pub} open={true} onClose={handleClose} />
  }

  // Full page variant
  if (error) return <div className="p-4 text-red-300">{error}</div>
  if (!pub) return <div className="p-4 text-gray-300">Laddar…</div>

  // Normalize beer price like modal does
  if (typeof pub.beer_price === 'number' && pub.beer_price < 1) {
    pub.beer_price = undefined as unknown as number
  }

  // Opening logic — mirror modal exactly
  const openTime = new Date(pub.date)
  const now = new Date()
  const isOpen = now >= openTime
  const timeStr = format(openTime, 'HH:mm')
  const minutesUntilOpen = differenceInMinutes(openTime, now)
  const isSameCalDay = isSameDay(openTime, now)
  const { totalVisitors, externalPercentage, capacity } = getCapacityInfo(pub, isOpen)
  const visitorStatus = capacity !== null ? getVisitorStatus(capacity * 100) : null

  const timeLabel = isOpen
    ? isSameCalDay
      ? `Öppnade ${timeStr}`
      : getPastDateString(openTime, now) // e.g. “Öppnade 2 september”
    : isToday(openTime)
      ? `Öppnar om ${Math.floor(minutesUntilOpen / 60)}h ${minutesUntilOpen % 60}min`
      : getOpenString(openTime, now)

  const hasAnyPrice =
    typeof pub.beer_price === 'number' ||
    typeof pub.cider_price === 'number' ||
    typeof pub.drink_price === 'number'

  const wordLimit = 35
  const descriptionNode =
    pub.description && pub.description.trim().length
      ? (() => {
          const { shown, rest, needsTruncate } = splitDescription(pub.description, wordLimit)
          return needsTruncate ? (
            <>
              <span>{shown}</span>
              {!descExpanded && <span className="text-gray-500"> ...</span>}
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
        })()
      : null

  const priceBlock = (label: string, price?: number, desc?: string) => (
    <div className="bg-gray-100 rounded-lg py-4 flex-1 text-center min-w-[110px] border border-gray-200">
      <div className="text-xl font-semibold text-gray-900">{price ? `${price} kr` : '-'}</div>
      <div className="text-gray-600 text-sm">{label}</div>
      {desc && <div className="text-xs text-gray-500 mt-1">{desc}</div>}
    </div>
  )

  async function handleShare() {
    if (!pub) return
    const path = buildSharePath(pub)
    const url = `${window.location.origin}${path}`
    const title = pub.title || pub.venue_name || 'Studentpub'
    const organizerNames = [pub.display_name, pub.cohost_display_name]
      .filter(Boolean)
      .join(' & ')
    const text = `${organizerNames ? organizerNames + ' – ' : ''}${pub.venue_name || pub.location || ''}`

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 1500)
    } catch {
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
    <div className="min-h-screen p-4 flex justify-center">
      <div className="max-w-3xl w-full">
        {/* White card wrapper — mirrors modal styling */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full p-6 sm:p-8">
          {/* Overline (theme/title) */}
          {pub.title && (
            <div className="text-xs uppercase tracking-wide font-semibold mb-2 text-blue-700">
              {pub.title}
            </div>
          )}

          {/* Header row: logos, venue, organisers */}
          <div className="flex items-center gap-3 mb-3">
            {/* Dual-logo cluster (host + optional co-host) */}
            <div className="relative flex -space-x-2">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow border border-gray-200 overflow-hidden"
                aria-hidden="true"
              >
                {pub.logo_url ? (
                  <img
                    src={pub.logo_url}
                    alt="Värd organisation"
                    className="object-contain w-12 h-12"
                    draggable={false}
                  />
                ) : (
                  <Beer size={28} className="text-blue-600" />
                )}
              </div>

              {pub.cohost_logo_url && (
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow border border-gray-200 overflow-hidden"
                  aria-hidden="true"
                >
                  <img
                    src={pub.cohost_logo_url}
                    alt="Medvärd organisation"
                    className="object-contain w-12 h-12"
                    draggable={false}
                  />
                </div>
              )}
            </div>

            <div>
              <h1 className="font-bold text-2xl text-gray-900">{pub.venue_name || 'Studentpub'}</h1>
              {(pub.display_name || pub.cohost_display_name) && (
                <div className="text-gray-500 text-base -mt-0.5">
                  {organizerNames}
                </div>
              )}
            </div>
          </div>

          {/* Meta line: time, address, badges */}
          <div className="flex flex-col gap-1 mt-2 mb-4 text-sm">
            <div className="flex items-center text-gray-700">
              <span className="w-5 flex-shrink-0 flex items-center justify-center">
                <Clock size={16} />
              </span>
              <span className="ml-2">{timeLabel}</span>
            </div>

            {(pub.address || pub.maps_link) && (
              <div className="flex items-center text-gray-600">
                <span className="w-5 flex-shrink-0 flex items-center justify-center">
                  <MapPin size={16} />
                </span>
                {pub.maps_link ? (
                  <a
                    className="ml-2 underline"
                    href={pub.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pub.address || pub.venue_name || 'Öppna karta'}
                  </a>
                ) : (
                  <span className="ml-2">{pub.address}</span>
                )}
              </div>
            )}

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
          {descriptionNode && (
            <>
              <div className="font-bold mb-1 mt-2 text-gray-900">Om puben</div>
              <div className="text-gray-700 mb-4">{descriptionNode}</div>
            </>
          )}

          {/* Priser */}
          {hasAnyPrice && (
            <>
              <div className="font-bold mb-1 text-gray-900">Priser</div>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {priceBlock('Öl', pub.beer_price)}
                {priceBlock('Cider', pub.cider_price)}
                {priceBlock('Drink', pub.drink_price)}
              </div>
            </>
          )}

          {/* Kapacitet */}
          <div className="font-bold mb-2 text-gray-900">Kapacitet</div>
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

          {/* Actions */}
         <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {/* NEW: Share button */}
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

        <div className="w-full mt-6">
  <Link
    to="/"
    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#22282f] border border-[#313c47] shadow-sm hover:bg-[#232b32] focus:outline-none focus:ring-2 focus:ring-sky-400 transition text-gray-100"
  >
    <Beer size={18} className="text-sky-400" />
    <span className="text-medium font-medium">Till alla pubar</span>
  </Link>
</div>

      </div>
    </div>
  )
}
