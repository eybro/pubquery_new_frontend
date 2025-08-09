import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import PubWeekOverview from './pages/PubWeekOverview'
import OrganizationsDirectory from './pages/Organizations'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="bg-[#161A1D] min-h-screen flex flex-col">
      {/* Main content area grows to fill the space above the footer */}
      <div className="flex-grow">
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {/* Footer always visible */}
      <Footer />
    </div>
  )
}
