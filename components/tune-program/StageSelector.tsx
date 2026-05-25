'use client'

import { stages } from '@/data/tune-program/stages'
import type { StageId } from '@/types/tune-program'

interface StageSelectorProps {
  value: string
  onChange: (value: StageId) => void
  availableIds?: StageId[]
}

export function StageSelector({ value, onChange, availableIds }: StageSelectorProps) {
  const options = availableIds
    ? stages.filter((s) => availableIds.includes(s.id))
    : stages

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {options.map((stage) => {
        const active = value === stage.id
        const isHybrid = stage.id === 'hybrid-base'
        return (
          <button
            key={stage.id}
            onClick={() => onChange(stage.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              padding: '1rem 1.1rem',
              background: active ? (isHybrid ? '#1a0d2e' : '#0d1f3a') : '#111',
              border: `1px solid ${active ? (isHybrid ? '#7c3aed' : '#2563eb') : '#222'}`,
              borderRadius: '0.65rem',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.12s, background 0.12s',
            }}
          >
            {/* Radio dot */}
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: `2px solid ${active ? (isHybrid ? '#7c3aed' : '#2563eb') : '#333'}`,
                background: active ? (isHybrid ? '#7c3aed' : '#2563eb') : 'transparent',
                flexShrink: 0,
                marginTop: '0.2rem',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: active ? (isHybrid ? '#c4b5fd' : '#93c5fd') : '#ddd' }}>
                  {stage.label}
                </p>
                {isHybrid && (
                  <span style={{ fontSize: '0.68rem', background: '#4c1d95', color: '#c4b5fd', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontWeight: 600 }}>
                    SPECIAL
                  </span>
                )}
              </div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#666', lineHeight: 1.5 }}>
                {stage.description}
              </p>
              {stage.requiredMods.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Required:{' '}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#555' }}>
                    {stage.requiredMods.join(' • ')}
                  </span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
