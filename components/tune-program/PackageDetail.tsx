'use client'

import type { TuneFile } from '@/types/tune-program'

interface PackageDetailProps {
  tuneFile: TuneFile
}

export function PackageDetail({ tuneFile }: PackageDetailProps) {
  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#f0f0f0', marginBottom: '0.35rem', lineHeight: 1.3 }}>
        {tuneFile.displayName}
      </h2>
      <code style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#444', display: 'block', marginBottom: '1.25rem' }}>
        {tuneFile.id}
      </code>

      <Section title="Required Mods">
        {tuneFile.requiredMods.length === 0 ? (
          <p style={{ fontSize: '0.84rem', color: '#555', margin: 0 }}>None — software-only tune.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {tuneFile.requiredMods.map((m, i) => (
              <li key={i} style={{ fontSize: '0.84rem', color: '#888', marginBottom: '0.25rem' }}>{m}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recommended Mods">
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {tuneFile.recommendedMods.map((m, i) => (
            <li key={i} style={{ fontSize: '0.84rem', color: '#888', marginBottom: '0.25rem' }}>{m}</li>
          ))}
        </ul>
      </Section>

      <Section title="Maintenance Checklist">
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {tuneFile.maintenanceChecklist.map((m, i) => (
            <li key={i} style={{ fontSize: '0.84rem', color: '#888', marginBottom: '0.25rem' }}>{m}</li>
          ))}
        </ul>
      </Section>

      <Section title="Datalog Requirements">
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {tuneFile.datalogRequirements.map((d, i) => (
            <li key={i} style={{ fontSize: '0.84rem', color: '#888', marginBottom: '0.25rem' }}>{d}</li>
          ))}
        </ul>
      </Section>

      <Section title="Safety Notes">
        {tuneFile.safetyNotes.map((note, i) => (
          <p
            key={i}
            style={{
              margin: i < tuneFile.safetyNotes.length - 1 ? '0 0 0.35rem' : 0,
              fontSize: '0.84rem',
              color: '#d97706',
              lineHeight: 1.55,
            }}
          >
            ⚠️ {note}
          </p>
        ))}
      </Section>

      {!tuneFile.fileExists && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            background: '#1a1a1a',
            border: '1px dashed #333',
            borderRadius: '0.5rem',
            fontSize: '0.82rem',
            color: '#555',
          }}
        >
          <strong style={{ color: '#666' }}>⚠️ File not yet mapped.</strong>{' '}
          This entry is a placeholder. The actual BIN must be placed at:
          <br />
          <code style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#444', display: 'block', marginTop: '0.3rem' }}>
            {tuneFile.protectedFilePath}
          </code>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p
        style={{
          margin: '0 0 0.5rem',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#444',
          fontWeight: 600,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}
