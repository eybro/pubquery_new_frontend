import { Store } from "lucide-react"

type MerchPromoCardProps = {
  /** Keep this in sync with CounterPromoCard if needed */
  aspectClass?: string
}

export default function MerchPromoCard({ aspectClass = "aspect-[4/3]" }: MerchPromoCardProps) {
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
        <Store size={26} className="text-green-600" />
      </div>

      {/* FLEX-GROW MEDIA */}
      <div
        className={`
          w-full mb-3 overflow-hidden rounded-lg
          bg-gradient-to-br from-green-100 to-green-200
          flex items-center justify-center
          flex-grow
          min-h-[120px] sm:min-h-[140px]
          max-h-[260px] sm:max-h-[300px]
          ${aspectClass ? 'md:' + aspectClass : ''}
        `}
      >
        <div className="flex flex-col items-center text-center gap-1">
          <Store className="text-green-700" size={32} />
          <span className="text-green-800 font-semibold">Pubquerys webbutik</span>
        </div>
      </div>

      {/* Content */}
      <div>
        <ul className="text-sm text-gray-600 mt-2 leading-relaxed space-y-1 list-disc list-inside">
          <li>🏷️ 25% rabatt med koden <strong>pubquery25</strong></li>
          <li>🚀 Snabb Leverans</li>
          <li>🤝 Allt överskott går tillbaka till plattformen</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 mt-3 pt-3">
        <p className="text-sm text-gray-400 italic">
          👉{" "}
          <a
            href="https://pubquery.myshopify.com"
            className="text-green-700 underline hover:no-underline font-medium"
          >
            pubquery.myshopify.com
          </a>
        </p>
      </div>
    </div>
  )
}
