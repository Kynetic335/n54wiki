'use client'

import type { RomVersion } from '@/types/tune-program'

const ROM_OPTIONS: { id: RomVersion; label: string; description: string }[] = [
  {
    id: 'I8A0S',
    label: 'I8A0S',
    description: 'Most common — 2007–2010 135i/335i, 6-speed MT (MSD80 DME)',
  },
  {
    id: 'IJE0S',
    label: 'IJE0S',
    description: '6-speed automatic (ZF 6HP) N54 cars — 335i, 535i AT variants',
  },
  {
    id: 'IKM0S',
    label: 'IKM0S',
    description: 'Less common ROM — select regional/late-production N54 cars. Verify in MHD.',
  },
  {
    id: 'INA0S',
    label: 'INA0S',
    description: 'Later N54 revision — 2010+ models, some 535i',
  },
  {
    id: 'UNKNOWN',
    label: 'Unknown / Not Sure',
    description: 'Check ISTA, BimmerCode, or MHD for your ROM version before proceeding',
  },
]

interface RomSelectorProps {
  value: string
  onChange: (value: RomVersion) => void
}

export function RomSelector({ value, onChange }: RomSelectorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {ROM_OPTIONS.map((rom) => {
        const active = value === rom.id
        return (
          <button
            key={rom.id}
            onClick={() => onChange(rom.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.9rem 1rem',
              background: active ? '#0d1f3a' : '#111',
              border: `1px solid ${active ? '#2563eb' : '#222'}`,
              borderRadius: '0.6rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.12s, background 0.12s',
              width: '100%',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: `2px solid ${active ? '#2563eb' : '#333'}`,
                background: active ? '#2563eb' : 'transparent',
                flexShrink: 0,
                marginTop: '0.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {active && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
              )}
            </div>
            <div>
              <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.95rem', color: active ? '#93c5fd' : '#ddd' }}>
                {rom.label}
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: 1.45 }}>
                {rom.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
