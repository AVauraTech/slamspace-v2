import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SlamSpace — Digital Slam Book',
  description: 'A nostalgic, AI-powered digital slam book. Share memories, leave signatures, and unlock time capsules.',
  keywords: ['slam book', 'nostalgia', 'friends', 'memories', 'yearbook'],
  openGraph: {
    title: 'SlamSpace — Digital Slam Book',
    description: 'Leave your mark, share memories, let AI write you a poem 💛',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Homemade+Apple&family=Indie+Flower&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="animated-bg paper-texture min-h-screen">
        {children}
      </body>
    </html>
  )
}
