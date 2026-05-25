'use client'

import { useState } from 'react'

interface TunerNotesProps {
  initialNotes: string
  requestId: string
  onSave?: (notes: string) => void
}

export function TunerNotes({ initialNotes, requestId, onSave }: TunerNotesProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In production: call an API or server action to persist
    // For now: persist to localStorage as a demo
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('synergy-tuner-notes') ?? '{}') as Record<string, string>
      stored[requestId] = notes
      localStorage.setItem('synergy-tuner-notes', JSON.stringify(stored))
    }
    onSave?.(notes)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <p
        style={{
          margin: '0 0 0.5rem',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#555',
          fontWeight: 600,
        }}
      >
        Tuner Notes
      </p>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value)
          setSaved(false)
        }}
        rows={5}
        placeholder="Add tuner notes — log review findings, approval conditions, concerns..."
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#0d0d0d',
          border: '1px solid #1e1e1e',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          color: '#e0e0e0',
          fontSize: '0.88rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          resize: 'vertical',
          lineHeight: 1.6,
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '0.4rem 1rem',
            background: '#1e3a8a',
            color: '#93c5fd',
            border: '1px solid #2563eb44',
            borderRadius: '0.4rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.83rem',
          }}
        >
          Save Notes
        </button>
        {saved && (
          <span style={{ fontSize: '0.82rem', color: '#4ade80' }}>✓ Saved (local)</span>
        )}
        <span style={{ fontSize: '0.75rem', color: '#333', marginLeft: 'auto' }}>
          Note: Saved to localStorage in v1 — integrate a database for production persistence.
        </span>
      </div>
    </div>
  )
}
