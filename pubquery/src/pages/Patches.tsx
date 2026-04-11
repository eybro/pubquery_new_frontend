import { useEffect, useMemo, useState } from 'react'
import { Home, Search, Calendar, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ensureLink, setProp, setNamed } from '@/utils/seo'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

type Patch = {
  id: number
  organization_id: number
  name: string
  description?: string
  price?: number
  image_url?: string
  auto_link_to_events: boolean
  temporarily_sold_out: boolean
  discontinued: boolean
  organization_name?: string
  organization_logo_url?: string
}

type EventWithPatches = {
  event_id: number
  organization_id: number
  title: string
  date: string
  venue_name?: string
  location?: string
  maps_link?: string
  logo_url?: string
  display_name?: string
  patches?: boolean
}

type DinnerWithPatches = {
  id: number
  title: string
  date: string
  organization_id: number
  venue_name?: string
  venue_maps_link?: string
  event_link?: string
  logo_url?: string
  display_name?: string
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/patches`

function getPatchImageSrc(imageUrl?: string) {
  if (!imageUrl) return undefined
  return `${API_URL}/image-proxy?url=${encodeURIComponent(imageUrl)}`
}

export default function PatchesPage() {
  const [patches, setPatches] = useState<Patch[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithPatches[]>([])
  const [upcomingDinners, setUpcomingDinners] = useState<DinnerWithPatches[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventWithPatches | null>(null)
  const [selectedDinner, setSelectedDinner] = useState<DinnerWithPatches | null>(null)
  const [selectedPatch, setSelectedPatch] = useState<Patch | null>(null)
  const [eventPatchesById, setEventPatchesById] = useState<Record<number, Patch[]>>({})
  const [dinnerPatchesById, setDinnerPatchesById] = useState<Record<number, Patch[]>>({})
  const [upcomingEventsByPatchId, setUpcomingEventsByPatchId] = useState<
    Record<number, EventWithPatches[]>
  >({})
  const [loadingEventId, setLoadingEventId] = useState<number | null>(null)
  const [loadingDinnerId, setLoadingDinnerId] = useState<number | null>(null)
  const [loadingPatchId, setLoadingPatchId] = useState<number | null>(null)

  const description =
    'Bläddra bland alla tygmärken (patches) från Stockholms studentföreningar. Se vilka evenemang som säljer märken och hitta dina favoriter.'

  useEffect(() => {
    document.title = 'Märken | Pubquery'

    setNamed('description', description)

    setProp('og:title', 'Märken | Pubquery')
    setProp('og:description', description)
    setProp('og:type', 'website')
    setProp(
      'og:image',
      'https://pubquery-images.fra1.cdn.digitaloceanspaces.com/socials/ogImage.png'
    )
    setProp('og:image:alt', 'Pubquery patches')
    setProp('og:locale', 'sv_SE')

    setNamed('twitter:card', 'summary_large_image')
    setNamed('twitter:title', 'Märken | Pubquery')
    setNamed('twitter:description', description)
    setNamed(
      'twitter:image',
      'https://pubquery-images.fra1.cdn.digitaloceanspaces.com/socials/ogImage.png'
    )

    const canonical = ensureLink('canonical')
    canonical.href = `${location.origin}/patches`
  }, [description])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [patchesRes, eventsRes] = await Promise.all([
          fetch(`${API_URL}/all`),
          fetch(`${API_URL}/upcoming-events`),
        ])

        if (!patchesRes.ok) throw new Error(`HTTP ${patchesRes.status}`)
        if (!eventsRes.ok) throw new Error(`HTTP ${eventsRes.status}`)

        const patchesData: Patch[] = await patchesRes.json()
        const eventsData: { events: EventWithPatches[]; dinners: DinnerWithPatches[] } =
          await eventsRes.json()

        if (mounted) {
          setPatches(patchesData)
          setUpcomingEvents(eventsData.events || [])
          setUpcomingDinners(eventsData.dinners || [])
          setLoading(false)
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Något gick fel'
        setError(message)
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const organizations = useMemo(() => {
    const orgMap = new Map<number, { name: string; logo_url?: string }>()
    patches.forEach((p) => {
      if (!orgMap.has(p.organization_id) && p.organization_name) {
        orgMap.set(p.organization_id, {
          name: p.organization_name,
          logo_url: p.organization_logo_url,
        })
      }
    })
    return Array.from(orgMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  }, [patches])

  const filteredPatches = useMemo(() => {
    let result = patches

    if (selectedOrg !== null) {
      result = result.filter((p) => p.organization_id === selectedOrg)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.organization_name?.toLowerCase().includes(q)
      )
    }

    return result
  }, [patches, selectedOrg, searchQuery])

  const getEventRoute = (event: EventWithPatches) => `/event/${event.event_id}-${slugify(event.title)}`

  const openEventDetails = async (event: EventWithPatches) => {
    setSelectedEvent(event)
    if (eventPatchesById[event.event_id]) return

    try {
      setLoadingEventId(event.event_id)
      const res = await fetch(`${API_URL}/event/${event.event_id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const patchRows: Patch[] = await res.json()
      setEventPatchesById((prev) => ({ ...prev, [event.event_id]: patchRows }))
    } catch {
      setEventPatchesById((prev) => ({ ...prev, [event.event_id]: [] }))
    } finally {
      setLoadingEventId(null)
    }
  }

  const openPatchDetails = async (patch: Patch) => {
    setSelectedPatch(patch)
    if (upcomingEventsByPatchId[patch.id]) return

    try {
      setLoadingPatchId(patch.id)
      const res = await fetch(`${API_URL}/patch/${patch.id}/upcoming-events`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const events: EventWithPatches[] = await res.json()
      setUpcomingEventsByPatchId((prev) => ({ ...prev, [patch.id]: events }))
    } catch {
      setUpcomingEventsByPatchId((prev) => ({ ...prev, [patch.id]: [] }))
    } finally {
      setLoadingPatchId(null)
    }
  }

  const openDinnerDetails = async (dinner: DinnerWithPatches) => {
    setSelectedDinner(dinner)
    if (dinnerPatchesById[dinner.id]) return

    try {
      setLoadingDinnerId(dinner.id)
      const res = await fetch(`${API_URL}/dinner/${dinner.id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const patchRows: Patch[] = await res.json()
      setDinnerPatchesById((prev) => ({ ...prev, [dinner.id]: patchRows }))
    } catch {
      setDinnerPatchesById((prev) => ({ ...prev, [dinner.id]: [] }))
    } finally {
      setLoadingDinnerId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <Header />
          <div className="mt-4 text-gray-300">Laddar märken…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <Header />
          <div className="mt-4 text-red-300">Kunde inte hämta data: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <Header />

        <p className="mt-2 text-gray-300 text-sm sm:text-base max-w-3xl">
          Utforska alla märken från Stockholms studentföreningar. Filtrera efter förening eller sök
          efter specifika märken.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1 flex items-center gap-2 bg-[#22282f] border border-[#313c47] rounded-xl px-3 py-2">
            <Search size={18} className="text-sky-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök märken…"
              className="bg-transparent text-gray-100 placeholder:text-gray-400 focus:outline-none w-full"
            />
          </div>

          <select
            value={selectedOrg ?? ''}
            onChange={(e) => setSelectedOrg(e.target.value ? Number(e.target.value) : null)}
            className="bg-[#22282f] border border-[#313c47] rounded-xl px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Alla föreningar</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {(upcomingEvents.length > 0 || upcomingDinners.length > 0) && (
          <section className="mt-8" aria-labelledby="upcoming-events-heading">
            <h2 id="upcoming-events-heading" className="text-2xl font-bold text-white mb-4">
              Kommande evenemang som säljer märken
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <button
                  key={`event-${event.event_id}`}
                  type="button"
                  onClick={() => openEventDetails(event)}
                  className="group block w-full text-left bg-[#22282f] border border-[#313c47] rounded-2xl p-4 hover:bg-[#2a333c] transition"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {event.logo_url && (
                      <img
                        src={event.logo_url}
                        alt={event.display_name || ''}
                        className="w-10 h-10 rounded-full object-contain bg-white"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:underline truncate">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-400">{event.display_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar size={16} className="text-sky-400" />
                    {format(new Date(event.date), 'PPP', { locale: sv })}
                  </div>
                  {event.venue_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <MapPin size={16} />
                      {event.venue_name}
                    </div>
                  )}
                </button>
              ))}
              {upcomingDinners.map((dinner) => (
                <button
                  key={`dinner-${dinner.id}`}
                  type="button"
                  onClick={() => openDinnerDetails(dinner)}
                  className="group block w-full text-left bg-[#22282f] border border-[#313c47] rounded-2xl p-4 hover:bg-[#2a333c] transition"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {dinner.logo_url && (
                      <img
                        src={dinner.logo_url}
                        alt={dinner.display_name || ''}
                        className="w-10 h-10 rounded-full object-contain bg-white"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:underline truncate">{dinner.title}</h3>
                      <p className="text-sm text-gray-400">{dinner.display_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar size={16} className="text-sky-400" />
                    {format(new Date(dinner.date), 'PPP', { locale: sv })}
                  </div>
                  {dinner.venue_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <MapPin size={16} />
                      {dinner.venue_name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8" aria-labelledby="patches-heading">
          <h2 id="patches-heading" className="text-2xl font-bold text-white mb-4">
            Alla märken
            {filteredPatches.length > 0 && (
              <span className="ml-2 text-lg font-normal text-gray-400">
                ({filteredPatches.length})
              </span>
            )}
          </h2>

          {filteredPatches.length === 0 ? (
            <div className="text-gray-400 text-center py-12">
              {searchQuery || selectedOrg
                ? 'Inga märken hittades med dessa filter.'
                : 'Inga märken tillgängliga ännu.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredPatches.map((patch) => (
                <div
                  key={patch.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPatchDetails(patch)}
                  onKeyDown={(e) => e.key === 'Enter' && openPatchDetails(patch)}
                  className="bg-[#22282f] border border-[#313c47] rounded-2xl overflow-hidden hover:border-sky-500 transition group"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#1a1f24]">
                    {patch.image_url ? (
                      <img
                        src={getPatchImageSrc(patch.image_url)}
                        alt={patch.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-600">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
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
                    {patch.organization_name && (
                      <p className="text-xs text-gray-400 mb-2 truncate">
                        {patch.organization_name}
                      </p>
                    )}
                    {patch.price !== null && patch.price !== undefined && (
                      <p className="text-sm font-semibold text-sky-400">{patch.price} kr</p>
                    )}
                    {patch.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {patch.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedEvent(null)}
            aria-label="Stäng"
          />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#313c47] bg-[#1f252a] p-5 text-white shadow-xl">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
              <button type="button" onClick={() => setSelectedEvent(null)} className="text-gray-300 hover:text-white">
                Stäng
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Följande märken säljs på detta event:</p>

            {loadingEventId === selectedEvent.event_id ? (
              <p className="text-sm text-gray-300">Laddar märken…</p>
            ) : (
              <div className="space-y-2">
                {(eventPatchesById[selectedEvent.event_id] || []).length === 0 ? (
                  <p className="text-sm text-gray-400">Inga länkade märken hittades för eventet.</p>
                ) : (
                  eventPatchesById[selectedEvent.event_id].map((patch) => (
                    <button
                      key={`event-patch-${selectedEvent.event_id}-${patch.id}`}
                      type="button"
                      onClick={() => openPatchDetails(patch)}
                      className="w-full rounded-lg border border-[#313c47] bg-[#232b32] px-3 py-2 text-left hover:border-sky-500"
                    >
                      <div className="text-sm font-semibold text-white">{patch.name}</div>
                      {patch.organization_name && <div className="text-xs text-gray-400">{patch.organization_name}</div>}
                    </button>
                  ))
                )}
              </div>
            )}

            <Link
              to={getEventRoute(selectedEvent)}
              className="mt-4 inline-flex rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              Öppna event-sida
            </Link>
          </div>
        </div>
      )}

      {selectedPatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedPatch(null)}
            aria-label="Stäng"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#313c47] bg-[#1f252a] p-5 text-white shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-bold">{selectedPatch.name}</h3>
              <button type="button" onClick={() => setSelectedPatch(null)} className="text-gray-300 hover:text-white">
                Stäng
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-xl border border-[#313c47] bg-[#151a1f]">
                {selectedPatch.image_url ? (
                  <img
                    src={getPatchImageSrc(selectedPatch.image_url)}
                    alt={selectedPatch.name}
                    className="h-[220px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[220px] items-center justify-center text-gray-500">Ingen bild</div>
                )}
              </div>

              <div>
                {selectedPatch.organization_name && (
                  <p className="text-sm text-gray-400 mb-2">{selectedPatch.organization_name}</p>
                )}
                {selectedPatch.price !== null && selectedPatch.price !== undefined && (
                  <p className="text-lg font-semibold text-sky-400 mb-2">{selectedPatch.price} kr</p>
                )}
                {selectedPatch.description && (
                  <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap">{selectedPatch.description}</p>
                )}

                <h4 className="text-sm font-semibold tracking-wide text-gray-400 mb-2">
                  Kommande event där märket säljs
                </h4>
                {loadingPatchId === selectedPatch.id ? (
                  <p className="text-sm text-gray-300">Laddar event…</p>
                ) : (
                  <div className="space-y-2">
                    {(upcomingEventsByPatchId[selectedPatch.id] || []).length === 0 ? (
                      <p className="text-sm text-gray-400">Inga kommande event länkade ännu.</p>
                    ) : (
                      upcomingEventsByPatchId[selectedPatch.id].map((event) => (
                        <Link
                          key={`patch-event-${selectedPatch.id}-${event.event_id}`}
                          to={getEventRoute(event)}
                          className="block rounded-lg border border-[#313c47] bg-[#232b32] px-3 py-2 hover:border-sky-500"
                        >
                          <div className="text-sm font-semibold text-white">{event.title}</div>
                          <div className="text-xs text-gray-400">
                            {format(new Date(event.date), 'PPP', { locale: sv })}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedDinner(null)}
            aria-label="Stäng"
          />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#313c47] bg-[#1f252a] p-5 text-white shadow-xl">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">{selectedDinner.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedDinner(null)}
                className="text-gray-300 hover:text-white"
              >
                Stäng
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Följande märken säljs på denna sittning:</p>

            {loadingDinnerId === selectedDinner.id ? (
              <p className="text-sm text-gray-300">Laddar märken…</p>
            ) : (
              <div className="space-y-2">
                {(dinnerPatchesById[selectedDinner.id] || []).length === 0 ? (
                  <p className="text-sm text-gray-400">Inga länkade märken hittades för sittningen.</p>
                ) : (
                  dinnerPatchesById[selectedDinner.id].map((patch) => (
                    <button
                      key={`dinner-patch-${selectedDinner.id}-${patch.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedDinner(null)
                        void openPatchDetails(patch)
                      }}
                      className="w-full rounded-lg border border-[#313c47] bg-[#232b32] px-3 py-2 text-left hover:border-sky-500"
                    >
                      <div className="text-sm font-semibold text-white">{patch.name}</div>
                      {patch.organization_name && (
                        <div className="text-xs text-gray-400">{patch.organization_name}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedDinner.event_link && (
              <a
                href={selectedDinner.event_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
              >
                Öppna sittningens eventsida
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center justify-between" role="banner">
      <h1 className="text-xl sm:text-2xl font-bold text-white">Märken</h1>
      <a
        href="/"
        className="ml-2 px-3 py-1.5 rounded-lg bg-sky-900/70 hover:bg-sky-800 text-white text-base font-semibold transition flex items-center gap-2 shadow"
      >
        <Home size={18} /> Hem
      </a>
    </header>
  )
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-åäö]/g, '')
}
