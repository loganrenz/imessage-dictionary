import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Attribution & Licensing — Free Dictionary',
  description: 'Information about data sources and licensing for Free Dictionary',
}

export default function AttributionPage() {
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

        <header className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Attribution & Licensing
          </h1>
        </header>

        <div className="space-y-6">
          <section className="p-6 bg-card border-2 border-border rounded-lg">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4">
              Data Sources
            </h2>
            <div className="font-serif text-lg leading-relaxed text-foreground space-y-4">
              <p>
                This dictionary app demonstrates iMessage-optimized link previews
                with Open Graph images. The current dataset includes demo definitions
                for educational and demonstration purposes.
              </p>
              <p>
                <strong>Current Source:</strong> Demo Dataset
                <br />
                <strong>License:</strong> Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
              </p>
            </div>
          </section>

          <section className="p-6 bg-card border-2 border-border rounded-lg">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4">
              About CC BY-SA 4.0
            </h2>
            <div className="font-serif text-lg leading-relaxed text-foreground space-y-4">
              <p>This license allows you to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Share</strong> — copy and redistribute the material in any medium or format
                </li>
                <li>
                  <strong>Adapt</strong> — remix, transform, and build upon the material for any purpose
                </li>
              </ul>
              <p className="mt-4">Under the following terms:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Attribution</strong> — You must give appropriate credit and indicate if changes were made
                </li>
                <li>
                  <strong>ShareAlike</strong> — If you remix or transform the material, you must distribute your contributions under the same license
                </li>
              </ul>
            </div>
          </section>

          <section className="p-6 bg-card border-2 border-border rounded-lg">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4">
              Technical Implementation
            </h2>
            <div className="font-serif text-lg leading-relaxed text-foreground">
              <p>
                This application uses Vercel KV (Upstash Redis) for caching definitions
                with a 30-day TTL. Each definition is cached to provide fast response times
                and reduce load on the underlying data sources.
              </p>
            </div>
          </section>

          <section className="p-6 bg-card border-2 border-border rounded-lg">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4">
              Application License
            </h2>
            <div className="font-serif text-lg leading-relaxed text-foreground">
              <p>
                The Free Dictionary web application code is provided for demonstration
                purposes. All dictionary content is attributed to its respective sources
                and licensed accordingly.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-sans font-medium hover:opacity-90 transition-opacity"
          >
            Return to Dictionary
          </Link>
        </div>
      </div>
    </div>
  )
}
