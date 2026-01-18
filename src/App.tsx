import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { HomePage } from './components/HomePage'
import { WordPage } from './components/WordPage'
import { AttributionPage } from './components/AttributionPage'
import { OGImagePage } from './components/OGImagePage'
import { AdminPage } from './components/AdminPage'

type Route = 
  | { type: 'home' }
  | { type: 'word'; term: string; senseIndex: number }
  | { type: 'attribution' }
  | { type: 'og-image'; term: string }
  | { type: 'admin' }

function parseRoute(hash: string): Route {
  if (!hash || hash === '#/' || hash === '#') {
    return { type: 'home' }
  }

  if (hash.startsWith('#/w/')) {
    // Parse word route: #/w/term or #/w/term/senseIndex
    const path = hash.substring(4) // Remove '#/w/'
    const parts = path.split('/')
    const term = decodeURIComponent(parts[0])
    
    // Check if there's a sense index (second part of the path)
    let senseIndex = 0
    if (parts.length > 1 && parts[1]) {
      const parsedIndex = parseInt(parts[1], 10)
      if (!isNaN(parsedIndex) && parsedIndex >= 0) {
        senseIndex = parsedIndex
      }
    }
    
    return { type: 'word', term, senseIndex }
  }

  if (hash === '#/attribution') {
    return { type: 'attribution' }
  }

  if (hash.startsWith('#/og/')) {
    const term = decodeURIComponent(hash.substring(5))
    return { type: 'og-image', term }
  }

  if (hash === '#/admin') {
    return { type: 'admin' }
  }

  return { type: 'home' }
}

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateToWord = (term: string, senseIndex?: number) => {
    if (senseIndex && senseIndex > 0) {
      window.location.hash = `/w/${encodeURIComponent(term)}/${senseIndex}`
    } else {
      window.location.hash = `/w/${encodeURIComponent(term)}`
    }
  }

  const navigateHome = () => {
    window.location.hash = '/'
  }

  return (
    <>
      {route.type === 'home' && (
        <HomePage onNavigateToWord={navigateToWord} />
      )}
      {route.type === 'word' && (
        <WordPage 
          term={route.term} 
          senseIndex={route.senseIndex} 
          onNavigateHome={navigateHome} 
        />
      )}
      {route.type === 'attribution' && (
        <AttributionPage onNavigateHome={navigateHome} />
      )}
      {route.type === 'og-image' && (
        <OGImagePage term={route.term} onNavigateHome={navigateHome} />
      )}
      {route.type === 'admin' && (
        <AdminPage onNavigateHome={navigateHome} />
      )}
      <Toaster position="bottom-center" />
    </>
  )
}

export default App