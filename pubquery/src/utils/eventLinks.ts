// src/utils/eventLinks.ts
import type { Pub } from '@/types/Pub'
import type { NavigateFunction, Location } from 'react-router-dom'

export type PackedSynthetic = {
  synthetic: true
  event_id: number | null
  title?: string | null
  description?: string | null
  date?: string | null
  fb_link?: string | null
  fb_page?: string | null
  logo_url?: string | null
  display_name?: string | null
  venue_name?: string | null
  location?: string | null
  address?: string | null
  beer_price?: number | null
  cider_price?: number | null
  drink_price?: number | null
}

export function slugify(text = '') {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-åäö]/g, '')
}

export function base64UrlEncode(s: string) {
  const b64 = btoa(unescape(encodeURIComponent(s)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function base64UrlEncodeObject(obj: unknown) {
  return base64UrlEncode(JSON.stringify(obj))
}

export function isNumericEventId(event_id: unknown): boolean {
  const n = Number(event_id)
  return Number.isFinite(n) && n > 0
}

export function isSynthetic(pub: Pub): boolean {
  // Treat non-positive or non-numeric IDs as synthetic
  return !isNumericEventId(pub.event_id)
}

export function packSynthetic(pub: Pub): PackedSynthetic {
  const {
    event_id,
    title,
    description,
    date,
    fb_link,
    fb_page,
    logo_url,
    display_name,
    venue_name,
    location,
    address,
    beer_price,
    cider_price,
    drink_price,
  } = pub
  return {
    synthetic: true,
    event_id: event_id ?? null,
    title,
    description,
    date,
    fb_link,
    fb_page,
    logo_url,
    display_name,
    venue_name,
    location,
    address,
    beer_price,
    cider_price,
    drink_price,
  }
}

/** `/event/{id}-{title}-{venue}` for real events */
export function eventHref(pub: Pub): string {
  const id = pub.event_id
  const titleSlug = slugify(pub.title || pub.display_name || '')
  const venueSlug = slugify(pub.venue_name || pub.location || '')
  return `/event/${id}-${titleSlug}-${venueSlug}`
}

/** `/event/synth-{slug}?data=...` for synthetic */
export function syntheticHref(pub: Pub): string {
  const key =
    (pub.date || '') + '-' + (pub.venue_name || pub.display_name || pub.title || 'brazilia')
  const slug = `synth-${slugify(key)}`
  const data = base64UrlEncodeObject(packSynthetic(pub))
  return `/event/${slug}?data=${data}`
}

/** Choose the correct href based on real/synthetic */
export function hrefForPub(pub: Pub): string {
  return isSynthetic(pub) ? syntheticHref(pub) : eventHref(pub)
}

/** Share path mimics hrefForPub, but keep legacy compatibility if needed */
export function buildSharePath(pub: Pub): string {
  return hrefForPub(pub)
}

/** Full share metadata */
export function getShareParts(pub: Pub, origin = window.location.origin) {
  const path = buildSharePath(pub)
  const url = `${origin}${path}`
  const title = pub.title || pub.venue_name || 'Studentpub'
  const text = `${pub.display_name ? pub.display_name + ' – ' : ''}${pub.venue_name || pub.location || ''}`
  return { path, url, title, text }
}

/**
 * Router-friendly link props:
 * - Gives you the href
 * - onClick that respects cmd/ctrl/middle-click
 * - Carries backgroundLocation + returnTo
 * - For synthetic events also passes the pub in state for a fast modal open
 */
export function createPubLinkProps(pub: Pub, locationObj: Location, navigate: NavigateFunction) {
  const href = hrefForPub(pub)

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // allow new tab/window behavior
    if (e.metaKey || e.ctrlKey || e.button === 1) return
    e.preventDefault()
    const returnTo = locationObj.pathname + locationObj.search
    if (isSynthetic(pub)) {
      navigate(href, {
        state: { backgroundLocation: locationObj, returnTo, pub },
      })
    } else {
      navigate(href, {
        state: { backgroundLocation: locationObj, returnTo },
      })
    }
  }

  return { href, onClick }
}
