import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Home, MapPin, ExternalLink, Calendar, ArrowLeft, Award } from 'lucide-react'
import { ensureLink, setProp, setNamed } from '@/utils/seo'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

type Organization = {
  organization_id: number
  organization_name: string
  display_name: string
  logo_url?: string
  location: string
  venue_name?: string
  maps_link?: string
  organization_description?: string
  organization_fb_page?: string
  beer_price?: number
  cider_price?: number
  drink_price?: number
}

type Event = {
  event_id: number
  organization_id: number
  title: string
  date: string
  venue_name?: string
  description?: string
  fb_link?: string
  patches?: boolean
  has_patches?: boolean | number
}

type Dinner = {
  id: number
  organization_id: number
  title: string
  date: string
  signup_date?: string
  description?: string
  signup_link?: string
  event_link?: string
  venue_name?: string
  price_without_alcohol?: number
  price_with_alcohol?: number
  has_patches?: boolean | number
}

type Patch = {
  id: number
  organization_id: number
  name: string
  description?: string
  price?: number
  image_url?: string
  temporarily_sold_out: boolean
  discontinued: boolean
}

const API_BASE = import.meta.env.VITE_API_BASE_URL
const PAST_EVENTS_PAGE_SIZE = 12

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-åäö]/g, '')
}

function getEventRoute(event: Event) {
  return `/event/${event.event_id}-${slugify(event.title)}`
}

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [upcomingDinners, setUpcomingDinners] = useState<Dinner[]>([])
  const [historicEvents, setHistoricEvents] = useState<Event[]>([])
  const [pastEventsVisibleCount, setPastEventsVisibleCount] = useState(PAST_EVENTS_PAGE_SIZE)
  const [patches, setPatches] = useState<Patch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orgId = id ? Number(id.split('-')[0]) : null

  useEffect(() => {
    if (!orgId) {
      setError('Invalid organization ID')
      setLoading(false)
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/organizations/detail/${orgId}`)

        if (!response.ok) throw new Error('Failed to load organization')

        const payload: {
          organization: Organization
          upcomingEvents: Event[]
          pastEvents: Event[]
          upcomingDinners: Dinner[]
          patches: Patch[]
        } = await response.json()

        if (mounted) {
          setOrganization(payload.organization)
          setUpcomingEvents(payload.upcomingEvents || [])
          setUpcomingDinners(payload.upcomingDinners || [])
          setHistoricEvents(payload.pastEvents || [])
          setPatches(payload.patches || [])
          setLoading(false)
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load organization')
          setLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [orgId])

  useEffect(() => {
    if (!organization) return

    const title = `${organization.display_name} | Pubquery`
    document.title = title

    const description =
      organization.organization_description?.substring(0, 160) ||
      `Information om ${organization.display_name} - evenemang, patches och mer.`

    setNamed('description', description)

    setProp('og:title', title)
    setProp('og:description', description)
    setProp('og:type', 'profile')
    if (organization.logo_url) {
      setProp('og:image', organization.logo_url)
    }
    setProp('og:locale', 'sv_SE')

    setNamed('twitter:card', 'summary')
    setNamed('twitter:title', title)
    setNamed('twitter:description', description)
    if (organization.logo_url) {
      setNamed('twitter:image', organization.logo_url)
    }

    const canonical = ensureLink('canonical')
    canonical.href = `${location.origin}/organization/${id}`
  }, [organization, id])

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mt-4 text-gray-300">Laddar…</div>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/organizations')}
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 mb-4"
          >
            <ArrowLeft size={18} />
            Tillbaka till föreningar
          </button>
          <div className="mt-4 text-red-300">{error || 'Förening hittades inte'}</div>
        </div>
      </div>
    )
  }

  const fb = organization.organization_fb_page?.trim() || ''
  const fbHref = fb && /^https?:\/\//i.test(fb) ? fb : fb ? `https://facebook.com/${fb}` : null
  const fmt = (n?: number | null) => (n == null ? null : `${Math.round(n)} kr`)
  const visiblePastEvents = historicEvents.slice(0, pastEventsVisibleCount)
  const hasMorePastEvents = historicEvents.length > pastEventsVisibleCount

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/organizations')}
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300"
          >
            <ArrowLeft size={18} />
            Tillbaka
          </button>
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg bg-sky-900/70 hover:bg-sky-800 text-white text-base font-semibold transition flex items-center gap-2 shadow"
          >
            <Home size={18} /> Hem
          </a>
        </div>

        <div className="bg-[#22282f] border border-[#313c47] rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-6 mb-4">
            {organization.logo_url && (
              <img
                src={organization.logo_url}
                alt={organization.display_name}
                className="w-24 h-24 rounded-full object-contain bg-white p-2"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{organization.display_name}</h1>
              {organization.organization_name && organization.organization_name !== organization.display_name && (
                <p className="text-gray-400 mb-2">{organization.organization_name}</p>
              )}
              {organization.venue_name && (
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                  <MapPin size={18} className="text-sky-400" />
                  <span>{organization.venue_name}</span>
                  {organization.location && <span className="text-gray-500">• {organization.location}</span>}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {fbHref && (
                  <a
                    href={fbHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] text-white px-3 py-2 text-sm font-medium hover:opacity-90 transition"
                  >
                    <ExternalLink size={16} />
                    Facebook
                  </a>
                )}
                {organization.maps_link && (
                  <a
                    href={organization.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#34A853] text-white px-3 py-2 text-sm font-medium hover:opacity-90 transition"
                  >
                    <MapPin size={16} />
                    Karta
                  </a>
                )}
              </div>
            </div>
          </div>

          {organization.organization_description && (
            <div className="mt-4 pt-4 border-t border-[#313c47]">
              <h2 className="text-lg font-semibold text-white mb-2">Om föreningen</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{organization.organization_description}</p>
            </div>
          )}

          {(organization.beer_price != null ||
            organization.cider_price != null ||
            organization.drink_price != null) && (
            <div className="mt-4 pt-4 border-t border-[#313c47]">
              <h2 className="text-lg font-semibold text-white mb-3">Standardpriser</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {organization.beer_price != null && (
                  <div className="rounded-lg border border-[#2f3a45] bg-[#232a2f] px-4 py-3">
                    <div className="text-sm text-gray-400">Öl</div>
                    <div className="text-lg text-gray-100 font-semibold">{fmt(organization.beer_price)}</div>
                  </div>
                )}
                {organization.cider_price != null && (
                  <div className="rounded-lg border border-[#2f3a45] bg-[#232a2f] px-4 py-3">
                    <div className="text-sm text-gray-400">Cider</div>
                    <div className="text-lg text-gray-100 font-semibold">{fmt(organization.cider_price)}</div>
                  </div>
                )}
                {organization.drink_price != null && (
                  <div className="rounded-lg border border-[#2f3a45] bg-[#232a2f] px-4 py-3">
                    <div className="text-sm text-gray-400">Drink</div>
                    <div className="text-lg text-gray-100 font-semibold">{fmt(organization.drink_price)}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {patches.length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Award size={24} className="text-sky-400" />
              Märken
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {patches.map((patch) => (
                <div
                  key={patch.id}
                  className="bg-[#22282f] border border-[#313c47] rounded-2xl overflow-hidden hover:border-sky-500 transition"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#1a1f24]">
                    {patch.image_url ? (
                      <img
                        src={patch.image_url}
                        alt={patch.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-600">
                        <Award className="w-12 h-12" />
                      </div>
                    )}
                    {patch.temporarily_sold_out && (
                      <div className="absolute top-2 right-2">
                        <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
                          Slutsåld
                        </span>
                      </div>
                    )}
                    {patch.discontinued && (
                      <div className="absolute top-2 left-2">
                        <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-semibold text-white shadow">
                          Utgången
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm mb-1 truncate" title={patch.name}>
                      {patch.name}
                    </h3>
                    {patch.price !== null && patch.price !== undefined && (
                      <p className="text-sm font-semibold text-sky-400">{patch.price} kr</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(upcomingEvents.length > 0 || upcomingDinners.length > 0) && (
          <section className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Kommande evenemang</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.event_id}
                  to={getEventRoute(event)}
                  className="bg-[#22282f] border border-[#313c47] rounded-2xl p-4 hover:border-sky-500 transition"
                >
                  <h3 className="font-semibold text-white text-lg mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                    <Calendar size={16} className="text-sky-400" />
                    {format(new Date(event.date), 'PPP', { locale: sv })}
                  </div>
                  {event.venue_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <MapPin size={16} />
                      {event.venue_name}
                    </div>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">{event.description}</p>
                  )}
                  {event.patches && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-900/50 px-2 py-1 text-xs font-medium text-sky-300">
                        <Award size={12} />
                        Säljer märken
                      </span>
                    </div>
                  )}
                  {Boolean(event.has_patches) && !event.patches && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-200">
                        <Award size={12} />
                        Event med patch-länkar
                      </span>
                    </div>
                  )}
                </Link>
              ))}
              {upcomingDinners.map((dinner) => (
                <div
                  key={dinner.id}
                  className="bg-[#22282f] border border-[#313c47] rounded-2xl p-4 hover:border-sky-500 transition"
                >
                  <h3 className="font-semibold text-white text-lg mb-2">{dinner.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                    <Calendar size={16} className="text-sky-400" />
                    {format(new Date(dinner.date), 'PPP', { locale: sv })}
                  </div>
                  {dinner.venue_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <MapPin size={16} />
                      {dinner.venue_name}
                    </div>
                  )}
                  {dinner.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{dinner.description}</p>
                  )}
                  {Boolean(dinner.has_patches) && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-200">
                        <Award size={12} />
                        Middag med patch-länkar
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {historicEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Tidigare evenemang</h2>
            <div className="bg-[#22282f] border border-[#313c47] rounded-2xl overflow-hidden">
              <div className="divide-y divide-[#313c47]">
                {visiblePastEvents.map((event) => (
                  <Link
                    key={event.event_id}
                    to={getEventRoute(event)}
                    className="block p-4 hover:bg-[#2a333c] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                        {event.venue_name && (
                          <p className="text-sm text-gray-400">{event.venue_name}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 whitespace-nowrap">
                        {format(new Date(event.date), 'PP', { locale: sv })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            {hasMorePastEvents && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPastEventsVisibleCount((prev) => prev + PAST_EVENTS_PAGE_SIZE)}
                  className="rounded-lg border border-[#3f4b57] bg-[#2a333c] px-4 py-2 text-sm font-semibold text-gray-200 hover:border-sky-500 hover:text-white transition"
                >
                  Visa fler tidigare evenemang
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
