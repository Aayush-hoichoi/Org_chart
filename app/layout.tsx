import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hoichoi Org Chart',
  description: 'Organisation chart for Hoichoi, Hoichoi BD, LoglineAI & Sooper',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
