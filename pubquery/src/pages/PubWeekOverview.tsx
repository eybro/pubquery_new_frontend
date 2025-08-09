import { useEffect, useState } from 'react'
import { format, addDays, subDays, startOfWeek } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Beer, Users, Calendar, ArrowLeft, ArrowRight, Home } from 'lucide-react'
import PubCard from '../components/PubCard'
import PubModal from '../components/PubModal'
import type { Pub } from '@/types/Pub'

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
}
const weekdayFullMap = {
  mon: 'Måndag',
  tue: 'Tisdag',
  wed: 'Onsdag',
  thu: 'Torsdag',
  fri: 'Fredag',
  sat: 'Lördag',
  sun: 'Söndag',
}

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

export default function PubWeekOverview({
  location,
  location_name,
}: {
  location: string
  location_name: string
}) {
  const [selectedPub, setSelectedPub] = useState<Pub | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [weekOverview, setWeekOverview] = useState<WeekOverview | null>(null)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const today = new Date()
    return (today.getDay() + 6) % 7
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const body = {
          location,
          week: format(selectedWeek, 'yyyy-MM-dd'),
        }
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pubs/weekOverview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        setWeekOverview(await res.json())
      } catch (error) {
        console.error('Failed to fetch week overview data:', error)
      }
    }
    fetchData()
  }, [location, selectedWeek])

  const handlePrevWeek = () => setSelectedWeek(subDays(selectedWeek, 7))
  const handleNextWeek = () => setSelectedWeek(addDays(selectedWeek, 7))
  const handleThisWeek = () => setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const handleSelectDay = (idx: number) => setSelectedDayIdx(idx)

  if (!weekOverview) return <div className="text-gray-200">Laddar...</div>
  const days = weekOverview.days
  const selectedDay = days[selectedDayIdx]

  return (
    <div className="min-h-screen bg-[#161a1d] p-4">
      <div className="max-w-5xl mx-auto">
        {/* Week Label (calendar) + Selector Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="text-lg font-semibold flex items-center gap-2 text-white">
            <Calendar size={22} className="text-sky-400" />
            Vecka {format(selectedWeek, 'w', { locale: sv })} -{' '}
            {format(selectedWeek, 'yyyy', { locale: sv })}
            <span className="ml-4 text-base text-gray-400">
              | {weekOverview.totalPubs} pubar denna vecka
            </span>
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

        {/* Calendar Row */}
        <div className="flex gap-2 bg-[#22282f] rounded-xl p-1 mb-5 shadow-sm">
          {days.map((day, idx) => {
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

            return (
              <button
                key={day.weekdayShort}
                className={btnClasses}
                style={{ minWidth: 0 }}
                onClick={() => handleSelectDay(idx)}
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
              </button>
            )
          })}
        </div>

        {/* Metrics (compact & new bg) */}
        <div className="flex flex-row gap-3 mb-4 w-full">
          {selectedDay.isToday && weekOverview.occupancy > 0 && (
            <div className="bg-[#232b32] p-3 rounded-xl flex flex-col items-center flex-1 min-w-0 shadow border border-[#232a35]">
              <Users size={22} className="mb-1 text-sky-400" />
              <span className="text-lg font-bold text-white">
                {Math.round(weekOverview.occupancy * 100)}%
              </span>
              <span className="text-xs text-gray-400">Genomsnittlig fyllnadsgrad</span>
            </div>
          )}
          {selectedDay.cheapestBeer && selectedDay.cheapestBeer.length > 0 && (
          <div className="bg-[#232b32] p-3 rounded-xl flex flex-col items-center flex-1 min-w-0 shadow border border-[#232a35]">
            <Beer size={22} className="mb-1 text-sky-400" />
            <span className="text-lg font-bold text-white">
              {selectedDay.cheapestBeer && selectedDay.cheapestBeer.length > 0
                ? `${selectedDay.cheapestBeer[0].price} kr`
                : '-'}
            </span>
            <span className="text-xs text-gray-400">
              {selectedDay.cheapestBeer && selectedDay.cheapestBeer.length > 0 ? (
                <>
                  Billigaste öl:{' '}
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

        {/* Day Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-white">
            {location_name} pubar,{' '}
            {weekdayFullMap[selectedDay.weekdayShort as keyof typeof weekdayFullMap].toLowerCase()}{' '}
            {format(new Date(selectedDay.date), 'd MMMM', { locale: sv })}
          </div>
          <a
            href="/"
            className="ml-2 px-3 py-1.5 rounded-lg bg-sky-900/70 hover:bg-sky-800 text-white text-base font-semibold transition flex items-center gap-2 shadow"
          >
            <Home size={18} /> Hem
          </a>
        </div>
        {/* Pub Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {selectedDay.pubs.length === 0 ? (
            <div className="text-gray-400 col-span-full">Inga pubar denna dag.</div>
          ) : (
            selectedDay.pubs.map((pub) => (
              <PubCard
                key={pub.event_id}
                pub={pub}
                onClick={() => {
                  setSelectedPub(pub)
                  setModalOpen(true)
                }}
              />
            ))
          )}
        </div>

        {/* Modal */}
        {selectedPub && (
          <PubModal
            pub={selectedPub}
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setSelectedPub(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
