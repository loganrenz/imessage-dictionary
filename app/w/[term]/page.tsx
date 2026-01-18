import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { define } from '@/lib/define'

interface PageProps {
  params: Promise<{ term: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { term } = await params
  const decodedTerm = decodeURIComponent(term)
  const definition = await define(decodedTerm)
  
  if (!definition) {
    return {
      title: 'Word Not Found — Free Dictionary',
    }
  }
  
  const ogImageUrl = `/api/og?term=${encodeURIComponent(definition.term)}`
  
  return {
    title: `${definition.term} — Free Dictionary`,
    description: definition.senses[0].gloss,
    openGraph: {
      title: `${definition.term} — definition`,
      description: definition.senses[0].gloss,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Definition of ${definition.term}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${definition.term} — definition`,
      description: definition.senses[0].gloss,
      images: [ogImageUrl],
    },
  }
}

export default async function WordPage({ params }: PageProps) {
  const { term } = await params
  const decodedTerm = decodeURIComponent(term)
  const definition = await define(decodedTerm)
  
  if (!definition) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-sans text-muted-foreground hover:text-foreground mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <article className="mb-8">
          <header className="mb-8">
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary mb-4 tracking-tight">
              {definition.term}
            </h1>
          </header>

          <div className="space-y-8">
            {definition.senses.map((sense, index) => (
              <div key={index} className="p-6 bg-card border-2 border-border rounded-lg">
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
                      &ldquo;{sense.example}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>

        <footer className="pt-8 border-t border-border">
          <p className="font-sans text-sm text-muted-foreground">
            Source: {definition.source} • {definition.license}
            <br />
            <Link href="/attribution" className="text-accent hover:underline">
              View full attribution
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
