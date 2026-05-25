import type { RequestStatus } from '@/types/tune-program'

const STATUS_CONFIG: Record<RequestStatus, { color: string; bg: string; icon: string }> = {
  New: { color: '#93c5fd', bg: '#1e3a8a33', icon: '🆕' },
  'Waiting on Logs': { color: '#fbbf24', bg: '#78350f33', icon: '⏳' },
  'In Review': { color: '#c4b5fd', bg: '#4c1d9533', icon: '🔍' },
  'Approved for Export': { color: '#4ade80', bg: '#14532d33', icon: '✅' },
  Exported: { color: '#6ee7b7', bg: '#065f4633', icon: '📦' },
  Complete: { color: '#a3a3a3', bg: '#17171733', icon: '🏁' },
}

interface AdminStatusBadgeProps {
  status: RequestStatus
}

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.New
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '0.35rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}44`,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{config.icon}</span>
      {status}
    </span>
  )
}
