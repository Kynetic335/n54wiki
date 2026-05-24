import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://n54wiki.com'),
  title: {
    template: '%s | N54 Wiki',
    default: 'N54 Wiki — BMW N54 Tuning, Diagnostics & Upgrades',
  },
  description:
    'The BMW N54 tuning wiki. Engine guides, stage upgrade paths, datalogging, diagnostics, and hardware references — powered by Synergy BMW Tuning.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'N54 Wiki',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>{children}</body>
    </html>
  )
}
