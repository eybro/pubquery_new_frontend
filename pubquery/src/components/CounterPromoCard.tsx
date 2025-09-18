import { Users } from "lucide-react"

type CounterPromoCardProps = {
  /** Keep this in sync with MerchPromoCard if you want (ignored when flex-growing) */
  aspectClass?: string
}

export default function CounterPromoCard({ aspectClass = "aspect-[4/3]" }: CounterPromoCardProps) {
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
        <Users size={28} className="text-blue-600" />
      </div>

      {/* FLEX-GROW MEDIA: this scales to match height of sibling cards */}
      <div
        className={`
          w-full mb-3 overflow-hidden rounded-lg
          bg-gradient-to-br from-sky-100 to-blue-200
          flex items-center justify-center
          flex-grow
          min-h-[120px] sm:min-h-[140px]
          max-h-[260px] sm:max-h-[300px]
          ${aspectClass ? 'md:' + aspectClass : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <Users className="text-blue-700" size={28} />
          <span className="text-blue-800 font-semibold">Prova vår dörräknar-app</span>
        </div>
      </div>

      {/* Content */}
      <div>
        <ul className="text-sm text-gray-600 mt-2 leading-relaxed space-y-1 list-disc list-inside">
          <li>🔄 Livesynkad mellan ett obegränsat antal enheter</li>
          <li>📊 Dela live besöks- och ködata på pubquery.se</li>
          <li>🌐 Körs direkt i webbläsaren (ingen nedladdning)</li>
        </ul>
      </div>

      {/* Footer pinned to bottom; content above is natural, media flexes */}
      <div className="border-t border-gray-300 mt-3 pt-3">
        <p className="text-sm text-gray-400 italic">
          👉{" "}
          <a
            href="https://counter.pubquery.se"
            className="text-blue-700 underline hover:no-underline font-medium"
          >
            counter.pubquery.se
          </a>
        </p>
      </div>
    </div>
  )
}
