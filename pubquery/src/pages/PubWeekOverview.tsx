import { useEffect, useMemo, useState } from 'react'
import { format, addDays, subDays, startOfWeek } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Beer, Users, Calendar, ArrowLeft, ArrowRight, Home } from 'lucide-react'
import PubCard from '../components/PubCard'
import type { Pub } from '@/types/Pub'
import { parseISO } from 'date-fns'
import { prepareKthPubsWithBrazilia } from '@/utils/kthBrazilia'
import { useJsonLd, usePageMeta, pubToEventJsonLd } from '@/utils/seo'
import { useLocation, useNavigate } from 'react-router-dom'
import { createPubLinkProps } from '@/utils/eventLinks'

function isWeekdayISO(iso: string) {
  const d = iso.length > 10 ? new Date(iso) : parseISO(iso)
  const day = d.getDay() // 0=Sun..6=Sat
  return day >= 1 && day <= 5
}

// --- helper: dedupe by event_id (fallback to name+date if needed)
function dedupeByEventId(pubs: Pub[]): Pub[] {
  const seen = new Set<number>()
  return pubs.filter((p) => {
    if (seen.has(Number(p.event_id))) return false
    seen.add(Number(p.event_id))
    return true
  })
}




type WeekOverviewDay = {
  date: string
  weekdayShort: string
  isToday: boolean
  pubs: Pub[]
  openCount?: number
  cheapestBeer?: Array<{ price: number; name: string }> | null
}

type WeekOverview = {
  occupancy: number
  openTodayCount: number
  totalPubs: number
  days: WeekOverviewDay[]
}

const weekdayMap = {
  mon: 'Mån',
  tue: 'Tis',
  wed: 'Ons',
  thu: 'Tor',
  fri: 'Fre',
  sat: 'Lör',
  sun: 'Sön',
} as const
const weekdayFullMap = {
  mon: 'Måndag',
  tue: 'Tisdag',
  wed: 'Onsdag',
  thu: 'Torsdag',
  fri: 'Fredag',
  sat: 'Lördag',
  sun: 'Söndag',
} as const

function Tooltip({ children, tooltip }: { children: React.ReactNode; tooltip: string }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      tabIndex={0}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && tooltip && (
        <span className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 min-w-[170px] max-w-xs bg-sky-900/90 text-sky-100 text-sm rounded-xl px-4 py-3 shadow-xl pointer-events-none whitespace-normal break-words border border-sky-600 font-medium">
          <div className="font-semibold mb-1">Fler pubar med samma pris:</div>
          <div>{tooltip}</div>
        </span>
      )}
    </span>
  )
}

// --- helpers for SEO URL + canonical
function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}
function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

export default function PubWeekOverview({
  location,
  location_name,
}: {
  location: string
  location_name: string
}) {
  const navigate = useNavigate()
  const locationObj = useLocation()

  // Read deep-link params once
  const initialUrl = new URL(window.location.href)
  const weekParam = initialUrl.searchParams.get('week')
  const dayParam = initialUrl.searchParams.get('day')

  const [selectedWeek, setSelectedWeek] = useState(
    weekParam
      ? startOfWeek(new Date(weekParam), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [weekOverview, setWeekOverview] = useState<WeekOverview | null>(null)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    if (dayParam && weekParam) return 0 // will adjust after data loads
    const today = new Date()
    return (today.getDay() + 6) % 7
  })


  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const body = { location, week: format(selectedWeek, 'yyyy-MM-dd') }
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pubs/weekOverview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        setWeekOverview(await res.json())
      } catch (error) {
        console.error('Failed to fetch week overview data:', error)
        setWeekOverview(null)
      }
    }
    fetchData()
  }, [location, selectedWeek])

  // If deep-linked with ?day=YYYY-MM-DD, select that day once data is in
  useEffect(() => {
    if (!weekOverview || !dayParam) return
    const idx = weekOverview.days.findIndex((d) => d.date.slice(0, 10) === dayParam)
    if (idx >= 0) setSelectedDayIdx(idx)
  }, [weekOverview, dayParam])

  // Handlers that also sync URL
  const handlePrevWeek = () => {
    const next = subDays(selectedWeek, 7)
    setSelectedWeek(next)
    const url = new URL(window.location.href)
    url.searchParams.set('week', ymd(next))
    const currentDay = weekOverview?.days?.[selectedDayIdx]?.date?.slice(0, 10)
    if (currentDay) url.searchParams.set('day', currentDay)
    window.history.pushState({}, '', url.toString())
  }
  const handleNextWeek = () => {
    const next = addDays(selectedWeek, 7)
    setSelectedWeek(next)
    const url = new URL(window.location.href)
    url.searchParams.set('week', ymd(next))
    const currentDay = weekOverview?.days?.[selectedDayIdx]?.date?.slice(0, 10)
    if (currentDay) url.searchParams.set('day', currentDay)
    window.history.pushState({}, '', url.toString())
  }
  const handleThisWeek = () => {
    const next = startOfWeek(new Date(), { weekStartsOn: 1 })
    setSelectedWeek(next)
    const url = new URL(window.location.href)
    url.searchParams.set('week', ymd(next))
    const currentDay = weekOverview?.days?.[selectedDayIdx]?.date?.slice(0, 10)
    if (currentDay) url.searchParams.set('day', currentDay)
    window.history.pushState({}, '', url.toString())
  }
  const handleSelectDay = (idx: number, dayISO?: string) => {
    setSelectedDayIdx(idx)
    const url = new URL(window.location.href)
    url.searchParams.set('week', ymd(selectedWeek))
    const day = dayISO ?? weekOverview?.days?.[idx]?.date?.slice(0, 10)
    if (day) url.searchParams.set('day', day)
    window.history.pushState({}, '', url.toString())
  }


  const isEarlyMorning = useMemo(() => {
  const now = new Date()
  const h = now.getHours()
  return h >= 0 && h < 5
}, [])

  const isKTH = location.toLowerCase().startsWith('kth')

  const daysWithBrazilia: WeekOverviewDay[] = useMemo(() => {
    if (!weekOverview) return []
    if (!isKTH) return weekOverview.days
    return weekOverview.days.map((day) => {
      if (!isWeekdayISO(day.date)) return day
      const pubsForDay = prepareKthPubsWithBrazilia(day.pubs, {
        today: day.date.slice(0, 10),
        injectOnWeekdaysOnly: false,
      })
      return { ...day, pubs: pubsForDay }
    })
  }, [weekOverview, isKTH])

  // Safe selection even when loading
  const days = daysWithBrazilia
  const safeIdx = Math.min(selectedDayIdx, Math.max(days.length - 1, 0))
  const selectedDay = days[safeIdx]

const selectedDayForRender = useMemo(() => {
  if (!selectedDay) return selectedDay
  if (!isEarlyMorning) return selectedDay
  if (!selectedDay.isToday) return selectedDay

  console.log('Early morning today - merging with previous day')

  const prevDay = safeIdx > 0 ? days[safeIdx - 1] : undefined
  if (!prevDay?.pubs?.length) { return selectedDay }

  console.log(selectedDay)
  console.log(prevDay.pubs)

  console.log('Merged pubs:', dedupeByEventId([...(prevDay.pubs ?? []), ...(selectedDay.pubs ?? [])]))

  return {
    ...selectedDay,
    pubs: dedupeByEventId([...(prevDay.pubs ?? []), ...(selectedDay.pubs ?? [])]),
  }
}, [selectedDay, isEarlyMorning, safeIdx, days])



  // --- SEO strings + meta (always call hooks)
  const weekNo = format(selectedWeek, 'w', { locale: sv })
  const dayLabel = selectedDayForRender
  ? format(new Date(selectedDayForRender.date), 'd MMMM', { locale: sv })
  : ''
  const pageTitle = selectedDayForRender
    ? `${location_name} – pubar vecka ${weekNo} (${dayLabel}) | Pubquery`
    : `${location_name} – pubar vecka ${weekNo} | Pubquery`
  const pageDesc = selectedDayForRender
    ? `Öppna pubar på ${location_name} den ${dayLabel}. Se priser, karta och öppetider. Bläddra mellan dagar och veckor.`
    : `Öppna pubar på ${location_name}. Se priser, karta och öppetider. Bläddra mellan dagar och veckor.`

  usePageMeta(pageTitle, pageDesc)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('week', ymd(selectedWeek))
    if (selectedDayForRender) url.searchParams.set('day', selectedDayForRender.date.slice(0, 10))
    setCanonical(url.toString())
  }, [selectedWeek, selectedDayForRender])

  // --- JSON-LD ItemList for selected day (pass null while loading)
  const itemList = useMemo(() => {
    if (!selectedDayForRender?.pubs?.length) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Pubevenemang i ${location_name} – ${dayLabel}`,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: selectedDayForRender.pubs.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://pubquery.se/?event=${p.event_id}`,
        item: pubToEventJsonLd(p),
      })),
    }
  }, [selectedDayForRender, location_name, dayLabel])
  useJsonLd(`week-${location}-${selectedDayForRender?.date ?? ''}`, itemList)

  const loading = !weekOverview

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        {/* H1 */}
        <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
          {location_name}: vecka {weekNo}
          {selectedDayForRender ? ` – ${dayLabel}` : ''}
        </h1>

        {/* Week Label (calendar) + Selector Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="text-lg font-semibold flex items-center gap-2 text-white">
            <Calendar size={22} className="text-sky-400" />
            Vecka {weekNo} - {format(selectedWeek, 'yyyy', { locale: sv })}
            {weekOverview && (
              <span className="ml-4 text-base text-gray-400">
                | {weekOverview.totalPubs} pubar denna vecka
              </span>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handlePrevWeek}
              className="px-3 py-2 bg-[#232b32] border border-[#313c47] text-gray-100 rounded-lg flex items-center gap-1 font-medium hover:bg-[#2D3841] focus:ring-2 focus:ring-sky-400 transition"
            >
              <ArrowLeft size={18} /> Förra veckan
            </button>
            <button
              onClick={handleThisWeek}
              className="px-3 py-2 bg-sky-400 text-white font-bold rounded-lg shadow hover:bg-sky-500 focus:ring-2 focus:ring-sky-400 transition"
            >
              Denna vecka
            </button>
            <button
              onClick={handleNextWeek}
              className="px-3 py-2 bg-[#232b32] border border-[#313c47] text-gray-100 rounded-lg flex items-center gap-1 font-medium hover:bg-[#2D3841] focus:ring-2 focus:ring-sky-400 transition"
            >
              Nästa vecka <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Calendar Row (links for crawlability but behave like buttons) */}
        <div className="flex gap-2 bg-[#22282f] rounded-xl p-1 mb-5 shadow-sm">
          {weekOverview
            ? (days.length ? days : weekOverview.days).map((day, idx) => {
                const isSelected = idx === selectedDayIdx
                const isToday = day.isToday

                let btnClasses =
                  'flex-1 flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition-all '
                if (isSelected) {
                  btnClasses += 'bg-sky-950 shadow text-sky-400 font-bold scale-105 '
                } else if (isToday) {
                  btnClasses += 'outline outline-2 outline-sky-400 '
                } else {
                  btnClasses += 'hover:bg-[#232b32] '
                }

                const textClasses = isSelected ? '' : 'text-gray-200 font-normal'

                const url = new URL(window.location.origin + window.location.pathname)
                url.searchParams.set('week', ymd(selectedWeek))
                url.searchParams.set('day', day.date.slice(0, 10))

                return (
                  <a
                    key={`${day.weekdayShort}-${idx}`}
                    href={url.pathname + url.search}
                    className={btnClasses}
                    style={{ minWidth: 0 }}
                    onClick={(e) => {
                      e.preventDefault()
                      handleSelectDay(idx, day.date.slice(0, 10))
                    }}
                  >
                    <span className={`text-base leading-tight ${textClasses}`}>
                      {weekdayMap[day.weekdayShort as keyof typeof weekdayMap]}
                    </span>
                    <span className={`text-lg font-mono ${textClasses}`}>
                      {parseInt(day.date.slice(-2))}
                    </span>
                    <span className="mt-0.5 text-xs">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-sky-800 text-sky-300 font-semibold">
                        {day.pubs?.length ?? 0}
                      </span>
                    </span>
                  </a>
                )
              })
            : // simple skeleton placeholders
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 h-[64px] rounded-lg bg-[#232b32] animate-pulse" />
              ))}
        </div>

        {/* Metrics (compact & new bg) */}
        <div className="flex flex-row gap-3 mb-4 w-full">
          {selectedDay?.isToday && (weekOverview?.occupancy ?? 0) > 0 && (
            <div className="bg-[#232b32] p-3 rounded-xl flex flex-col items-center flex-1 min-w-0 shadow border border-[#232a35]">
              <Users size={22} className="mb-1 text-sky-400" />
              <span className="text-lg font-bold text-white">
                {Math.round((weekOverview?.occupancy ?? 0) * 100)}%
              </span>
              <span className="text-xs text-gray-400">Genomsnittlig fyllnadsgrad</span>
            </div>
          )}
          {selectedDay?.cheapestBeer && selectedDay.cheapestBeer.length > 0 && (
            <div className="bg-[#232b32] p-3 rounded-xl flex flex-col items-center flex-1 min-w-0 shadow border border-[#232a35]">
              <Beer size={22} className="mb-1 text-sky-400" />
              <span className="text-lg font-bold text-white">
                {selectedDay.cheapestBeer?.length ? `${selectedDay.cheapestBeer[0].price} kr` : '-'}
              </span>
              <span className="text-xs text-gray-400">
                {selectedDay.cheapestBeer?.length ? (
                  <>
                    Billigaste öl ikväll:{' '}
                    {selectedDay.cheapestBeer.length > 1 ? (
                      <Tooltip
                        tooltip={selectedDay.cheapestBeer
                          .slice(1)
                          .map((b) => b.name)
                          .join(', ')}
                      >
                        <span className="ml-1 underline cursor-pointer">
                          {selectedDay.cheapestBeer[0].name} +{selectedDay.cheapestBeer.length - 1}{' '}
                          fler
                        </span>
                      </Tooltip>
                    ) : (
                      <span className="ml-1">{selectedDay.cheapestBeer[0].name}</span>
                    )}
                  </>
                ) : (
                  'Billigaste öl'
                )}
              </span>
            </div>
          )}
        </div>

        {/* Day Title -> H2 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {location_name} pubar,{' '}
            {selectedDayForRender
              ? `${weekdayFullMap[selectedDayForRender.weekdayShort as keyof typeof weekdayFullMap].toLowerCase()} ${format(new Date(selectedDayForRender.date), 'd MMMM', { locale: sv })}`
              : 'Laddar dag...'}
          </h2>
          <a
            href="/"
            className="ml-2 px-3 py-1.5 rounded-lg bg-sky-900/70 hover:bg-sky-800 text-white text-base font-semibold transition flex items-center gap-2 shadow"
          >
            <Home size={18} /> Hem
          </a>
        </div>

        {/* Pub Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading || !selectedDayForRender ? (
            <div className="text-gray-400 col-span-full">Laddar…</div>
          ) : selectedDayForRender.pubs.length === 0 ? (
            <div className="text-gray-400 col-span-full">Inga pubar denna dag.</div>
          ) : (
            selectedDayForRender.pubs.map((pub) => {
              const { href, onClick } = createPubLinkProps(pub, locationObj, navigate)
              return (
                <a key={pub.event_id ?? href} href={href} className="block" onClick={onClick}>
                  <PubCard pub={pub} />
                </a>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
