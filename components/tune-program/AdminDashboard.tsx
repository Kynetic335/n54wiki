'use client'

import { useState, useEffect } from 'react'
import { CustomerTable } from './CustomerTable'
import { TunerNotes } from './TunerNotes'
import { LockedExportButton } from './LockedExportButton'
import { ExportSummary } from './ExportSummary'
import { AdminStatusBadge } from './AdminStatusBadge'
import { sampleCustomers } from '@/data/tune-program/sampleCustomers'
import { getTuneFileById } from '@/data/tune-program/tuneFiles'
import type { CustomerRequest, RequestStatus } from '@/types/tune-program'

interface AdminDashboardProps {
  adminPin: string
}

export function AdminDashboard({ adminPin }: AdminDashboardProps) {
  const [requests, setRequests] = useState<CustomerRequest[]>([])
  const [selected, setSelected] = useState<CustomerRequest | null>(null)
  const [exportedHash, setExportedHash] = useState('')
  const [exportedFileName, setExportedFileName] = useState('')
  const [filter, setFilter] = useState<RequestStatus | 'All'>('All')

  // Load from localStorage + sample data
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = JSON.parse(
      localStorage.getItem('synergy-tune-requests') ?? '[]'
    ) as CustomerRequest[]
    setRequests([...sampleCustomers, ...stored])
  }, [])

  const handleStatusChange = (id: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    )
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status } : s))
    }
  }

  const filtered =
    filter === 'All' ? requests : requests.filter((r) => r.status === filter)

  const selectedFile = selected?.selectedTuneFileId
    ? getTuneFileById(selected.selectedTuneFileId)
    : null

  const statusCounts = requests.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status as RequestStatus] ?? 0) + 1 }),
    {} as Record<RequestStatus, number>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
      {/* Left — Request List */}
      <div>
        {/* Stats row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {(
            [
              'All',
              'New',
              'Waiting on Logs',
              'In Review',
              'Approved for Export',
              'Exported',
              'Complete',
            ] as const
          ).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0.7rem',
                background: filter === s ? '#0d1f3a' : '#111',
                border: `1px solid ${filter === s ? '#2563eb' : '#1e1e1e'}`,
                borderRadius: '0.35rem',
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: filter === s ? '#93c5fd' : '#555',
                fontWeight: filter === s ? 600 : 400,
              }}
            >
              {s}
              {s !== 'All' && statusCounts[s as RequestStatus] > 0 && (
                <span
                  style={{
                    background: '#1e3a8a',
                    color: '#93c5fd',
                    borderRadius: '0.25rem',
                    padding: '0.05rem 0.35rem',
                    fontSize: '0.7rem',
                  }}
                >
                  {statusCounts[s as RequestStatus]}
                </span>
              )}
              {s === 'All' && (
                <span
                  style={{
                    background: '#1a1a1a',
                    color: '#666',
                    borderRadius: '0.25rem',
                    padding: '0.05rem 0.35rem',
                    fontSize: '0.7rem',
                  }}
                >
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <CustomerTable
          requests={filtered}
          onStatusChange={handleStatusChange}
          onSelect={setSelected}
          selectedId={selected?.id}
        />
      </div>

      {/* Right — Detail Panel */}
      {selected && (
        <div
          style={{
            background: '#111',
            border: '1px solid #1e1e1e',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            position: 'sticky',
            top: '120px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1rem', color: '#f0f0f0' }}>
                {selected.name}
              </p>
              <p style={{ margin: '0 0 0.4rem', fontSize: '0.82rem', color: '#666' }}>{selected.email}</p>
              <AdminStatusBadge status={selected.status} />
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#444',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.1rem',
              }}
            >
              ×
            </button>
          </div>

          {/* Vehicle info */}
          <div style={{ marginBottom: '1rem', fontSize: '0.84rem', color: '#888' }}>
            <p style={{ margin: '0 0 0.2rem' }}>
              <strong style={{ color: '#ccc' }}>Vehicle:</strong> {selected.vehicleYear} {selected.vehicleModel}
            </p>
            <p style={{ margin: '0 0 0.2rem' }}>
              <strong style={{ color: '#ccc' }}>ROM:</strong>{' '}
              <code style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{selected.romVersion || '—'}</code>
            </p>
            <p style={{ margin: '0 0 0.2rem' }}>
              <strong style={{ color: '#ccc' }}>Selection:</strong> {selected.selectedStage} / {selected.selectedFuel} / {selected.selectedTurboType}
            </p>
            {selected.currentTune && (
              <p style={{ margin: '0 0 0.2rem' }}>
                <strong style={{ color: '#ccc' }}>Current Tune:</strong> {selected.currentTune}
              </p>
            )}
            {selected.knownIssues && (
              <p style={{ margin: '0 0 0.2rem', color: '#f87171' }}>
                <strong>Known Issues:</strong> {selected.knownIssues}
              </p>
            )}
          </div>

          {/* Tuner notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <TunerNotes
              requestId={selected.id}
              initialNotes={selected.tunerNotes}
              onSave={(notes) => {
                setSelected((s) => (s ? { ...s, tunerNotes: notes } : s))
                setRequests((prev) =>
                  prev.map((r) => (r.id === selected.id ? { ...r, tunerNotes: notes } : r))
                )
              }}
            />
          </div>

          {/* Export section */}
          {selected.status === 'Approved for Export' && selectedFile ? (
            <div>
              <p
                style={{
                  margin: '0 0 0.75rem',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#4ade80',
                  fontWeight: 600,
                }}
              >
                🔐 Export Controls
              </p>

              {(exportedHash || exportedFileName) && (
                <div style={{ marginBottom: '1rem' }}>
                  <ExportSummary
                    tuneFile={selectedFile}
                    request={selected}
                    contentHash={exportedHash}
                    exportedAt={new Date().toISOString()}
                    packageFileName={exportedFileName}
                  />
                </div>
              )}

              <LockedExportButton
                tuneFile={selectedFile}
                request={selected}
                adminPin={adminPin}
                onSuccess={(fileName, hash) => {
                  setExportedHash(hash)
                  setExportedFileName(fileName)
                  handleStatusChange(selected.id, 'Exported')
                }}
                onError={(err) => {
                  console.error('Export error:', err)
                }}
              />
            </div>
          ) : selected.status !== 'Approved for Export' ? (
            <div
              style={{
                padding: '0.75rem',
                background: '#0a0a0a',
                border: '1px solid #1e1e1e',
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                color: '#555',
              }}
            >
              Status must be <strong style={{ color: '#4ade80' }}>Approved for Export</strong> before the export button is available.
            </div>
          ) : !selectedFile ? (
            <div
              style={{
                padding: '0.75rem',
                background: '#1f0000',
                border: '1px solid #7f1d1d',
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                color: '#fca5a5',
              }}
            >
              No tune file selected for this request. Update the intake form.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
