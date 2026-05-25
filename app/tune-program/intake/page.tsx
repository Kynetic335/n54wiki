import type { Metadata } from 'next'
import { TuneProgramHeader } from '@/components/tune-program/TuneProgramHeader'
import { IntakeFormWrapper } from '@/components/tune-program/IntakeFormWrapper'

export const metadata: Metadata = {
  title: 'Customer Intake — N54 Tune Program',
  description:
    'Submit your vehicle details, hardware setup, and tune selection for Synergy N54 tune review.',
}

// searchParams is a Promise in Next.js 15+
export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const get = (k: string) => (typeof params[k] === 'string' ? params[k] : undefined)

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <TuneProgramHeader activePath="/tune-program/intake" />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb', fontWeight: 600, marginBottom: '0.5rem' }}>
            Customer Intake
          </p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Tune Request Form
          </h1>
          <p style={{ color: '#777', lineHeight: 1.65, maxWidth: '540px' }}>
            Complete this form so the Synergy team can review your setup before approving a tune package.
            All fields help ensure the correct base file is selected.
          </p>
        </div>

        {/* Not-a-flasher note */}
        <div
          style={{
            background: '#0d1525',
            border: '1px solid #1e3a8a44',
            borderRadius: '0.65rem',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.75rem',
            fontSize: '0.82rem',
            color: '#6699ff',
          }}
        >
          ℹ️ Submitting this form starts the tune review process.
          Your generated BIN will be flashed using <strong style={{ color: '#93c5fd' }}>MHD Flasher</strong> or{' '}
          <strong style={{ color: '#93c5fd' }}>N54 Quickflash</strong> — not by this app.
        </div>

        <IntakeFormWrapper
          prefill={{
            rom: get('rom'),
            fuel: get('fuel'),
            stage: get('stage'),
            turbo: get('turbo'),
            fileId: get('fileId'),
          }}
        />
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
