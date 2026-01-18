import Link from 'next/link'
import { getAllTerms } from '@/lib/define'

export default function HomePage() {
  const terms = getAllTerms().slice(0, 20) // Show first 20 terms
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12 text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary mb-4 tracking-tight">
            Free Dictionary
          </h1>
          <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto">
            Share word definitions with beautiful iMessage previews. 
            Each word link shows a readable definition card right in the message thread.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="font-sans text-sm uppercase tracking-widest text-accent font-medium mb-6">
            Browse Words
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {terms.map((term) => (
              <Link
                key={term}
                href={`/w/${encodeURIComponent(term)}`}
                className="block p-4 bg-card border-2 border-border rounded-lg hover:border-accent transition-colors"
              >
                <span className="font-serif text-lg text-foreground capitalize">
                  {term}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="pt-8 border-t border-border text-center">
          <p className="font-sans text-sm text-muted-foreground">
            <Link href="/attribution" className="text-accent hover:underline">
              Attribution & Licensing
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
