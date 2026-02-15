import { Beer } from "lucide-react"

type PubStatsCardProps = {
  aspectClass?: string
  totalEvents?: number
}

export default function PubStatsHeroCard({
  aspectClass = "aspect-[4/3]",
  totalEvents = 1500,
}: PubStatsCardProps) {
  return (
    <div
      className="
        bg-white text-black rounded-xl shadow-md p-4
        flex flex-col h-full transition-all duration-200
        hover:shadow-2xl hover:scale-[1.03] hover:z-10
        relative
      "
    >
      {/* Icon top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow">
        <Beer size={26} className="text-green-600" />
      </div>

      {/* HERO STAT */}
      <div
        className={`
          w-full mb-3 overflow-hidden rounded-lg
          flex flex-col items-center justify-center
          flex-grow
          min-h-[140px] sm:min-h-[180px]
          max-h-[300px] sm:max-h-[340px]
          ${aspectClass ? 'md:' + aspectClass : ''}
          bg-gradient-to-br from-green-100 to-green-200
        `}
      >
          <span className="text-5xl sm:text-6xl font-extrabold text-green-900 drop-shadow-lg z-10">{totalEvents}+</span>
        <span className="text-green-900 mt-2 text-lg sm:text-xl font-semibold z-10">
          Studentpub-event visade
        </span>
      </div>

      {/* Content */}
      <div className="mt-2 text-gray-600 text-sm sm:text-base leading-relaxed">
        <ul className="list-disc list-inside space-y-1">
          <li>🔎 Aktuella öppettider och event</li>
          <li>⏰ Uppdateras dagligen</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 mt-3 pt-3">
        <p className="text-sm text-gray-400 italic">
          👉{" "}
          <a
            href="https://pubquery.se"
            className="text-green-700 underline hover:no-underline font-medium"
          >
            pubquery.se
          </a>
        </p>
      </div>
    </div>
  )
}
