import { useEffect } from 'react'
import type { Pub } from '@/types/Pub'
import type { Dinner } from '@/types/Dinner'

/** Injects (or replaces) a single <script type="application/ld+json"> into <head>. */
export function useJsonLd(id: string, data: object | null) {
  useEffect(() => {
    const elId = `jsonld-${id}`
    let el = document.getElementById(elId) as HTMLScriptElement | null

    if (!data) {
      // If no data, remove any existing script and bail
      if (el) el.remove()
      return
    }

    // Create if missing
    if (!el) {
      el = document.createElement('script')
      el.type = 'application/ld+json'
      el.id = elId
      document.head.appendChild(el)
    }

    // Update content
    el.text = JSON.stringify(data)
  }, [id, data])
}

/** Normalize Swedish postal codes like "11428" -> "114 28" */
function normalizePostalCode(raw?: string) {
  if (!raw) return undefined
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  return raw.trim()
}

function normalizeCountry(raw?: string) {
  if (!raw) return 'SE'
  const v = raw.trim().toLowerCase()
  if (['se', 'sv', 'sverige', 'sweden'].includes(v)) return 'SE'
  return raw // fallback: keep whatever you got
}

/** Try to parse "Street 12, 114 28 Stockholm, Sweden" into a PostalAddress */
export function parsePostalAddress(address?: string) {
  if (!address) return undefined

  const m1 = address.match(/^\s*([^,]+?)\s*,\s*(\d{3}\s?\d{2})\s+([^,]+?)(?:\s*,\s*([^,]+))?\s*$/)
  if (m1) {
    const [, streetAddress, zip, locality, countryRaw] = m1
    return {
      '@type': 'PostalAddress',
      streetAddress: streetAddress.trim(),
      postalCode: normalizePostalCode(zip),
      addressLocality: locality.trim(),
      addressCountry: normalizeCountry(countryRaw || 'SE'),
    }
  }

  const m2 = address.match(/^\s*([^,]+?)\s*,\s*(\d{3}\s?\d{2})\s+([^,]+?)\s*$/)
  if (m2) {
    const [, streetAddress, zip, locality] = m2
    return {
      '@type': 'PostalAddress',
      streetAddress: streetAddress.trim(),
      postalCode: normalizePostalCode(zip),
      addressLocality: locality.trim(),
      addressCountry: 'SE',
    }
  }

  const m3 = address.match(/^\s*([^,]+?)\s*,\s*([^,]+?)\s*$/)
  if (m3) {
    const [, streetAddress, locality] = m3
    return {
      '@type': 'PostalAddress',
      streetAddress: streetAddress.trim(),
      addressLocality: locality.trim(),
      addressCountry: 'SE',
    }
  }

  return undefined
}

/** Local ISO with timezone offset, e.g. 2025-08-10T02:00:00+02:00 */
export function toLocalISOWithOffset(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const tzMin = -d.getTimezoneOffset()
  const sign = tzMin >= 0 ? '+' : '-'
  const tzh = pad(Math.floor(Math.abs(tzMin) / 60))
  const tzm = pad(Math.abs(tzMin) % 60)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${tzh}:${tzm}`
}

function buildOffers(pub: Pub): JsonLdObject[] | undefined {
  const offers: JsonLdObject[] = []
  const eventUrl =
    normalizeFacebookUrl(pub.fb_link, pub.fb_page) || `https://pubquery.se/?event=${pub.event_id}`

  const add = (name: string, raw?: number | null) => {
    if (raw == null) return
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return
    offers.push({
      '@type': 'Offer',
      name,
      price: n,
      priceCurrency: 'SEK',
      availability: 'https://schema.org/InStock',
      url: eventUrl,
    })
  }

  add('Öl', pub.beer_price)
  add('Cider', pub.cider_price)
  add('Drink', pub.drink_price)

  return offers.length ? offers : undefined
}

/** Upsert <title> and <meta name="description"> without creating duplicates. */
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    if (title) document.title = title

    if (description) {
      let el = document.head.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.name = 'description'
        document.head.appendChild(el)
      }
      el.content = description
    }
  }, [title, description])
}

/** Normalizes a Facebook reference (full URL or page slug) to a URL, or undefined. */
export function normalizeFacebookUrl(fbLink?: string | null, fbPage?: string | null) {
  const link = (fbLink || '').trim()
  const page = (fbPage || '').trim()
  if (link) return link
  if (page) return `https://facebook.com/${page}`
  return undefined
}

/** Pub -> Schema.org Event */
/** JSON-LD value (loosely typed object but not `any`) */
type JsonLdObject = Record<string, unknown>

export function pubToEventJsonLd(pub: Pub): JsonLdObject {
  const sameAs = normalizeFacebookUrl(pub.fb_link, pub.fb_page)
  const postal = parsePostalAddress(pub.address)

  const event: JsonLdObject = {
    '@type': 'SocialEvent',
    name: pub.title,
    startDate: pub.date, // keep UTC "Z"
    // endDate: pub.end_date ?? undefined,   // include if/when you have it
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `https://pubquery.se/?event=${pub.event_id}`,
    description: pub.description || undefined,
    image: pub.logo_url ? [pub.logo_url] : undefined,
    isAccessibleForFree: true,
    sameAs: sameAs || undefined,
    organizer: {
      '@type': 'Organization',
      name: pub.display_name || 'Arrangör',
      url: sameAs || undefined, // <- new: organizer URL (FB/event page)
      sameAs: sameAs || undefined,
    } as JsonLdObject,
    performer: {
      '@type': 'Organization',
      name: pub.display_name || 'Arrangör', // <- new: performer (optional)
    } as JsonLdObject,
    location: {
      '@type': 'Place',
      name: pub.venue_name || pub.location || 'Studentpub',
      address: postal ?? pub.address ?? undefined,
    } as JsonLdObject,
    offers: buildOffers(pub), // <- new: offers from drink prices
  }

  // prune undefined
  for (const k of Object.keys(event)) if (event[k] === undefined) delete event[k]
  for (const k of Object.keys(event.organizer as JsonLdObject))
    if ((event.organizer as JsonLdObject)[k] === undefined)
      delete (event.organizer as JsonLdObject)[k]
  for (const k of Object.keys(event.location as JsonLdObject))
    if ((event.location as JsonLdObject)[k] === undefined)
      delete (event.location as JsonLdObject)[k]

  return event
}

export function dinnerToEventJsonLd(d: Dinner): JsonLdObject {
  const postal = parsePostalAddress((d as unknown as { address?: string }).address)

  const event: JsonLdObject = {
    '@type': 'FoodEvent',
    name: d.title ?? 'Sittning',
    startDate: d.date ? toLocalISOWithOffset(d.date as unknown as string) : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `https://pubquery.se/?dinner=${(d as unknown as { id?: string }).id ?? ''}`,
    description: (d as unknown as { description?: string }).description || undefined,
    image: (d as unknown as { image_url?: string }).image_url
      ? [(d as unknown as { image_url: string }).image_url]
      : undefined,
    location: {
      '@type': 'Place',
      name:
        (d as unknown as { venue_name?: string; location?: string }).venue_name ||
        (d as unknown as { location?: string }).location ||
        'Sittning',
      address: postal ?? (d as unknown as { address?: string }).address ?? undefined,
    } as JsonLdObject,
  }

  for (const k of Object.keys(event)) if (event[k] === undefined) delete event[k]
  for (const k of Object.keys(event.location as JsonLdObject))
    if ((event.location as JsonLdObject)[k] === undefined)
      delete (event.location as JsonLdObject)[k]

  return event
}

export function venueToJsonLd(venue: {
  name: string
  url?: string
  description?: string
  image?: string
  address?: string
  latitude?: number
  longitude?: number
  sameAs?: string[]
}): JsonLdObject {
  const data: JsonLdObject = {
    '@type': 'BarOrPub',
    name: venue.name,
    url: venue.url,
    description: venue.description,
    image: venue.image ? [venue.image] : undefined,
    address: venue.address,
    geo:
      venue.latitude && venue.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: venue.latitude,
            longitude: venue.longitude,
          }
        : undefined,
    sameAs: venue.sameAs && venue.sameAs.length ? venue.sameAs : undefined,
  }
  for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k]
  return data
}

export const ensureMeta = (selector: string, createEl: () => HTMLMetaElement): HTMLMetaElement => {
  const existing = document.head.querySelector(selector) as HTMLMetaElement | null
  if (existing) return existing
  const el = createEl()
  document.head.appendChild(el)
  return el
}
export const setNamed = (name: string, content: string) => {
  const el = ensureMeta(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('name', name)
    return m
  })
  el.setAttribute('content', content)
}
export const setProp = (prop: string, content: string) => {
  const el = ensureMeta(`meta[property="${prop}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('property', prop)
    return m
  })
  el.setAttribute('content', content)
}
export const ensureLink = (rel: string) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  return el
}
