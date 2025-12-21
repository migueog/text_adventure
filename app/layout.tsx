import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ctesiphus Expedition - Kill Team Campaign Manager',
  description: 'A digital campaign manager for the Kill Team Ctesiphus Expedition narrative campaign',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
