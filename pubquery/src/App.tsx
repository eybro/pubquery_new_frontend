import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import PubWeekOverview from './pages/PubWeekOverview'

export default function App() {
  return (
    <Routes>
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
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
