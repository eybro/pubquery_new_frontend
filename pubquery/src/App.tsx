import { Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import PubWeekOverview from './pages/PubWeekOverview'
import OrganizationsDirectory from './pages/Organizations'
import Footer from './components/Footer'
import Canonical from './utils/Canonical.tsx'
import NotFound from './pages/NotFound.tsx'

export default function App() {
  return (
    <div className="bg-gradient-to-b from-sky-950 to-[#161A1D] min-h-screen flex flex-col">
      <div className="flex-grow">
        <Canonical />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/kth"
            element={<PubWeekOverview location="KTH" location_name="KTH" />}
          />
          <Route
            path="/su"
            element={
              <PubWeekOverview
                location="Stockholms universitet, Karolinska Institutet"
                location_name="SU och KI"
              />
            }
          />
          <Route path="/organizations" element={<OrganizationsDirectory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Footer always visible */}
      <Footer />
    </div>
  )
}
