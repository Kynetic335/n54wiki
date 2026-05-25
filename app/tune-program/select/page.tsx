import type { Metadata } from 'next'
import { TuneProgramHeader } from '@/components/tune-program/TuneProgramHeader'
import { TuneFileSelector } from '@/components/tune-program/TuneFileSelector'
import { SafetyNotice } from '@/components/tune-program/SafetyNotice'

export const metadata: Metadata = {
  title: 'Package Selector — N54 Tune Program',
  description:
    'Select your ROM, turbo type, fuel, and stage to find your Synergy N54 tune package.',
}

export default function SelectPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <TuneProgramHeader activePath="/tune-program/select" />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#2563eb',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Package Selector
          </p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Find Your Tune Package
          </h1>
          <p style={{ color: '#777', lineHeight: 1.65, maxWidth: '540px' }}>
            Filter by ROM version, turbo type, fuel, and stage to see registered Synergy base tune packages.
            Select a package to proceed to the intake form.
          </p>
        </div>

        {/* BIN generator reminder */}
        <div
          style={{
            background: '#0d1525',
            border: '1px solid #1e3a8a44',
            borderRadius: '0.65rem',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            color: '#6699ff',
            lineHeight: 1.55,
          }}
        >
          ℹ️ This selector shows registered package entries. The generated BIN is flashed externally using{' '}
          <strong style={{ color: '#93c5fd' }}>MHD Flasher</strong> or{' '}
          <strong style={{ color: '#93c5fd' }}>N54 Quickflash</strong> — not by this app.
        </div>

        <SafetyNotice variant="compact" />

        <div style={{ marginTop: '1.5rem' }}>
          <TuneFileSelector />
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <div style={{ borderTop: '1px solid #111', padding: '1.25rem 2rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.78rem', color: '#444', margin: 0 }}>
        © {new Date().getFullYear()} N54 Wiki — Powered by{' '}
        <a href="https://synergybmwtuning.com" target="_blank" rel="noopener noreferrer"
          style={{ color: '#6699ff', textDecoration: 'none', fontWeight: 600 }}>
          Synergy BMW Tuning
        </a>
      </p>
    </div>
  )
}
