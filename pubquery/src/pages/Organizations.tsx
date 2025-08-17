import { useEffect, useMemo, useState } from 'react'
import { Home, Search, MapPin, ExternalLink } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

type OrgRow = {
  organization_id: number
  organization_name: string 
  display_name: string
  logo_url?: string | null
  location: string
  venue_id?: number | null
  venue_name?: string | null
  maps_link?: string | null
  organization_description?: string | null
  organization_fb_page?: string | null
  beer_price?: number | null
  cider_price?: number | null
  drink_price?: number | null
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/organizations/withVenues`

export default function OrganizationsDirectory() {
  const [rows, setRows] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Modal state
  const [selected, setSelected] = useState<OrgRow | null>(null)

  const description =
    'Upptäck Stockholms studentpubar och klubbmästerierna / föreningarna som driver dem. Läs beskrivningar, se plats på kartan, se priser och följ dem på Facebook.'

  // --- helpers for head tags ---
  const ensureMeta = (selector: string, createEl: () => HTMLMetaElement): HTMLMetaElement => {
    const existing = document.head.querySelector(selector) as HTMLMetaElement | null
    if (existing) return existing
    const el = createEl()
    document.head.appendChild(el)
    return el
  }
  const setNamed = (name: string, content: string) => {
    const el = ensureMeta(`meta[name="${name}"]`, () => {
      const m = document.createElement('meta')
      m.setAttribute('name', name)
      return m
    })
    el.setAttribute('content', content)
  }
  const setProp = (prop: string, content: string) => {
    const el = ensureMeta(`meta[property="${prop}"]`, () => {
      const m = document.createElement('meta')
      m.setAttribute('property', prop)
      return m
    })
    el.setAttribute('content', content)
  }
  const ensureLink = (rel: string) => {
    let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
    if (!el) {
      el = document.createElement('link')
      el.rel = rel
      document.head.appendChild(el)
    }
    return el
  }

  function norm(s?: string | null) {
    return (s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '') // remove accents, keeps matching å/ä/ö with a/o
  }




  // --- base page meta ---
  useEffect(() => {
    document.title = 'Klubbmästerier & Föreningar Stockholm | Pubquery'

    // Standard description
    setNamed('description', description)

    // Open Graph
    setProp('og:title', 'Klubbmästerier & Föreningar | Pubquery')
    setProp('og:description', description)
    setProp('og:type', 'website')
    setProp('og:image', 'https://pubquery-images.fra1.cdn.digitaloceanspaces.com/socials/ogImage.png')
    setProp('og:image:alt', 'Pubquery föreningar och publokaler')
    setProp('og:locale', 'sv_SE')

    // Twitter Card
    setNamed('twitter:card', 'summary_large_image')
    setNamed('twitter:title', 'Klubbmästerier & Föreningar | Pubquery')
    setNamed('twitter:description', description)
    setNamed('twitter:image', 'https://pubquery-images.fra1.cdn.digitaloceanspaces.com/socials/ogImage.png')

    // Canonical for the list page
    const canonical = ensureLink('canonical')
    canonical.href = `${location.origin}/organizations`
  }, [description])

  // --- fetch data ---
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: OrgRow[] = await res.json()
        if (mounted) {
          setRows(data)
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

  // --- deep link handling ---
  const navigate = useNavigate()
  const { slug } = useParams() // e.g., "23-qmisk---in-sektionens-klubbmästeri"

  useEffect(() => {
    if (!rows.length || !slug) return
    const clean = decodeURIComponent(slug)
    const id = Number((clean.split('-')[0] || '').trim())
    if (Number.isNaN(id)) return
    const found = rows.find(r => r.organization_id === id)
    if (found) setSelected(found)
    // If not found, keep list state; you could navigate('/organizations') if you want.
  }, [rows, slug])

  const handleClose = () => {
    setSelected(null)
    navigate('/organizations', { replace: false })
  }

  // --- SEO: ItemList JSON-LD for the directory ---
  useEffect(() => {
    if (!rows.length) return
    const itemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Studentföreningar och klubbmästerier i Stockholm',
      itemListElement: rows.map((o, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
       url: `${location.origin}/org/${o.organization_id}-${slugify(o.display_name)}-${slugify(o.venue_name)}`,
        name: o.display_name
      }))
    }
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.text = JSON.stringify(itemList)
    document.head.appendChild(el)
    return () => {
      document.head.removeChild(el)
    }
  }, [rows])

  // --- SEO: when a modal is open from /org/:slug, update canonical + OG title/image ---
  useEffect(() => {
    if (!selected) return
    const slugPart = `${selected.organization_id}-${slugify(selected.display_name)}-${slugify(selected.venue_name)}`
    const canonical = ensureLink('canonical')
    canonical.href = `${location.origin}/org/${slugPart}`

    setProp('og:title', selected.display_name || 'Förening')
    if (selected.logo_url) {
      setProp('og:image', selected.logo_url)
    }
    // Optional: set twitter:title/image similarly if you want parity
  }, [selected])

  function slugify(text?: string | null) {
    return (text || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')          // spaces → hyphens
      .replace(/[^a-z0-9\-åäö]/g, '') // remove weird chars, keep åäö
  }

  // --- filtering & grouping ---
  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = norm(query)

    return rows.filter(r => {
      const org  = norm(r.display_name)
      const venue = norm(r.venue_name)
      const loc = norm(r.location)
      return org.includes(q) || venue.includes(q) || loc.includes(q)
    })
  }, [rows, query])


  // group: location -> venue -> organizations[]
  const grouped = useMemo(() => {
    const byLocation = new Map<string, Map<string, OrgRow[]>>()
    for (const r of filtered) {
      const loc = r.location || 'Övrigt'
      const venue = r.venue_name || 'Okänd lokal'
      if (!byLocation.has(loc)) byLocation.set(loc, new Map())
      const venueMap = byLocation.get(loc)!
      if (!venueMap.has(venue)) venueMap.set(venue, [])
      venueMap.get(venue)!.push(r)
    }

    const sorted: Array<[string, Array<[string, OrgRow[]]>]> = Array.from(byLocation.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'sv'))
      .map(([loc, venueMap]) => {
        const venues = Array.from(venueMap.entries())
          .sort(([a], [b]) => a.localeCompare(b, 'sv'))
          .map(
            ([venue, orgs]) =>
              [
                venue,
                orgs.sort((a, b) =>
                  (a.display_name ?? '').localeCompare(b.display_name ?? '', 'sv')
                )
              ] as [string, OrgRow[]]
          )
        return [loc, venues] as [string, Array<[string, OrgRow[]]>]
      })
    return sorted
  }, [filtered])

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <Header />
          <div className="mt-4 text-gray-300">Laddar föreningar…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <Header />
          <div className="mt-4 text-red-300">Kunde inte hämta data: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <Header />

        <p className="mt-2 text-gray-300 text-sm sm:text-base max-w-3xl">
          Här kan du läsa mer om de olika studentpubarna i Stockholm och föreningarna som driver dem.
        </p>

        {/* Search */}
        <div className="mt-4 mb-6">
          <div className="flex items-center gap-2 bg-[#22282f] border border-[#313c47] rounded-xl px-3 py-2">
            <Search size={18} className="text-sky-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök förening eller lokal…"
              className="bg-transparent text-gray-100 placeholder:text-gray-400 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Groups (semantic headings + lists) */}
        <div className="space-y-10">
          {grouped.length === 0 ? (
            <div className="text-gray-400">Inga föreningar hittades.</div>
          ) : (
            grouped.map(([location, venues]) => (
              <section key={location} aria-labelledby={`loc-${location}`}>
                <h2 id={`loc-${location}`} className="text-2xl font-bold text-white">
                  {location}
                </h2>

                <div className="space-y-6 mt-4">
                  {venues.map(([venueName, orgs]) => (
                    <section
                      key={`${location}-${venueName}`}
                      aria-labelledby={`venue-${location}-${venueName}`}
                      className="bg-[#22282f] border border-[#313c47] rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 id={`venue-${location}-${venueName}`} className="text-lg font-semibold text-white">
                          {venueName}
                        </h3>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{orgs.length} st</span>

                          {venueName && venueName !== 'Okänd lokal' && (
                            <a
                              href={
                                orgs[0]?.maps_link ??
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName)}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#34A853] text-white font-medium shadow hover:bg-green-600 transition"
                              aria-label={`Öppna ${venueName} på Google Maps`}
                            >
                              <MapPin size={14} className="text-white" />
                              Visa på karta
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Use a list for orgs */}
                      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" role="list">
                        {orgs.map((o) => {
                          const href = `/org/${o.organization_id}-${slugify(o.display_name)}-${slugify(o.venue_name)}`
                          return (
                            <li key={`${o.organization_id}-${o.venue_id ?? 'nv'}`}>
                              <OrgChip
                                name={o.display_name}
                                logoUrl={o.logo_url ?? undefined}
                                onClick={() => {
                                  setSelected(o)
                                  // push a shareable URL without leaving the page
                                  window.history.pushState({}, '', href)
                                }}
                                href={href}
                              />
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <OrganizationModal
          org={selected}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center justify-between" role="banner">
      <h1 className="text-xl sm:text-2xl font-bold text-white">
        Klubbmästerier & Föreningar
      </h1>
      <a
        href="/"
        className="ml-2 px-3 py-1.5 rounded-lg bg-sky-900/70 hover:bg-sky-800 text-white text-base font-semibold transition flex items-center gap-2 shadow"
      >
        <Home size={18} /> Hem
      </a>
    </header>
  )
}

function OrgChip({
  name,
  logoUrl,
  onClick,
  href,
}: {
  name: string
  logoUrl?: string
  onClick: () => void
  href: string
}) {
  const initials = name
    ? name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
    : '—'

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      className="group flex items-center gap-3 p-3 rounded-xl bg-[#232b32] border border-[#2e3943] hover:bg-[#2a333c] transition w-full text-left focus:outline-none focus:ring-2 focus:ring-sky-500"
      aria-label={`Öppna information för ${name}`}
    >
      <div
        className="flex-shrink-0 h-10 w-10 rounded-full bg-white shadow flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logotyp`}
            loading="lazy"
            width="40"
            height="40"
            className="object-contain w-full h-full"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <span className="text-sky-900 text-sm font-bold">{initials}</span>
        )}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-semibold text-white break-words group-hover:underline">
          {name}
        </div>
        <div className="text-xs text-gray-400">Klicka för mer info</div>
      </div>
    </a>
  )
}

function OrganizationModal({
  org,
  onClose,
}: {
  org: OrgRow
  onClose: () => void
}) {
  const fb = org.organization_fb_page?.trim() || ''
  const fbHref = fb && /^https?:\/\//i.test(fb) ? fb : fb ? `https://facebook.com/${fb}` : null
  const fmt = (n?: number | null) => (n == null ? null : `${Math.round(n)} kr`)

  // close on ESC / backdrop
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      {/* dialog */}
      <div className="relative z-10 w-full sm:max-w-lg bg-[#1f252a] border border-[#2f3a45] rounded-t-2xl sm:rounded-2xl p-5 shadow-xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
    <h4 className="text-lg font-semibold text-white">
      {org.display_name}
    </h4>

    {/* Show official name if different */}
    {org.organization_name &&
        (
        <div className="mt-0.5 text-xs text-gray-400">
          <span className="font-medium text-gray-300">{org.organization_name}</span>
        </div>
      )}
  </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-300 hover:bg-white/10"
            aria-label="Stäng"
          >
            Stäng
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <div className="text-sm text-gray-300 whitespace-pre-wrap break-words">
            {org.organization_description?.trim()
              ? org.organization_description
              : 'Ingen beskrivning angiven.'}
          </div>

          {/* Standardpriser */}
{(org.beer_price != null || org.cider_price != null || org.drink_price != null) && (
  <div className="pt-2">
    <h5 className="text-sm font-semibold text-white mb-2">Standardpriser</h5>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {org.beer_price != null && (
        <div className="rounded-lg border border-[#2f3a45] bg-[#232a2f] px-3 py-2">
          <div className="text-xs text-gray-400">Öl</div>
          <div className="text-sm text-gray-100 font-medium">{fmt(org.beer_price)}</div>
        </div>
      )}
      {org.cider_price != null && (
        <div className="rounded-lg border border-[#2f3a45] bg-[#232a2f] px-3 py-2">
          <div className="text-xs text-gray-400">Cider</div>
          <div className="text-sm text-gray-100 font-medium">{fmt(org.cider_price)}</div>
        </div>
      )}
      {org.drink_price != null && (
        <div className="rounded-lg border border-[#2f3a45] bg-[#232a2f] px-3 py-2">
          <div className="text-xs text-gray-400">Drink</div>
          <div className="text-sm text-gray-100 font-medium">{fmt(org.drink_price)}</div>
        </div>
      )}
    </div>
  </div>
)}


          <div className="pt-2 flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>
    </div>
  )
}
