import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Calendar, Users, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Link } from 'react-router-dom'

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Create custom marker icon with organization logo
function createLogoIcon(logoUrl?: string | null, orgCount?: number): L.DivIcon {
  if (!logoUrl) {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="relative">
        <div class="w-8 h-8 bg-sky-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        ${orgCount && orgCount > 1 ? `<div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">${orgCount}</div>` : ''}
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="relative">
      <div class="w-10 h-10 rounded-full bg-white border-2 border-sky-500 shadow-lg overflow-hidden flex items-center justify-center p-1">
        <img src="${logoUrl}" alt="" class="w-full h-full object-contain" />
      </div>
      ${orgCount && orgCount > 1 ? `<div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">${orgCount}</div>` : ''}
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

function slugify(text?: string | null) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/[^a-z0-9\-åäö]/g, '') // remove weird chars, keep åäö
}

type Organization = {
  organization_id: number
  organization_name: string
  display_name: string
  logo_url?: string | null
  location: string
  venue_id?: number | null
  venue_name?: string | null
  maps_link?: string | null
  organization_description?: string | null
  organization_fb_page?: string | null
  beer_price?: number | null
  cider_price?: number | null
  drink_price?: number | null
}

type Event = {
  event_id: number
  title: string
  date: string
  venue_name?: string
  description?: string
  fb_link?: string
}

type VenueWithCoords = {
  venue_name: string
  location: string
  maps_link?: string | null
  coordinates: [number, number] | null
  latitude?: number | null
  longitude?: number | null
  organizations: Organization[]
  upcomingEvents: Event[]
}

type VenueMapProps = {
  venues: VenueWithCoords[]
  onVenueClick?: (venue: VenueWithCoords) => void
}

// Component to auto-fit map bounds to markers
function FitBounds({ venues }: { venues: VenueWithCoords[] }) {
  const map = useMap()
  
  useEffect(() => {
    const validCoords = venues
      .map(v => v.coordinates)
      .filter((c): c is [number, number] => c !== null)
    
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [venues, map])
  
  return null
}

export default function VenueMap({ venues, onVenueClick }: VenueMapProps) {
  const validVenues = venues.filter(v => v.coordinates !== null)

  // Center on Stockholm by default
  const defaultCenter: [number, number] = [59.3293, 18.0686]
  const defaultZoom = 12

  const handleMarkerClick = (venue: VenueWithCoords) => {
    if (onVenueClick) {
      onVenueClick(venue)
    }
  }

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-[#313c47] bg-[#1a1f24]">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        
        <FitBounds venues={validVenues} />
        
        {validVenues.map((venue) => {
          // Use the first organization's logo as the marker icon
          const firstOrgLogo = venue.organizations[0]?.logo_url
          const orgCount = venue.organizations.length
          
          return (
            <Marker
              key={venue.venue_name}
              position={venue.coordinates!}
              icon={createLogoIcon(firstOrgLogo, orgCount)}
              eventHandlers={{
                click: () => handleMarkerClick(venue),
              }}
            >
              <Popup maxWidth={280}>
                <div className="p-2 min-w-[240px] max-w-[280px]">
                  <h3 className="font-bold text-base text-gray-900 mb-1">{venue.venue_name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{venue.location}</p>
                  
                  {/* Organizations */}
                  <div className="mb-2">
                    <h4 className="font-semibold text-xs text-gray-800 mb-1 flex items-center gap-1">
                      <Users size={12} />
                      Organisationer ({venue.organizations.length})
                    </h4>
                    <div className="space-y-1">
                      {venue.organizations.map((org) => {
                        const orgHref = `/organization/${org.organization_id}-${slugify(org.display_name)}`
                        return (
                          <Link
                            key={org.organization_id}
                            to={orgHref}
                            className="flex items-start gap-2 hover:bg-gray-50 rounded p-1 transition"
                          >
                            {org.logo_url && (
                              <img
                                src={org.logo_url}
                                alt={org.display_name}
                                className="w-6 h-6 rounded-full object-contain bg-white border border-gray-200 flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-xs text-gray-900 hover:text-blue-600">{org.display_name}</p>
                              {org.organization_fb_page && (
                                <a
                                  href={org.organization_fb_page.startsWith('http') ? org.organization_fb_page : `https://facebook.com/${org.organization_fb_page}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={8} />
                                  Facebook
                                </a>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  {venue.upcomingEvents.length > 0 && (
                    <div className="mb-2">
                      <h4 className="font-semibold text-xs text-gray-800 mb-1 flex items-center gap-1">
                        <Calendar size={12} />
                        Kommande event ({venue.upcomingEvents.length})
                      </h4>
                      <div className="space-y-1">
                        {venue.upcomingEvents.slice(0, 3).map((event) => (
                          <Link
                            key={event.event_id}
                            to={`/event/${event.event_id}`}
                            className="block text-xs hover:bg-gray-50 rounded p-1 transition"
                          >
                            <p className="font-medium text-gray-900 hover:text-blue-600">{event.title}</p>
                            <p className="text-xs text-gray-600">
                              {format(new Date(event.date), 'PPP', { locale: sv })}
                            </p>
                          </Link>
                        ))}
                        {venue.upcomingEvents.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{venue.upcomingEvents.length - 3} fler event
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Maps Link */}
                  {venue.maps_link && (
                    <a
                      href={venue.maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                    >
                      <MapPin size={12} />
                      Öppna i Google Maps
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
