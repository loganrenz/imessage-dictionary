import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { HomePage } from './components/HomePage'
import { WordPage } from './components/WordPage'
import { AttributionPage } from './components/AttributionPage'
import { OGImagePage } from './components/OGImagePage'
import { AdminPage } from './components/AdminPage'

type Route = 
  | { type: 'home' }
  | { type: 'word'; term: string }
  | { type: 'attribution' }
  | { type: 'og-image'; term: string }
  | { type: 'admin' }

function parseRoute(hash: string): Route {
  if (!hash || hash === '#/' || hash === '#') {
    return { type: 'home' }
  }

  if (hash.startsWith('#/w/')) {
    const term = decodeURIComponent(hash.substring(4))
    return { type: 'word', term }
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

  const navigateToWord = (term: string) => {
    window.location.hash = `/w/${encodeURIComponent(term)}`
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
        <WordPage term={route.term} onNavigateHome={navigateHome} />
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