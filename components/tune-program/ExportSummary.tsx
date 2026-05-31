'use client'

import { FileHashDisplay } from './FileHashDisplay'
import type { TuneFile, CustomerRequest } from '@/types/tune-program'

interface ExportSummaryProps {
  tuneFile: TuneFile
  request: CustomerRequest
  contentHash?: string
  exportedAt?: string
  packageFileName?: string
  leadStatus?: 'idle' | 'sending' | 'sent' | 'error'
}

export function ExportSummary({
  tuneFile,
  request,
  contentHash,
  exportedAt,
  packageFileName,
  leadStatus = 'idle',
}: ExportSummaryProps) {
  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #1a2e1a',
        borderRadius: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <p
        style={{
          margin: '0 0 1.25rem',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#4ade80',
          fontWeight: 600,
        }}
      >
        📦 Export Package Summary
      </p>

      {leadStatus === 'sent' && (
        <StatusMessage
          tone="success"
          message="Your tune request summary was saved. Synergy will follow up."
        />
      )}

      {leadStatus === 'sending' && (
        <StatusMessage
          tone="info"
          message="Saving tune request summary..."
        />
      )}

      {leadStatus === 'error' && (
        <StatusMessage
          tone="warning"
          message="Export completed, but the tune request summary could not be saved. Follow up with Synergy directly."
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <InfoBlock label="Customer" value={request.name} />
        <InfoBlock label="Email" value={request.email} />
        <InfoBlock label="Vehicle" value={`${request.vehicleYear} ${request.vehicleModel}`} />
        <InfoBlock label="Transmission" value={request.transmission || '—'} />
        <InfoBlock label="Tune File" value={tuneFile.displayName} />
        <InfoBlock label="ROM" value={tuneFile.romVersion} />
        <InfoBlock label="Stage" value={tuneFile.stage} />
        <InfoBlock label="Fuel" value={tuneFile.fuel} />
        <InfoBlock label="Turbo Type" value={tuneFile.turboType} />
        <InfoBlock label="Transmission Compat." value={tuneFile.transmissionCompatibility} />
      </div>

      {contentHash && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            File Hash
          </p>
          <FileHashDisplay hash={contentHash} full />
        </div>
      )}

      {exportedAt && (
        <div style={{ marginBottom: '0.75rem' }}>
          <InfoBlock label="Exported At" value={new Date(exportedAt).toLocaleString()} />
        </div>
      )}

      {packageFileName && (
        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid #1e1e1e',
            borderRadius: '0.5rem',
            padding: '0.6rem 0.8rem',
          }}
        >
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.72rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Package File
          </p>
          <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6ee7b7' }}>
            {packageFileName}
          </code>
        </div>
      )}

      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#0a0a0a',
          border: '1px solid #1e1e1e',
          borderRadius: '0.5rem',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#555', lineHeight: 1.6 }}>
          🔒 This package contains an <strong style={{ color: '#666' }}>encrypted protected export</strong> of the selected tune file.
          It is not directly readable without the Synergy decryption tool.
          The content hash above can be used to verify file integrity.
        </p>
      </div>
    </div>
  )
}

function StatusMessage({ tone, message }: { tone: 'success' | 'info' | 'warning'; message: string }) {
  const styles = {
    success: {
      background: '#052e16',
      border: '1px solid #16a34a44',
      color: '#86efac',
    },
    info: {
      background: '#0d1525',
      border: '1px solid #1e3a8a44',
      color: '#93c5fd',
    },
    warning: {
      background: '#1a0f00',
      border: '1px solid #854d0e44',
      color: '#d97706',
    },
  }[tone]

  return (
    <div
      style={{
        ...styles,
        marginBottom: '1rem',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        fontSize: '0.84rem',
        lineHeight: 1.55,
      }}
    >
      {message}
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: '0 0 0.15rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '0.88rem', color: '#ddd', fontWeight: 500 }}>
        {value}
      </p>
    </div>
  )
}
