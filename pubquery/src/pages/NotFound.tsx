import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="text-white min-h-screen p-4 flex flex-col items-center justify-center">
      <Helmet>
        <title>404 – Pubquery</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Logo */}
      <div className="mb-6">
        <img
          src="/pubquery_logo.svg"
          alt="Pubquery Logo"
          className="h-20 w-auto"
          draggable={false}
        />
      </div>

      {/* Headline */}
      <div className="text-4xl sm:text-5xl font-bold text-white mb-4 text-center">
        404 – Sidan hittades inte
      </div>

      {/* Subtext */}
      <p className="text-white/70 text-lg sm:text-xl text-center mb-8 max-w-lg">
        Vi kunde tyvärr inte hitta sidan du letade efter. Den kan vara borttagen eller ha flyttats.
      </p>

      {/* Button */}
      <Link
        to="/"
        className="px-5 py-2.5 rounded-lg bg-sky-900/80 hover:bg-sky-800 text-white font-semibold flex items-center gap-2 shadow transition text-base"
      >
        <Frown size={18} /> Tillbaka till startsidan
      </Link>
    </div>
  )
}
