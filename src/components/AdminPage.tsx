import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Plus, PencilSimple, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@github/spark/hooks'
import type { DictionaryEntry } from '@/lib/types'

interface AdminPageProps {
  onNavigateHome: () => void
}

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'demo-admin-token'

export function AdminPage({ onNavigateHome }: AdminPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [customEntries, setCustomEntries] = useKV<DictionaryEntry[]>('custom-entries', [])
  
  const [formTerm, setFormTerm] = useState('')
  const [formPos, setFormPos] = useState('')
  const [formGloss, setFormGloss] = useState('')
  const [formExample, setFormExample] = useState('')
  const [formSource, setFormSource] = useState('Custom Entry')
  const [formLicense, setFormLicense] = useState('CC BY-SA 4.0')

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('admin-authenticated')
    if (storedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput === ADMIN_TOKEN) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin-authenticated', 'true')
      toast.success('Authentication successful')
    } else {
      toast.error('Invalid admin token')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formTerm.trim() || !formGloss.trim()) {
      toast.error('Term and definition are required')
      return
    }

    const newEntry: DictionaryEntry = {
      term: formTerm.toLowerCase().trim(),
      senses: [
        {
          pos: formPos.trim() || undefined,
          gloss: formGloss.trim(),
          example: formExample.trim() || undefined,
        },
      ],
      source: formSource.trim(),
      license: formLicense.trim(),
      updatedAt: new Date().toISOString(),
    }

    setCustomEntries((current) => {
      const entries = current || []
      const existingIndex = entries.findIndex(
        (e) => e.term.toLowerCase() === newEntry.term.toLowerCase()
      )
      
      if (existingIndex >= 0) {
        const updated = [...entries]
        updated[existingIndex] = newEntry
        toast.success('Entry updated successfully')
        return updated
      } else {
        toast.success('Entry added successfully')
        return [...entries, newEntry]
      }
    })

    setFormTerm('')
    setFormPos('')
    setFormGloss('')
    setFormExample('')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto px-6 py-12">
          <Button
            variant="ghost"
            onClick={onNavigateHome}
            className="mb-8 gap-2 font-sans"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Button>

          <Card className="p-8 bg-card border-2">
            <h1 className="font-serif text-3xl font-bold text-primary mb-6">
              Admin Access
            </h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="admin-password" className="font-sans">
                  Admin Token
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin token"
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full font-sans">
                Login
              </Button>
            </form>
            <p className="mt-4 font-sans text-sm text-muted-foreground text-center">
              Set VITE_ADMIN_TOKEN environment variable
            </p>
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

        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-primary mb-2">
            Dictionary Admin
          </h1>
          <p className="font-sans text-lg text-muted-foreground">
            Add or update dictionary entries
          </p>
        </div>

        <Card className="p-6 mb-8 bg-card border-2">
          <h2 className="font-sans text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Plus size={24} />
            Add / Update Entry
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="term" className="font-sans">
                  Term *
                </Label>
                <Input
                  id="term"
                  value={formTerm}
                  onChange={(e) => setFormTerm(e.target.value)}
                  placeholder="e.g., serendipity"
                  required
                  className="font-serif text-lg"
                />
              </div>

              <div>
                <Label htmlFor="pos" className="font-sans">
                  Part of Speech
                </Label>
                <Input
                  id="pos"
                  value={formPos}
                  onChange={(e) => setFormPos(e.target.value)}
                  placeholder="e.g., noun, verb, adjective"
                  className="font-sans"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gloss" className="font-sans">
                Definition *
              </Label>
              <Textarea
                id="gloss"
                value={formGloss}
                onChange={(e) => setFormGloss(e.target.value)}
                placeholder="Enter the definition..."
                required
                rows={3}
                className="font-serif text-lg"
              />
            </div>

            <div>
              <Label htmlFor="example" className="font-sans">
                Example Sentence
              </Label>
              <Textarea
                id="example"
                value={formExample}
                onChange={(e) => setFormExample(e.target.value)}
                placeholder="Enter an example sentence..."
                rows={2}
                className="font-serif"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="source" className="font-sans">
                  Source *
                </Label>
                <Input
                  id="source"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="e.g., Wiktionary"
                  required
                  className="font-sans"
                />
              </div>

              <div>
                <Label htmlFor="license" className="font-sans">
                  License *
                </Label>
                <Input
                  id="license"
                  value={formLicense}
                  onChange={(e) => setFormLicense(e.target.value)}
                  placeholder="e.g., CC BY-SA 4.0"
                  required
                  className="font-sans"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full gap-2 font-sans">
              <Check size={20} />
              Save Entry
            </Button>
          </form>
        </Card>

        {(customEntries && customEntries.length > 0) && (
          <Card className="p-6 bg-card border-2">
            <h2 className="font-sans text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <PencilSimple size={24} />
              Custom Entries ({customEntries.length})
            </h2>
            <div className="space-y-3">
              {customEntries.map((entry, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted rounded-lg"
                >
                  <div className="font-serif text-xl font-semibold text-primary mb-1">
                    {entry.term}
                  </div>
                  {entry.senses[0].pos && (
                    <div className="font-sans text-xs uppercase tracking-wider text-accent mb-2">
                      {entry.senses[0].pos}
                    </div>
                  )}
                  <div className="font-serif text-base text-foreground">
                    {entry.senses[0].gloss}
                  </div>
                  <div className="font-sans text-sm text-muted-foreground mt-2">
                    {entry.source} • {entry.license}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
