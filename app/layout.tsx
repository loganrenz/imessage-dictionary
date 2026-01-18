import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Free Dictionary',
  description: 'Share word definitions with beautiful iMessage previews',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
