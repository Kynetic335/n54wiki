import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | N54 Tune Program',
    default: 'N54 Tune Program — Synergy BMW Tuning',
  },
  description:
    'Synergy BMW Tuning N54 Tune Program — select your ROM, fuel, stage, and turbo type to receive a protected base tune package.',
}

export default function TuneProgramLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: '#f0f0f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {children}
    </div>
  )
}
