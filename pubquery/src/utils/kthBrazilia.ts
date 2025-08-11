// src/utils/kthBrazilia.ts
import type { Pub } from '@/types/Pub'

// Stable sort
export function sortByDateAsc(a: { date: string }, b: { date: string }) {
  return new Date(a.date).getTime() - new Date(b.date).getTime()
}

// Stockholm “today” in YYYY-MM-DD
export function todayYMDStockholm(d = new Date()) {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  // sv-SE gives "YYYY-MM-DD"
  return fmt.format(d)
}

export function isWeekdayStockholm(d = new Date()) {
  const s = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }))
  const day = s.getDay() // 0=Sun..6=Sat
  return day >= 1 && day <= 5
}

export function buildFakeBraziliaPub(today: string): Pub {
  return {
    event_id: -1, // unique negative id so keys don’t collide
    organization_id: 21,
    title: 'AW På Brazilia',
    date: `${today}T15:00:00`, // fixed 15:00
    auto_created: 1,
    fb_page: '100083651442252',
    fb_link: '',
    venue_name: 'Brazilia',
    location: 'KTH - Valhallavägen',
    location_group: 'KTH',
    max_capacity: 0,
    line_length: 'no_line',
    total_attendance: undefined,
    description: 'Välkommen på AW!',
    display_name: 'Brazilia',
    beer_price: 35,
    cider_price: 53,
    drink_price: undefined,
    address: 'Brinellvägen 64B, 114 28 Stockholm, Sweden',
    maps_link: 'https://maps.google.com/?q=Brazilia%20KTH',
    patches: 0,
    logo_url: 'https://pubquery-images.fra1.digitaloceanspaces.com/org-logos/21-1754500041842.jpg', // or any fallback you have
  }
}

function looksLikeBrazilia(p: Pub) {
  return (
    /brazilia/i.test(p.venue_name ?? '') ||
    /brazilia/i.test(p.display_name ?? '') ||
    /brazilia/i.test(p.title ?? '')
  )
}

/**
 * Returns KTH pubs with a synthetic Brazilia card inserted at index 1 (position #2)
 * on weekdays for *today*, unless a real Brazilia already exists for today.
 */
export function prepareKthPubsWithBrazilia(
  pubs: Pub[],
  {
    today = todayYMDStockholm(),
    injectOnWeekdaysOnly = true,
  }: { today?: string; injectOnWeekdaysOnly?: boolean } = {}
) {
  const kth = pubs
    .filter((p) => p.location?.toLowerCase().startsWith('kth'))
    .sort(sortByDateAsc)

  const hasBraziliaToday =
    kth.some(looksLikeBrazilia) && kth.some((p) => (p.date || '').startsWith(today))

  const shouldInject =
    (!injectOnWeekdaysOnly || isWeekdayStockholm()) && !hasBraziliaToday

  if (!shouldInject) return kth

  const arr = kth.slice()
  arr.splice(1, 0, buildFakeBraziliaPub(today)) // position #2
  return arr
}
