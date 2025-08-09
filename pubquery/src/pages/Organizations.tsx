import { useEffect, useMemo, useState } from 'react'
import { Home, Search, MapPin, ExternalLink } from 'lucide-react'

type OrgRow = {
  organization_id: number
  organization_name: string
  logo_url?: string | null
  location: string
  venue_id?: number | null
  venue_name?: string | null
  maps_link?: string | null
  organization_description?: string | null
  organization_fb_page?: string | null
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
    "Upptäck Stockholms studentpubar och klubbmästerierna / föreningarna som driver dem. Läs beskrivningar, se plats på kartan, se priser och följ dem på Facebook.";

   useEffect(() => {
    // Title
    document.title = "Klubbmästerier & Föreningar Stockholm | Pubquery";

    const ensureMeta = (
      selector: string,
      createEl: () => HTMLMetaElement
    ): HTMLMetaElement => {
      const existing = document.head.querySelector(
        selector
      ) as HTMLMetaElement | null;
      if (existing) return existing;
      const el = createEl();
      document.head.appendChild(el);
      return el;
    };

    const setNamed = (name: string, content: string) => {
      const el = ensureMeta(`meta[name="${name}"]`, () => {
        const m = document.createElement("meta");
        m.setAttribute("name", name);
        return m;
      });
      el.setAttribute("content", content);
    };

    const setProp = (prop: string, content: string) => {
      const el = ensureMeta(`meta[property="${prop}"]`, () => {
        const m = document.createElement("meta");
        m.setAttribute("property", prop);
        return m;
      });
      el.setAttribute("content", content);
    };

    // Standard description
    setNamed("description", description);

    // Open Graph
    setProp("og:title", "Klubbmästerier & Föreningar | Pubquery");
    setProp("og:description", description);
    setProp("og:type", "website");
    setProp("og:image", "https://pubquery-images.fra1.cdn.digitaloceanspaces.com/socials/ogImage.png");
    setProp("og:image:alt", "Pubquery föreningar och publokaler");

    // Twitter Card 
    setNamed("twitter:card", "summary_large_image");
    setNamed("twitter:title", "Klubbmästerier & Föreningar | Pubquery");
    setNamed("twitter:description", description);
    setNamed("twitter:image", "https://pubquery-images.fra1.cdn.digitaloceanspaces.com/socials/ogImage.png");
  }, [description]);

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

  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter((r) => (r.organization_name ?? '').toLowerCase().includes(q))
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
                  (a.organization_name ?? '').localeCompare(b.organization_name ?? '', 'sv')
                ),
              ] as [string, OrgRow[]]
          )
        return [loc, venues] as [string, Array<[string, OrgRow[]]>]
      })
    return sorted
  }, [filtered])

  if (loading) {
    
    return (
      <div className="min-h-screen bg-[#161a1d] p-4">
        <div className="max-w-5xl mx-auto">
          <Header />
          <div className="mt-4 text-gray-300">Laddar föreningar…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#161a1d] p-4">
        <div className="max-w-5xl mx-auto">
          <Header />
          <div className="mt-4 text-red-300">Kunde inte hämta data: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#161a1d] p-4">
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
              placeholder="Sök förening…"
              className="bg-transparent text-gray-100 placeholder:text-gray-400 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Groups */}
        <div className="space-y-10">
          {grouped.length === 0 ? (
            <div className="text-gray-400">Inga föreningar hittades.</div>
          ) : (
            grouped.map(([location, venues]) => (
              <section key={location} className="space-y-4">
                <h2 className="text-2xl font-bold text-white">{location}</h2>

                <div className="space-y-6">
                  {venues.map(([venueName, orgs]) => (
                    <div
                      key={`${location}-${venueName}`}
                      className="bg-[#22282f] border border-[#313c47] rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">{venueName}</h3>

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

                      {/* Org chips */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {orgs.map((o) => (
                          <OrgChip
                            key={`${o.organization_id}-${o.venue_id ?? 'nv'}`}
                            name={o.organization_name}
                            logoUrl={o.logo_url ?? undefined}
                            onClick={() => setSelected(o)}
                          />
                        ))}
                      </div>
                    </div>
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
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xl sm:text-2xl font-bold text-white">Klubbmästerier & Föreningar</div>
      <a
        href="/"
        className="ml-2 px-3 py-1.5 rounded-lg bg-sky-900/70 hover:bg-sky-800 text-white text-base font-semibold transition flex items-center gap-2 shadow"
      >
        <Home size={18} /> Hem
      </a>
    </div>
  )
}

function OrgChip({
  name,
  logoUrl,
  onClick,
}: {
  name: string
  logoUrl?: string
  onClick: () => void
}) {
  const initials = name
    ? name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : '—'

  // Button semantics for a11y + keyboard
  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
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
            alt=""
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
    </button>
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
  const fbHref =
    fb && /^https?:\/\//i.test(fb) ? fb : fb ? `https://facebook.com/${fb}` : null

  // close on ESC / backdrop
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* dialog */}
      <div className="relative z-10 w-full sm:max-w-lg bg-[#1f252a] border border-[#2f3a45] rounded-t-2xl sm:rounded-2xl p-5 shadow-xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-lg font-semibold text-white">
            {org.organization_name}
          </h4>
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
