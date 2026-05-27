'use client'

import { AdminStatusBadge } from './AdminStatusBadge'
import type { CustomerRequest } from '@/types/tune-program'

interface IntakeSummaryProps {
  request: CustomerRequest
  compact?: boolean
}

const fuels: Record<string, string> = {
  '91': '91 oct', '93': '93 oct', E30: 'E30', E40: 'E40', E50: 'E50',
}
const stages: Record<string, string> = {
  stage1: 'Stage 1', stage1plus: 'Stage 1+', stage2: 'Stage 2',
  stage3: 'Stage 3', 'hybrid-base': 'Hybrid Base',
}
const turbos: Record<string, string> = {
  stock: 'Stock Turbo',
  'upgraded-stock-frame': 'Upgraded Stock-Frame',
  hybrid: 'Hybrid Turbo',
}

export function IntakeSummary({ request, compact = false }: IntakeSummaryProps) {
  const rows = [
    ['Customer', request.name],
    ['Email', request.email],
    ['Vehicle', `${request.vehicleYear} ${request.vehicleModel}`],
    ['Transmission', request.transmission],
    ['ROM', request.romVersion || '—'],
    ['Current Tune', request.currentTune || 'None'],
    ['Fuel', fuels[request.selectedFuel] || request.selectedFuel],
    ['Stage', stages[request.selectedStage] || request.selectedStage],
    ['Turbo', turbos[request.selectedTurboType] || request.selectedTurboType],
    ['Goals', request.goals || '—'],
    ['Known Issues', request.knownIssues || 'None'],
  ]

  if (compact) {
    return (
      <div
        style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '0.65rem',
          padding: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#f0f0f0' }}>
            {request.name}
          </p>
          <AdminStatusBadge status={request.status} />
        </div>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.82rem', color: '#666' }}>
          {request.vehicleYear} {request.vehicleModel} · {request.transmission} ·{' '}
          <code style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{request.romVersion || '—'}</code>
        </p>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#777' }}>
          {stages[request.selectedStage]} · {fuels[request.selectedFuel]} · {turbos[request.selectedTurboType]}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f0f0f0' }}>
          {request.name}
        </h3>
        <AdminStatusBadge status={request.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1.5rem' }}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <p style={{ margin: '0 0 0.1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', fontWeight: 600 }}>
              {label}
            </p>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#ccc', fontWeight: 500, wordBreak: 'break-word' }}>
              {value || '—'}
            </p>
          </div>
        ))}
      </div>

      {request.maintenanceCompleted.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', fontWeight: 600 }}>
            Maintenance Confirmed ({request.maintenanceCompleted.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {request.maintenanceCompleted.map((item) => (
              <span
                key={item}
                style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.5rem',
                  background: '#052e16',
                  border: '1px solid #16a34a33',
                  borderRadius: '0.3rem',
                  fontSize: '0.72rem',
                  color: '#4ade80',
                }}
              >
                ✓ {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {request.tunerNotes && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#0d1525',
            border: '1px solid #1e3a8a33',
            borderRadius: '0.5rem',
          }}
        >
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Tuner Notes
          </p>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#93c5fd', lineHeight: 1.6 }}>
            {request.tunerNotes}
          </p>
        </div>
      )}
    </div>
  )
}
