import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function Canonical() {
  const location = useLocation()

  useEffect(() => {
    const canonicalUrl = `https://pubquery.se${location.pathname}`
    let link = document.querySelector("link[rel='canonical']")

    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }

    link.setAttribute('href', canonicalUrl)
  }, [location.pathname])

  return null
}
