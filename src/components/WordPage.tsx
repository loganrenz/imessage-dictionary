import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Copy, Share, ArrowLeft, BookOpen } from '@phosphor-icons/react'
import { getEntryByTerm } from '@/lib/dictionary'
import type { DictionaryEntry } from '@/lib/types'
import { toast } from 'sonner'

interface WordPageProps {
  term: string
  senseIndex?: number
  onNavigateHome: () => void
}

export function WordPage({ term, senseIndex = 0, onNavigateHome }: WordPageProps) {
  const [entry, setEntry] = useState<DictionaryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  // Track which sense to highlight/focus
  const [activeSenseIndex, setActiveSenseIndex] = useState(senseIndex)

  // Helper to clamp sense index to valid range
  const getValidSenseIndex = (entry: DictionaryEntry, idx: number): number => {
    return Math.max(0, Math.min(idx, entry.senses.length - 1))
  }

  useEffect(() => {
    setLoading(true)
    const foundEntry = getEntryByTerm(term)
    setEntry(foundEntry || null)
    setLoading(false)
    
    // Validate senseIndex is within bounds
    if (foundEntry) {
      setActiveSenseIndex(getValidSenseIndex(foundEntry, senseIndex))
    }

    if (foundEntry) {
      document.title = `${foundEntry.term} — Free Dictionary`
      updateMetaTags(foundEntry, senseIndex)
    }
  }, [term, senseIndex])

  const updateMetaTags = (entry: DictionaryEntry, senseIdx: number) => {
    const validSenseIdx = getValidSenseIndex(entry, senseIdx)
    const sense = entry.senses[validSenseIdx]
    
    const setMeta = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('property', property)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    const setMetaName = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('name', name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Use static OG image path - for sense 0: term.png, for others: term-N.png
    let imageFilename
    if (validSenseIdx === 0) {
      imageFilename = `${encodeURIComponent(entry.term)}.png`
    } else {
      imageFilename = `${encodeURIComponent(entry.term)}-${validSenseIdx}.png`
    }
    const imageUrl = `${window.location.origin}/og/${imageFilename}`

    // Include part of speech in title if available
    const posLabel = sense.pos ? ` (${sense.pos})` : ''
    const title = `${entry.term}${posLabel} — definition`

    setMeta('og:title', title)
    setMeta('og:type', 'website')
    setMeta('og:image', imageUrl)
    setMeta('og:image:width', '1200')
    setMeta('og:image:height', '630')
    setMeta('og:url', window.location.href)
    setMeta('og:description', sense.gloss)
    
    setMetaName('twitter:card', 'summary_large_image')
    setMetaName('twitter:image', imageUrl)
    setMetaName('twitter:title', title)
    setMetaName('twitter:description', sense.gloss)
  }

  const handleCopyLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    if (navigator.share && entry) {
      const sense = entry.senses[activeSenseIndex]
      try {
        await navigator.share({
          title: `${entry.term} — definition`,
          text: sense.gloss,
          url: window.location.href,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share')
        }
      }
    } else {
      handleCopyLink()
    }
  }

  const handleShareSense = async (index: number) => {
    if (!entry) return
    const sense = entry.senses[index]
    
    // Build the URL for this specific sense
    let url: string
    if (index === 0) {
      url = `${window.location.origin}/#/w/${encodeURIComponent(entry.term)}`
    } else {
      url = `${window.location.origin}/#/w/${encodeURIComponent(entry.term)}/${index}`
    }
    
    // Create descriptive label for toast message
    const senseLabel = sense.pos || `definition ${index + 1}`
    
    try {
      await navigator.clipboard.writeText(url)
      toast.success(`Link to "${senseLabel}" copied!`)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 font-sans text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-6 py-12">
          <Button
            variant="ghost"
            onClick={onNavigateHome}
            className="mb-8 gap-2 font-sans"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Button>

          <Card className="p-12 text-center bg-card border-2">
            <BookOpen size={64} weight="duotone" className="mx-auto mb-4 text-muted-foreground" />
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
              Word Not Found
            </h1>
            <p className="font-sans text-lg text-muted-foreground mb-6">
              We couldn't find a definition for "{term}".
            </p>
            <Button onClick={onNavigateHome} className="font-sans">
              Search for another word
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={onNavigateHome}
          className="mb-8 gap-2 font-sans"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Button>

        <article className="mb-8">
          <header className="mb-8">
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary mb-4 tracking-tight">
              {entry.term}
            </h1>
          </header>

          <div className="space-y-8">
            {entry.senses.map((sense, index) => (
              <Card 
                key={index} 
                className={`p-6 bg-card border-2 ${index === activeSenseIndex ? 'ring-2 ring-accent' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {sense.pos && (
                      <div className="font-sans text-sm uppercase tracking-widest text-accent font-medium mb-3">
                        {sense.pos}
                      </div>
                    )}
                    <p className="font-serif text-xl leading-relaxed text-foreground mb-4">
                      {sense.gloss}
                    </p>
                    {sense.example && (
                      <div className="pl-4 border-l-4 border-accent/30">
                        <p className="font-serif text-lg italic text-muted-foreground">
                          "{sense.example}"
                        </p>
                      </div>
                    )}
                  </div>
                  {entry.senses.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareSense(index)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      title="Copy link to this definition"
                    >
                      <Copy size={16} />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </article>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button
            onClick={handleCopyLink}
            size="lg"
            variant="default"
            className="flex-1 gap-2 font-sans bg-primary hover:bg-primary/90"
          >
            <Copy size={20} />
            Copy Link
          </Button>
          <Button
            onClick={handleShare}
            size="lg"
            variant="default"
            className="flex-1 gap-2 font-sans bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Share size={20} />
            Share
          </Button>
        </div>

        <footer className="pt-8 border-t border-border">
          <p className="font-sans text-sm text-muted-foreground">
            Source: {entry.source} • {entry.license}
            <br />
            <a 
              href="#/attribution" 
              className="text-accent hover:underline"
              onClick={(e) => {
                e.preventDefault()
                window.location.hash = '/attribution'
              }}
            >
              View full attribution
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
