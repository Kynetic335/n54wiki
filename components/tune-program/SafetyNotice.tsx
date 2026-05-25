'use client'

import { safetyRules } from '@/data/tune-program/safetyRules'

interface SafetyNoticeProps {
  variant?: 'compact' | 'full' | 'blocking'
}

export function SafetyNotice({ variant = 'compact' }: SafetyNoticeProps) {
  if (variant === 'compact') {
    return (
      <div
        style={{
          background: '#1a0f00',
          border: '1px solid #854d0e55',
          borderRadius: '0.65rem',
          padding: '0.9rem 1.1rem',
          display: 'flex',
          gap: '0.65rem',
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: '0.05rem', flexShrink: 0 }}>⚠️</span>
        <div>
          <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.85rem', color: '#fbbf24' }}>
            Important Safety Notice
          </p>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#d97706', lineHeight: 1.55 }}>
            {safetyRules.disclaimer}
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div
        style={{
          background: '#0f0800',
          border: '1px solid #854d0e55',
          borderRadius: '0.75rem',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.4rem' }}>⚠️</span>
          <div>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1rem', color: '#fbbf24' }}>
              Safety Rules — Read Before Proceeding
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#d97706', lineHeight: 1.6 }}>
              {safetyRules.disclaimer}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', fontWeight: 600 }}>
              Hard Rules
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {safetyRules.hardRules.map((rule, i) => (
                <li key={i} style={{ fontSize: '0.82rem', color: '#d97706', lineHeight: 1.55, marginBottom: '0.4rem' }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', fontWeight: 600 }}>
              Blocking Conditions
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {safetyRules.blockingConditions.map((cond, i) => (
                <li key={i} style={{ fontSize: '0.82rem', color: '#f87171', lineHeight: 1.55, marginBottom: '0.4rem' }}>
                  {cond}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // blocking variant — large, prominent
  return (
    <div
      style={{
        background: '#1f0000',
        border: '2px solid #7f1d1d',
        borderRadius: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🚫</span>
        <div>
          <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1rem', color: '#f87171' }}>
            Conditions That Block Export
          </p>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#fca5a5', lineHeight: 1.6 }}>
            The following issues must be resolved before a tune package can be approved for export.
          </p>
        </div>
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {safetyRules.blockingConditions.map((cond, i) => (
          <li key={i} style={{ fontSize: '0.84rem', color: '#fca5a5', lineHeight: 1.6, marginBottom: '0.5rem' }}>
            {cond}
          </li>
        ))}
      </ul>
    </div>
  )
}
