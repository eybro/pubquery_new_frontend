import { Routes, Route, useLocation } from 'react-router-dom'
import type { Location as RouterLocation } from 'react-router-dom'
import Home from './pages/Home'
import PubWeekOverview from './pages/PubWeekOverview'
import OrganizationsDirectory from './pages/Organizations'
import Footer from './components/Footer'
import Canonical from './utils/Canonical'
import NotFound from './pages/NotFound'
import EventPage from './pages/EventPage'

export default function App() {
  const location = useLocation()

  // Guard state
  type ModalState = { backgroundLocation?: RouterLocation } | null
  const state = (location.state as ModalState) || null

  // Validate backgroundLocation so we never feed <Routes> a bad object
  const isRouterLoc = (v: unknown): v is RouterLocation =>
    typeof v === 'object' &&
    v !== null &&
    'pathname' in v &&
    typeof (v as { pathname?: unknown }).pathname === 'string'

  const backgroundLocation = state?.backgroundLocation && isRouterLoc(state.backgroundLocation)
    ? state.backgroundLocation
    : undefined

  // Only show modal overlay if we’re currently on /event/*
  const isOnEventRoute = location.pathname.startsWith('/event/')
  const showModal = Boolean(backgroundLocation && isOnEventRoute)

  return (
    <div className="bg-gradient-to-b from-sky-950 to-[#161A1D] min-h-screen flex flex-col">
      <div className="flex-grow">
        <Canonical />

        {/* Primary content (shows background page when modal is active) */}
        <Routes location={backgroundLocation ?? location}>
          <Route path="/" element={<Home />} />
          <Route path="/kth" element={<PubWeekOverview location="KTH" location_name="KTH" />} />
          <Route
            path="/su"
            element={
              <PubWeekOverview
                location="Stockholms universitet, Karolinska Institutet"
                location_name="SU och KI"
              />
            }
          />
          <Route
            path="/demo"
            element={<PubWeekOverview location="demo" location_name="demoplats" />}
          />
          <Route path="/organizations" element={<OrganizationsDirectory />} />
          <Route path="/org/:slug" element={<OrganizationsDirectory />} />

          {/* Full-page event (direct visit) */}
          <Route path="/event/:idSlug" element={<EventPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Modal overlay route — rendered only when we have a valid background AND are on /event/* */}
        {showModal && (
          <Routes>
            <Route path="/event/:idSlug" element={<EventPage asModal />} />
          </Routes>
        )}
      </div>

      <Footer />
    </div>
  )
}
