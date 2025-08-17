// scripts/generate-sitemap.mjs
import fs from "node:fs/promises"

const ORIGIN = process.env.SITE_ORIGIN || "https://pubquery.se" // set in CI for prod
const API_URL = process.env.SITEMAP_API_URL || `${ORIGIN}/api/organizations/withVenues`

function slugify(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-åäö]/g, "")
}

function isoDate(d = new Date()) {
  return new Date(d).toISOString()
}

const STATIC_ROUTES = [
  { loc: `${ORIGIN}/`,                            changefreq: "daily",  priority: "0.9" },
  { loc: `${ORIGIN}/organizations`,               changefreq: "weekly", priority: "0.8" },
  { loc: `${ORIGIN}/kth`,       changefreq: "daily",  priority: "0.8" },
  { loc: `${ORIGIN}/su`,        changefreq: "daily",  priority: "0.8" },
  // add other important static pages here…
]

async function main() {
  // 1) Fetch the data
  const res = await fetch(API_URL, { headers: { "accept": "application/json" } })
  if (!res.ok) throw new Error(`Failed to fetch orgs for sitemap: HTTP ${res.status}`)
  const orgs = await res.json()

  // 2) Build <urlset>
  const today = isoDate()
  const urlEntries = []

  // Static pages
  for (const r of STATIC_ROUTES) {
    urlEntries.push(`
  <url>
    <loc>${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`.trim())
  }

  // Dynamic org pages (/org/:id-:display-:venue)
  for (const o of orgs) {
    const slug = `${o.organization_id}-${slugify(o.display_name || o.organization_name || "")}-${slugify(o.venue_name || "")}`
    // If you have updated_at per org in the payload, use it; fall back to today
    const lastmod = o.updated_at ? isoDate(o.updated_at) : today
    urlEntries.push(`
  <url>
    <loc>${ORIGIN}/org/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`.trim())
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urlEntries.join("\n")}
</urlset>
`

  // 3) Write to /public so Vite serves it as-is
  await fs.mkdir("public", { recursive: true })
  await fs.writeFile("public/sitemap.xml", xml, "utf8")
  console.log(`✓ Wrote public/sitemap.xml with ${urlEntries.length} URLs`)
}

main().catch((err) => {
  console.error("Sitemap generation failed:", err)
  process.exit(1)
})
