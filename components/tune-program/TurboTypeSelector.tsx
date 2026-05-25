'use client'

import { turboTypes } from '@/data/tune-program/turboTypes'
import type { TurboTypeId } from '@/types/tune-program'

interface TurboTypeSelectorProps {
  value: string
  onChange: (value: TurboTypeId) => void
  availableIds?: TurboTypeId[]
}

export function TurboTypeSelector({ value, onChange, availableIds }: TurboTypeSelectorProps) {
  const options = availableIds
    ? turboTypes.filter((t) => availableIds.includes(t.id))
    : turboTypes

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {options.map((turbo) => {
        const active = value === turbo.id
        return (
          <button
            key={turbo.id}
            onClick={() => onChange(turbo.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              background: active ? '#0d1f3a' : '#111',
              border: `1px solid ${active ? '#2563eb' : '#222'}`,
              borderRadius: '0.65rem',
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
                marginTop: '0.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {active && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.95rem', color: active ? '#93c5fd' : '#ddd' }}>
                {turbo.label}
              </p>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#666', lineHeight: 1.5 }}>
                {turbo.description}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#444' }}>
                Stages: {turbo.stageCompatibility.join(', ')}
              </p>
            </div>
          </button>
        )
      })}

      {/* NOT SUPPORTED disclaimer */}
      <div
        style={{
          padding: '0.75rem 1rem',
          background: '#0f0f0f',
          border: '1px dashed #222',
          borderRadius: '0.6rem',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#444', lineHeight: 1.5 }}>
          <strong style={{ color: '#555' }}>Not available in v1:</strong>{' '}
          Single turbo conversions, port injection primary tuning. These will be added in a future release.
        </p>
      </div>
    </div>
  )
}
