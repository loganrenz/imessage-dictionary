import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MagnifyingGlass, Shuffle, BookOpen } from '@phosphor-icons/react'
import { searchEntries, getRandomEntry } from '@/lib/dictionary'
import type { DictionaryEntry } from '@/lib/types'

interface HomePageProps {
  onNavigateToWord: (term: string) => void
}

export function HomePage({ onNavigateToWord }: HomePageProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DictionaryEntry[]>([])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.trim()) {
      const searchResults = searchEntries(value)
      setResults(searchResults)
    } else {
      setResults([])
    }
  }

  const handleRandomWord = () => {
    const randomEntry = getRandomEntry()
    onNavigateToWord(randomEntry.term)
  }

  const popularWords = ['serendipity', 'ephemeral', 'eloquent', 'paradigm', 'ubiquitous', 'resilient', 'empathy', 'innovative']

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen size={48} weight="duotone" className="text-primary" />
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary tracking-tight">
              Free Dictionary
            </h1>
          </div>
          <p className="text-xl text-muted-foreground font-sans">
            Share beautiful word definitions in iMessage
          </p>
        </header>

        <div className="mb-8">
          <div className="relative">
            <MagnifyingGlass 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" 
              size={24} 
            />
            <Input
              id="search-input"
              type="text"
              placeholder="Search for a word..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 h-14 text-lg font-serif bg-card border-2 focus:border-accent"
            />
          </div>
          
          {results.length > 0 && (
            <Card className="mt-4 p-2 bg-card border-2">
              <div className="space-y-1">
                {results.map((entry) => (
                  <button
                    key={entry.term}
                    onClick={() => {
                      onNavigateToWord(entry.term)
                      setQuery('')
                      setResults([])
                    }}
                    className="w-full text-left px-4 py-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="font-serif font-semibold text-lg text-foreground">
                      {entry.term}
                    </div>
                    <div className="font-sans text-sm text-muted-foreground line-clamp-1">
                      {entry.senses[0].gloss}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex justify-center mb-16">
          <Button
            onClick={handleRandomWord}
            size="lg"
            className="gap-2 h-12 px-6 text-base font-sans font-medium bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Shuffle size={20} />
            Random Word
          </Button>
        </div>

        <section>
          <h2 className="font-sans text-sm uppercase tracking-wider text-muted-foreground mb-4 font-medium">
            Popular Words
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularWords.map((word) => (
              <button
                key={word}
                onClick={() => onNavigateToWord(word)}
                className="px-4 py-3 bg-card border-2 border-border rounded-lg hover:border-accent transition-colors text-left"
              >
                <span className="font-serif text-lg font-semibold text-foreground">
                  {word}
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-border text-center">
          <p className="font-sans text-sm text-muted-foreground">
            All definitions from Demo Dataset under CC BY-SA 4.0
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
