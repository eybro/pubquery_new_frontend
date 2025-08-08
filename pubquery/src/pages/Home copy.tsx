import { useEffect, useState } from 'react'
import LocationSection from '../components/LocationSection'
import type { Pub } from '../types/Pub'
import type { Dinner } from '../types/Dinner'

function sortByDateAsc(a: Pub, b: Pub) {
  return new Date(a.date).getTime() - new Date(b.date).getTime()
}

export default function Home() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [dinners, setDinners] = useState<Dinner[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pubs/getUpcoming`)
      .then(res => res.json())
      .then(data => setPubs(data))
  }, [])


  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dinners/getClosest`)
      .then(res => res.json())
      .then(data => setDinners(data));
  }, []);

  const kthPubs = pubs
  .filter(pub => pub.location?.toLowerCase().startsWith("kth"))
  .sort(sortByDateAsc)

const suPubs = pubs
  .filter(pub => pub.location?.toLowerCase().startsWith("stockholms universitet"))
  .sort(sortByDateAsc)

  return (
    <div className="text-white min-h-screen p-4 space-y-6">

      <div className="w-full flex justify-center mb-6">
        <img
          src="/pubquery_logo.svg"
          alt="Pubquery Logo"
          className="h-20 w-auto"
          draggable={false}
        />
      </div>

      <LocationSection location="Pubar på KTH" pubs={kthPubs} />
      <LocationSection location="Pubar på SU och KI" pubs={suPubs} />

    </div>
  )
}

