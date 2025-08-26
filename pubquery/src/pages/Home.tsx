import { useEffect, useState } from 'react'
import LocationSection from '../components/LocationSection'
import PubCard from '../components/PubCard'
import DinnerCard from '../components/DinnerCard'
import DinnerModal from '../components/DinnerModal'
import { Beer, Ticket, ArrowRight } from 'lucide-react'
import type { Pub } from '../types/Pub'
import type { Dinner } from '../types/Dinner'
import { useJsonLd, pubToEventJsonLd } from '@/utils/seo'
import { useMemo } from 'react'
import { prepareKthPubsWithBrazilia, sortByDateAsc } from '@/utils/kthBrazilia'
import { createPubLinkProps } from '@/utils/eventLinks'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Home() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [dinners, setDinners] = useState<Dinner[]>([])
  const navigate = useNavigate()
  const locationObj = useLocation()

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

  const kthPubs = prepareKthPubsWithBrazilia(pubs)

  const suPubs = pubs
  .filter((pub) => {
    const loc = pub.location?.toLowerCase() || ''
    return (
      loc.startsWith('stockholms universitet') ||
      loc.startsWith('karolinska')
    )
  })
  .sort(sortByDateAsc)
  
  const eventsGraph = useMemo(() => {
    const list = pubs
      // .filter(p => p.visible === 1) // uncomment if needed
      .slice() // copy
      .sort(sortByDateAsc)
      .slice(0, 15)
      .map(pubToEventJsonLd)

    return list.length ? { '@context': 'https://schema.org', '@graph': list } : null
  }, [pubs])

  useJsonLd('home-events', eventsGraph)

  useJsonLd('website', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pubquery',
    url: 'https://pubquery.se/',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://pubquery.se/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  })

  useJsonLd('organization', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pubquery',
    url: 'https://pubquery.se/',
    logo: 'https://pubquery.se/pubquery_logo.png',
    sameAs: ['https://www.instagram.com/pubquery.se'],
  })

  return (
    <div className="text-white min-h-screen p-4 space-y-3">
      <div className="w-full flex justify-center mb-3">
        <img
          src="/pubquery_logo.svg"
          alt="Pubquery Logo"
          className="h-20 w-auto"
          draggable={false}
        />
      </div>
      <h1 className="text-xl sm:text-4xl font-bold text-white text-center">
        Studentpubar i Stockholm – liveinfo
      </h1>
      <p className="text-white/80 text-center mt-2 max-w-2xl mx-auto">
        Öppettider, besökare, kö-status och mycket mer.
      </p>

      <LocationSection
        location="Pubar på KTH"
        items={kthPubs}
        renderCard={(pub, openModal) => <PubCard pub={pub} onClick={openModal} />}
        icon={<Beer size={28} color="#1fbad6" className="shrink-0" />}
        getLinkProps={(pub) => createPubLinkProps(pub, locationObj, navigate)}
        getKey={(pub) => String(pub.event_id ?? `${pub.date}-${pub.venue_name}`)}
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
        getLinkProps={(pub) => createPubLinkProps(pub, locationObj, navigate)}
        getKey={(pub) => String(pub.event_id ?? `${pub.date}-${pub.venue_name}`)}
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
