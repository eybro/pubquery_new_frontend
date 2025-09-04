import { Ticket } from 'lucide-react'

export default function DinnerPromoCard() {
  return (
    <div
  className="
    bg-white text-black rounded-xl shadow-md p-4 min-h-[220px]
    flex flex-col transition-all duration-200
    hover:shadow-2xl hover:scale-[1.03] hover:z-10
    relative
  "
>
      {/* Icon top-right for visual consistency */}
      <div className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow">
        <Ticket size={28} className="text-blue-500" />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide font-semibold mb-1 text-blue-700">
          Lägg till din sittning
        </div>
        <h3 className="font-bold text-lg">Vill du att din sittning ska synas här?</h3>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          Logga in på{" "}
          <a
            href="https://admin.pubquery.se"
            className="text-blue-700 underline hover:no-underline font-medium"
          >
            admin.pubquery.se
          </a>{" "}
          eller kontakta{" "}
          <a
            href="mailto:info@pubquery.se"
            className="text-blue-700 underline hover:no-underline font-medium"
          >
            info@pubquery.se
          </a>
          .
        </p>
      </div>

      <div className="border-t border-gray-300 mt-3 pt-3">
        <p className="text-sm text-gray-400 italic">
          Lägg upp din sittning helt gratis och nå tusentals studenter!
        </p>
      </div>
    </div>
  )
}
