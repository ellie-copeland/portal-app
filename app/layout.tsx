import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cloud Employee Portal',
  description: 'Agent management and collaboration platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
