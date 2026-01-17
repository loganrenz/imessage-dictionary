import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, BookOpen } from '@phosphor-icons/react'

interface AttributionPageProps {
  onNavigateHome: () => void
}

export function AttributionPage({ onNavigateHome }: AttributionPageProps) {
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

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={40} weight="duotone" className="text-primary" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary tracking-tight">
              Attribution & Licensing
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-card border-2">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4">
              Data Sources
            </h2>
            <div className="font-serif text-lg leading-relaxed text-foreground space-y-4">
              <p>
                This dictionary app is built to demonstrate iMessage-optimized link previews
                with Open Graph images. The current dataset includes demo definitions for
                educational and demonstration purposes.
              </p>
              <p>
                <strong>Current Source:</strong> Demo Dataset
                <br />
                <strong>License:</strong> Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-2">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4">
              About CC BY-SA 4.0
            </h2>
            <div className="font-serif text-lg leading-relaxed text-foreground space-y-4">
              <p>
                This license allows you to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Share</strong> — copy and redistribute the material in any medium or format</li>
                <li><strong>Adapt</strong> — remix, transform, and build upon the material for any purpose</li>
              </ul>
              <p className="mt-4">
                Under the following terms:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Attribution</strong> — You must give appropriate credit and indicate if changes were made</li>
                <li><strong>ShareAlike</strong> — If you remix or transform the material, you must distribute your contributions under the same license</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6 bg-card border-2">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4">
              Future Data Sources
            </h2>
            <div className="font-serif text-lg leading-relaxed text-foreground">
              <p>
                This application is designed to support integration with various open dictionary
                sources including Wiktionary, WordNet, and other CC-licensed lexical databases.
                Each entry displays its source and license clearly, both on the web page and in
                generated Open Graph images.
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-card border-2">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4">
              Application License
            </h2>
            <div className="font-serif text-lg leading-relaxed text-foreground">
              <p>
                The Free Dictionary web application itself (code, design, and infrastructure)
                is provided for demonstration purposes. All dictionary content is attributed
                to its respective sources and licensed accordingly.
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Button onClick={onNavigateHome} size="lg" className="font-sans">
            Return to Dictionary
          </Button>
        </div>
      </div>
    </div>
  )
}
