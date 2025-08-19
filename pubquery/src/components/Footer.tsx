import { Link } from 'react-router-dom'
import { Beer, LogIn, Mail, Home, DoorOpen } from 'lucide-react'
import { siFacebook, siInstagram } from 'simple-icons/icons'

function BrandIcon({ path, color }: { path: string; color: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" width="16" height="16" fill={color}>
      <path d={path} />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[#161a1d] text-white mt-8 border-t border-[#313c47]">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <nav className="flex flex-wrap items-center justify-center gap-2 bg-[#22282f] border border-[#313c47] rounded-xl p-1 shadow-sm">
          {/* Home */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#232b32] focus:outline-none focus:ring-2 focus:ring-sky-400 transition text-gray-100"
            aria-label="Hem"
          >
            <Home size={16} className="text-sky-400" />
            <span className="text-sm font-medium">Hem</span>
          </Link>

          {/* Organizations */}
          <Link
            to="/organizations"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#232b32] focus:outline-none focus:ring-2 focus:ring-sky-400 transition text-gray-100"
            aria-label="Lista över Pubar & Klubbmästerier"
          >
            <Beer size={16} className="text-sky-400" />
            <span className="text-sm font-medium">Lista över Pubar & Klubbmästerier</span>
          </Link>

          {/* Login */}
          <a
            href="https://admin.pubquery.se"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#232b32] focus:outline-none focus:ring-2 focus:ring-sky-400 transition text-gray-100"
            aria-label="Logga in"
          >
            <LogIn size={16} className="text-sky-400" />
            <span className="text-sm font-medium">Logga in</span>
          </a>

          {/* Counter */}
          <a
            href="https://counter.pubquery.se"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#232b32] focus:outline-none focus:ring-2 focus:ring-sky-400 transition text-gray-100"
            aria-label="Räknar-app"
          >
            <DoorOpen size={16} className="text-sky-400" />
            <span className="text-sm font-medium">Räknar-app</span>
          </a>

          {/* Contact */}
          <a
            href="mailto:info@pubquery.se"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#232b32] focus:outline-none focus:ring-2 focus:ring-sky-400 transition text-gray-100"
            aria-label="Kontakt"
          >
            <Mail size={16} className="text-sky-400" />
            <span className="text-sm font-medium">Kontakt</span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/pubquery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#232b32] focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-gray-100"
            aria-label="Instagram"
          >
            <BrandIcon path={siInstagram.path} color="#E4405F" />
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/pubquery"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#232b32] focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-100"
            aria-label="Facebook"
          >
            <BrandIcon path={siFacebook.path} color="#1877F2" />
          </a>
        </nav>
      </div>
    </footer>
  )
}
