'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TuneProgramHeader } from '@/components/tune-program/TuneProgramHeader'
import { ExportSummary } from '@/components/tune-program/ExportSummary'
import { LockedExportButton } from '@/components/tune-program/LockedExportButton'
import { AdminStatusBadge } from '@/components/tune-program/AdminStatusBadge'
import { sampleCustomers } from '@/data/tune-program/sampleCustomers'
import { getTuneFileById } from '@/data/tune-program/tuneFiles'
import type { CustomerRequest } from '@/types/tune-program'

const DEFAULT_PIN = 'synergy2026'

function ExportPageInner() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('requestId')
  const [request, setRequest] = useState<CustomerRequest | null>(null)
  const [exportedHash, setExportedHash] = useState('')
  const [exportedFileName, setExportedFileName] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!requestId) return
    // Look in sample data + localStorage
    const stored = JSON.parse(localStorage.getItem('synergy-tune-requests') ?? '[]') as CustomerRequest[]
    const all = [...sampleCustomers, ...stored]
    const found = all.find((r) => r.id === requestId)
    if (found) {
      setRequest(found)
    } else {
      setNotFound(true)
    }
  }, [requestId])

  const tuneFile = request?.selectedTuneFileId
    ? getTuneFileById(request.selectedTuneFileId)
    : null

  if (!requestId) {
    return (
      <Placeholder
        icon="🔍"
        message="No request ID provided."
        sub="Navigate from the Admin dashboard to view a specific request."
      />
    )
  }

  if (notFound) {
    return (
      <Placeholder
        icon="❌"
        message={`Request "${requestId}" not found.`}
        sub="Check the request ID or navigate from the Admin dashboard."
      />
    )
  }

  if (!request) {
    return (
      <Placeholder icon="⏳" message="Loading..." sub="" />
    )
  }

  return (
    <div>
      {/* Request header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f0f0f0' }}>
            {request.name}
          </h2>
          <AdminStatusBadge status={request.status} />
        </div>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#666' }}>
          {request.email} · {request.vehicleYear} {request.vehicleModel} ·{' '}
          <code style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{request.romVersion || '—'}</code>
        </p>
      </div>

      {/* Flasher reminder */}
      <div
        style={{
          background: '#0d1525',
          border: '1px solid #1e3a8a44',
          borderRadius: '0.65rem',
          padding: '0.85rem 1.1rem',
          marginBottom: '1.5rem',
          fontSize: '0.82rem',
          color: '#6699ff',
          lineHeight: 1.55,
        }}
      >
        ℹ️ The protected export package is delivered to the customer. The customer flashes it using{' '}
        <strong style={{ color: '#93c5fd' }}>MHD Flasher</strong> or{' '}
        <strong style={{ color: '#93c5fd' }}>N54 Quickflash</strong>.
        This app does not flash the car.
      </div>

      {request.status !== 'Approved for Export' && (
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '0.65rem',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.5rem',
            fontSize: '0.84rem',
            color: '#666',
          }}
        >
          Status is <strong style={{ color: '#888' }}>{request.status}</strong>.
          Change status to <strong style={{ color: '#4ade80' }}>Approved for Export</strong> in the Admin dashboard before exporting.
        </div>
      )}

      {/* Export controls */}
      {tuneFile ? (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {(exportedHash || exportedFileName) && (
            <ExportSummary
              tuneFile={tuneFile}
              request={request}
              contentHash={exportedHash}
              exportedAt={new Date().toISOString()}
              packageFileName={exportedFileName}
            />
          )}

          {request.status === 'Approved for Export' && (
            <LockedExportButton
              tuneFile={tuneFile}
              request={request}
              adminPin={DEFAULT_PIN}
              onSuccess={(fileName, hash) => {
                setExportedHash(hash)
                setExportedFileName(fileName)
              }}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '1rem',
            background: '#1f0000',
            border: '1px solid #7f1d1d',
            borderRadius: '0.65rem',
            fontSize: '0.84rem',
            color: '#fca5a5',
          }}
        >
          No tune file is selected for this request. Update via the intake form or admin dashboard.
        </div>
      )}
    </div>
  )
}

function Placeholder({ icon, message, sub }: { icon: string; message: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
      <p style={{ fontWeight: 600, color: '#888', marginBottom: '0.5rem' }}>{message}</p>
      {sub && <p style={{ fontSize: '0.84rem', color: '#555' }}>{sub}</p>}
    </div>
  )
}

export default function ExportPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <TuneProgramHeader activePath="/tune-program/export" />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4ade80', fontWeight: 600, marginBottom: '0.5rem' }}>
            Export
          </p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Export Tune Package
          </h1>
          <p style={{ color: '#777', lineHeight: 1.65 }}>
            Generate an encrypted <code style={{ fontFamily: 'monospace', color: '#666' }}>.synergytune</code> protected package for delivery to the customer.
          </p>
        </div>

        <Suspense fallback={<Placeholder icon="⏳" message="Loading..." sub="" />}>
          <ExportPageInner />
        </Suspense>
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
