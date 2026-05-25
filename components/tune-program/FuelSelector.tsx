'use client'

import { fuels } from '@/data/tune-program/fuels'
import type { FuelType } from '@/types/tune-program'

interface FuelSelectorProps {
  value: string
  onChange: (value: FuelType) => void
  availableIds?: FuelType[]
  /** If true, show future fuels as greyed-out disabled pills. Default: false */
  showFutureFuels?: boolean
}

export function FuelSelector({ value, onChange, availableIds, showFutureFuels = false }: FuelSelectorProps) {
  const allOptions = availableIds
    ? fuels.filter((f) => availableIds.includes(f.id))
    : fuels

  const activeOptions  = allOptions.filter((f) => f.status === 'active')
  const futureOptions  = showFutureFuels ? allOptions.filter((f) => f.status === 'future') : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Active fuels */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {activeOptions.map((fuel) => {
          const active = value === fuel.id
          return (
            <button
              key={fuel.id}
              onClick={() => onChange(fuel.id)}
              title={fuel.description}
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.75rem 1.25rem',
                background: active ? `${fuel.color}22` : '#111',
                border: `1.5px solid ${active ? fuel.color : '#222'}`,
                borderRadius: '0.6rem',
                cursor: 'pointer',
                minWidth: '80px',
                transition: 'border-color 0.12s, background 0.12s',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: active ? fuel.color : '#ccc',
                }}
              >
                {fuel.label}
              </span>
              {fuel.ethanolPercent !== undefined && fuel.ethanolPercent > 0 && (
                <span style={{ fontSize: '0.68rem', color: active ? fuel.color : '#444' }}>
                  {fuel.ethanolPercent}% EtOH
                </span>
              )}
              {fuel.minOctane && (
                <span style={{ fontSize: '0.68rem', color: active ? fuel.color : '#444' }}>
                  {fuel.minOctane} AKI
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Future fuels — disabled informational display */}
      {futureOptions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#3a3a3a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Coming soon:
          </span>
          {futureOptions.map((fuel) => (
            <button
              key={fuel.id}
              disabled
              title={fuel.statusNote ?? fuel.description}
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0.5rem 0.9rem',
                background: '#111',
                border: '1px dashed #272727',
                borderRadius: '0.5rem',
                cursor: 'not-allowed',
                color: '#333',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {fuel.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
