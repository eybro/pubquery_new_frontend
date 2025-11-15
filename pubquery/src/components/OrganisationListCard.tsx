import { Users } from "lucide-react"

type ClubsPromoCardProps = {
  /** Keep this in sync with CounterPromoCard if needed */
  aspectClass?: string
}

export default function ClubsPromoCard({ aspectClass = "aspect-[4/3]" }: ClubsPromoCardProps) {
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
        <Users size={26} className="text-purple-600" />
      </div>

      {/* FLEX-GROW MEDIA */}
      <div
        className={`
          w-full mb-3 overflow-hidden rounded-lg
          bg-gradient-to-br from-purple-100 to-purple-200
          flex items-center justify-center
          flex-grow
          min-h-[120px] sm:min-h-[140px]
          max-h-[260px] sm:max-h-[300px]
          ${aspectClass ? 'md:' + aspectClass : ''}
        `}
      >
        <div className="flex flex-col items-center text-center gap-1">
          <Users className="text-purple-700" size={32} />
          <span className="text-purple-800 font-semibold">
            Klubbmästerier & föreningar
          </span>
        </div>
      </div>

      {/* Content */}
      <div>
        <ul className="text-sm text-gray-600 mt-2 leading-relaxed space-y-1 list-disc list-inside">
          <li>🌎 Utforska alla klubbmästerier & föreningar</li>
          <li>📍 Upptäck alla studentpubar i Stockholm</li>
          <li>💸 Jämför priser</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 mt-3 pt-3">
        <p className="text-sm text-gray-400 italic">
          👉{" "}
          <a
            href="/organizations"
            className="text-purple-700 underline hover:no-underline font-medium"
          >
            Till listan över föreningar
          </a>
        </p>
      </div>
    </div>
  )
}
