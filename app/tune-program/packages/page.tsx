import type { Metadata } from 'next'
import { TuneProgramHeader } from '@/components/tune-program/TuneProgramHeader'
import { PackageCard } from '@/components/tune-program/PackageCard'
import { tuneFiles } from '@/data/tune-program/tuneFiles'

export const metadata: Metadata = {
  title: 'Available Packages — N54 Tune Program',
  description:
    'Browse all registered Synergy N54 tune packages by ROM, stage, fuel, and turbo type.',
}

export default function PackagesPage() {
  const byRom = tuneFiles.reduce<Record<string, typeof tuneFiles>>((acc, f) => {
    if (!acc[f.romVersion]) acc[f.romVersion] = []
    acc[f.romVersion].push(f)
    return acc
  }, {})

  const total = tuneFiles.length
  const withFile = tuneFiles.filter((f) => f.fileExists).length
  const placeholders = total - withFile

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <TuneProgramHeader activePath="/tune-program/packages" />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb', fontWeight: 600, marginBottom: '0.5rem' }}>
            Tune Packages
          </p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Registered Base Packages
          </h1>
          <p style={{ color: '#777', lineHeight: 1.65, maxWidth: '600px' }}>
            All registered Synergy N54 base tune entries. Packages marked{' '}
            <span style={{ color: '#555', fontWeight: 600 }}>PENDING FILE</span> require the actual BIN to be
            placed on the server before export is available.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Entries', value: total, color: '#93c5fd' },
            { label: 'Files Mapped', value: withFile, color: '#4ade80' },
            { label: 'Pending Files', value: placeholders, color: '#f59e0b' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#111',
                border: '1px solid #1e1e1e',
                borderRadius: '0.6rem',
                padding: '0.75rem 1.25rem',
              }}
            >
              <p style={{ margin: '0 0 0.2rem', fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>
                {stat.value}
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* BIN/flasher notice */}
        <div
          style={{
            background: '#0d1525',
            border: '1px solid #1e3a8a44',
            borderRadius: '0.65rem',
            padding: '0.85rem 1.1rem',
            marginBottom: '2rem',
            fontSize: '0.82rem',
            color: '#6699ff',
          }}
        >
          ℹ️ Generated BIN files are flashed with <strong style={{ color: '#93c5fd' }}>MHD Flasher</strong> or{' '}
          <strong style={{ color: '#93c5fd' }}>N54 Quickflash</strong>. This app does not flash your car.
        </div>

        {/* Packages by ROM */}
        {Object.entries(byRom).map(([rom, files]) => (
          <div key={rom} style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f0f0f0' }}>
                {rom}
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  background: '#1e3a8a33',
                  color: '#93c5fd',
                  border: '1px solid #2563eb33',
                  borderRadius: '0.3rem',
                  padding: '0.1rem 0.45rem',
                  fontWeight: 600,
                }}
              >
                {files.length} packages
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1rem',
              }}
            >
              {files.map((f) => (
                <PackageCard key={f.id} tuneFile={f} showSelectLink compact />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #111', padding: '1.25rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.78rem', color: '#444', margin: 0 }}>
          © {new Date().getFullYear()} N54 Wiki —{' '}
          <a href="https://synergybmwtuning.com" target="_blank" rel="noopener noreferrer"
            style={{ color: '#6699ff', textDecoration: 'none', fontWeight: 600 }}>
            Synergy BMW Tuning
          </a>
        </p>
      </div>
    </div>
  )
}
