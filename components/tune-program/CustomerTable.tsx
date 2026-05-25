'use client'

import Link from 'next/link'
import { AdminStatusBadge } from './AdminStatusBadge'
import type { CustomerRequest, RequestStatus } from '@/types/tune-program'

interface CustomerTableProps {
  requests: CustomerRequest[]
  onStatusChange?: (id: string, status: RequestStatus) => void
  onSelect?: (request: CustomerRequest) => void
  selectedId?: string
}

const ALL_STATUSES: RequestStatus[] = [
  'New',
  'Waiting on Logs',
  'In Review',
  'Approved for Export',
  'Exported',
  'Complete',
]

export function CustomerTable({
  requests,
  onStatusChange,
  onSelect,
  selectedId,
}: CustomerTableProps) {
  if (requests.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#444',
          background: '#111',
          borderRadius: '0.75rem',
          border: '1px solid #1e1e1e',
        }}
      >
        No customer requests yet.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.84rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
            {['Customer', 'Vehicle', 'ROM', 'Tune', 'Status', 'Created', 'Actions'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '0.6rem 0.75rem',
                  textAlign: 'left',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#444',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr
              key={req.id}
              style={{
                borderBottom: '1px solid #111',
                background: selectedId === req.id ? '#0d1f3a' : 'transparent',
                cursor: onSelect ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
              onClick={() => onSelect?.(req)}
            >
              <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                <p style={{ margin: '0 0 0.1rem', fontWeight: 600, color: '#f0f0f0' }}>{req.name}</p>
                <p style={{ margin: 0, color: '#555', fontSize: '0.78rem' }}>{req.email}</p>
              </td>
              <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                <p style={{ margin: '0 0 0.1rem', color: '#ccc' }}>
                  {req.vehicleYear} {req.vehicleModel}
                </p>
                <p style={{ margin: 0, color: '#555', fontSize: '0.78rem' }}>{req.transmission}</p>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#93c5fd' }}>
                  {req.romVersion || '—'}
                </code>
              </td>
              <td style={{ padding: '0.75rem', maxWidth: '180px' }}>
                <p style={{ margin: '0 0 0.1rem', color: '#ccc', fontSize: '0.8rem' }}>
                  {req.selectedStage} / {req.selectedFuel}
                </p>
                <p style={{ margin: 0, color: '#555', fontSize: '0.75rem' }}>
                  {req.selectedTurboType}
                </p>
              </td>
              <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                {onStatusChange ? (
                  <select
                    value={req.status}
                    onChange={(e) => {
                      e.stopPropagation()
                      onStatusChange(req.id, e.target.value as RequestStatus)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: '#0d0d0d',
                      border: '1px solid #222',
                      borderRadius: '0.35rem',
                      color: '#f0f0f0',
                      padding: '0.25rem 0.4rem',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <AdminStatusBadge status={req.status} />
                )}
              </td>
              <td style={{ padding: '0.75rem', color: '#555', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                {new Date(req.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                <Link
                  href={`/tune-program/export?requestId=${req.id}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.6rem',
                    background: '#1e3a8a',
                    color: '#93c5fd',
                    borderRadius: '0.35rem',
                    textDecoration: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: '1px solid #2563eb33',
                  }}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
