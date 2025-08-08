
export type Pub = {
  event_id: number
  organization_id: number
  title: string
  date: string
  auto_created: number
  fb_page: string
  fb_link: string
  venue_name: string
  location: string
  location_group?: string
  max_capacity: number
  visible: boolean
  ratio_visible: boolean
  member_count: number
  non_member_count: number
  line_length: string
  total_attendance: number
  description: string
  display_name: string
  beer_price?: number
  cider_price?: number
  drink_price?: number
  address: string
  maps_link: string
  patches: number
  logo_url: string
}
