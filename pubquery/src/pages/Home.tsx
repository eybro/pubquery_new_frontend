import { useEffect, useState } from 'react'
import LocationSection from '../components/LocationSection'
import PubCard from '../components/PubCard'
import PubModal from '../components/PubModal'
import DinnerCard from '../components/DinnerCard'
import DinnerModal from '../components/DinnerModal'
import { Beer, Ticket, ArrowRight } from 'lucide-react'
import type { Pub } from '../types/Pub'
import type { Dinner } from '../types/Dinner'

function sortByDateAsc(a: { date: string }, b: { date: string }) {
  return new Date(a.date).getTime() - new Date(b.date).getTime()
}

export default function Home() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [dinners, setDinners] = useState<Dinner[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pubs/getUpcoming`)
      .then((res) => res.json())
      .then((data) => setPubs(data))
  }, [])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dinners/getClosest`)
      .then((res) => res.json())
      .then((data) => setDinners(data))
  }, [])

  const kthPubs = pubs
    .filter((pub) => pub.location?.toLowerCase().startsWith('kth'))
    .sort(sortByDateAsc)

  const suPubs = pubs
    .filter((pub) => pub.location?.toLowerCase().startsWith('stockholms universitet'))
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
      <div className="-mt-6 text-lg sm:text-2xl text-white/90 text-center font-semibold">
        Studentpubar med liveinformation
      </div>

      <LocationSection
        location="Pubar på KTH"
        items={kthPubs}
        renderCard={(pub, openModal) => <PubCard pub={pub} onClick={openModal} />}
        renderModal={(pub, open, onClose) => <PubModal pub={pub} open={open} onClose={onClose} />}
        icon={<Beer size={28} color="#1fbad6" className="shrink-0" />}
        button={
          <a
            href="/kth"
            className="px-3 py-1.5 rounded-lg bg-sky-900/80 hover:bg-sky-800 text-white font-semibold flex items-center gap-2 shadow transition text-base"
          >
            Veckovy <ArrowRight size={16} />
          </a>
        }
      />

      <LocationSection
        location="Pubar på SU och KI"
        items={suPubs}
        renderCard={(pub, openModal) => <PubCard pub={pub} onClick={openModal} />}
        renderModal={(pub, open, onClose) => <PubModal pub={pub} open={open} onClose={onClose} />}
        icon={<Beer size={28} color="#1fbad6" className="shrink-0" />}
        button={
          <a
            href="/su"
            className="px-3 py-1.5 rounded-lg bg-sky-900/80 hover:bg-sky-800 text-white font-semibold flex items-center gap-2 shadow transition text-base"
          >
            Veckovy <ArrowRight size={16} />
          </a>
        }
      />

      <LocationSection
        location="Sittningar i Stockholm"
        items={dinners}
        renderCard={(dinner, openModal) => <DinnerCard dinner={dinner} onClick={openModal} />}
        renderModal={(dinner, open, onClose) => (
          <DinnerModal dinner={dinner} open={open} onClose={onClose} />
        )}
        icon={<Ticket size={28} color="#1fbad6" className="shrink-0" />}
      />
    </div>
  )
}
