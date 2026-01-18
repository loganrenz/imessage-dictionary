import { useEffect, useRef, useState } from 'react'
import { getEntryByTerm } from '@/lib/dictionary'
import type { DictionaryEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from '@phosphor-icons/react'

interface OGImagePageProps {
  term: string
  onNavigateHome: () => void
}

export function OGImagePage({ term, onNavigateHome }: OGImagePageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [entry, setEntry] = useState<DictionaryEntry | null>(null)
  const [imageReady, setImageReady] = useState(false)

  useEffect(() => {
    const foundEntry = getEntryByTerm(term.replace('.png', ''))
    setEntry(foundEntry || null)
  }, [term])

  useEffect(() => {
    if (!entry || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1200
    canvas.height = 630

    ctx.fillStyle = '#f5f3f0'
    ctx.fillRect(0, 0, 1200, 630)

    ctx.fillStyle = '#1e2f50'
    ctx.font = 'bold 96px "Crimson Pro", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    
    const termText = entry.term
    ctx.fillText(termText, 600, 100)

    if (entry.senses[0].pos) {
      ctx.fillStyle = '#c5914a'
      ctx.font = '600 28px "Inter", sans-serif'
      ctx.letterSpacing = '0.08em'
      ctx.fillText(entry.senses[0].pos.toUpperCase(), 600, 220)
    }

    const gloss = entry.senses[0].gloss
    ctx.fillStyle = '#1e2f50'
    ctx.font = 'bold 52px "Crimson Pro", serif'
    ctx.textAlign = 'center'
    
    const maxWidth = 1050
    const lineHeight = 68
    const words = gloss.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
      
      if (lines.length >= 2) break
    }
    
    if (currentLine && lines.length < 2) {
      lines.push(currentLine)
    }
    
    if (lines.length === 2) {
      const fullText = lines.join(' ')
      if (gloss !== fullText && !gloss.startsWith(fullText + ' ')) {
        lines[1] = lines[1].trim() + '...'
      }
    }

    const startY = entry.senses[0].pos ? 280 : 240
    lines.forEach((line, index) => {
      ctx.fillText(line, 600, startY + index * lineHeight)
    })

    ctx.fillStyle = '#72757e'
    ctx.font = '400 16px "Inter", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Source: ${entry.source} • ${entry.license}`, 600, 580)

    setImageReady(true)
  }, [entry])

  const handleDownload = () => {
    if (!canvasRef.current) return
    
    const url = canvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${term}-og-image.png`
    link.href = url
    link.click()
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
          
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
              Word Not Found
            </h1>
            <p className="font-sans text-muted-foreground">
              Cannot generate Open Graph image for unknown word.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={onNavigateHome}
          className="mb-8 gap-2 font-sans"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-primary mb-2">
            Open Graph Image Preview
          </h1>
          <p className="font-sans text-lg text-muted-foreground">
            This is how "{entry.term}" will appear when shared in iMessage and other social platforms.
          </p>
        </div>

        <div className="space-y-6">
          <div className="border-4 border-border rounded-lg overflow-hidden bg-card">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ aspectRatio: '1200/630' }}
            />
          </div>

          {imageReady && (
            <div className="flex justify-center">
              <Button onClick={handleDownload} size="lg" className="gap-2 font-sans">
                <Download size={20} />
                Download Image
              </Button>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-6">
            <h2 className="font-sans text-sm uppercase tracking-wider text-muted-foreground mb-3 font-medium">
              Image Specifications
            </h2>
            <ul className="font-sans text-sm text-foreground space-y-2">
              <li>• Dimensions: 1200 × 630 pixels (optimal for social sharing)</li>
              <li>• Format: PNG with high-quality rendering</li>
              <li>• Typography: Crimson Pro (serif) with bold, large definition text (52px)</li>
              <li>• Definition text designed to be as readable as the word title for iMessage previews</li>
              <li>• High contrast for mobile thumbnail legibility</li>
              <li>• Includes source attribution in footer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
