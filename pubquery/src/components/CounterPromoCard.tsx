import { Users } from "lucide-react"

export default function CounterPromoCard() {
  return (
    <div
      className="
        bg-white text-black rounded-xl shadow-md p-4 min-h-[220px]
        flex flex-col transition-all duration-200
        hover:shadow-2xl hover:scale-[1.03] hover:z-10
        relative
      "
    >
      {/* Icon top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow">
        <Users size={28} className="text-blue-600" />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide font-semibold mb-1 text-blue-700">
          Prova vår dörräknar-app
        </div>
        <h3 className="font-bold text-lg max-w-[85%]">
          Pubquerys dörräknar-app
        </h3>
        <ul className="text-sm text-gray-600 mt-2 leading-relaxed space-y-1 list-disc list-inside">
          <li>🔄 Livesynkad mellan ett obegränsat antal enheter</li>
          <li>📊 Dela live besöks- och ködata på pubquery.se</li>
          <li>🌐 Körs direkt i webbläsaren (ingen nedladdning)</li>
        </ul>
      </div>

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
