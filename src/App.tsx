import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { HomePage } from './components/HomePage'
import { WordPage } from './components/WordPage'
import { AttributionPage } from './components/AttributionPage'
import { AdminPage } from './components/AdminPage'

type Route = 
  | { type: 'home' }
  | { type: 'word'; term: string; senseIndex: number }
  | { type: 'attribution' }
  | { type: 'admin' }

function parseRoute(pathname: string): Route {
  const normalizedPath = pathname.replace(/\/+$/, '')

  if (!normalizedPath || normalizedPath === '/') {
    return { type: 'home' }
  }

  const parts = normalizedPath.split('/').filter(Boolean)

  if (parts[0] === 'w') {
    const term = decodeURIComponent(parts[1] || '')
    if (!term) {
      return { type: 'home' }
    }
    let senseIndex = 0
    if (parts.length > 2 && parts[2]) {
      const parsedIndex = parseInt(parts[2], 10)
      if (!isNaN(parsedIndex) && parsedIndex >= 0) {
        senseIndex = parsedIndex
      }
    }
    return { type: 'word', term, senseIndex }
  }

  if (parts[0] === 'attribution') {
    return { type: 'attribution' }
  }

  if (parts[0] === 'admin') {
    return { type: 'admin' }
  }

  return { type: 'home' }
}

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname))
      window.scrollTo(0, 0)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToWord = (term: string, senseIndex?: number) => {
    const encodedTerm = encodeURIComponent(term)
    const path = senseIndex && senseIndex > 0 ? `/w/${encodedTerm}/${senseIndex}` : `/w/${encodedTerm}`
    window.history.pushState({}, '', path)
    setRoute({ type: 'word', term, senseIndex: senseIndex ?? 0 })
    window.scrollTo(0, 0)
  }

  const navigateHome = () => {
    window.history.pushState({}, '', '/')
    setRoute({ type: 'home' })
    window.scrollTo(0, 0)
  }

  const navigateToAttribution = () => {
    window.history.pushState({}, '', '/attribution')
    setRoute({ type: 'attribution' })
    window.scrollTo(0, 0)
  }

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin')
    setRoute({ type: 'admin' })
    window.scrollTo(0, 0)
  }

  return (
    <>
      {route.type === 'home' && (
        <HomePage onNavigateToWord={navigateToWord} onNavigateToAttribution={navigateToAttribution} />
      )}
      {route.type === 'word' && (
        <WordPage 
          term={route.term} 
          senseIndex={route.senseIndex} 
          onNavigateHome={navigateHome} 
          onNavigateToAttribution={navigateToAttribution}
          onNavigateToWord={navigateToWord}
        />
      )}
      {route.type === 'attribution' && (
        <AttributionPage onNavigateHome={navigateHome} />
      )}
      {route.type === 'admin' && (
        <AdminPage onNavigateHome={navigateHome} />
      )}
      <Toaster position="bottom-center" />
    </>
  )
}

export default App
