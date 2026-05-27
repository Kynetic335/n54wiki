'use client'

// ─── ROM Status Badge ──────────────────────────────────────────────────────────
// Visual pill indicating ROM availability in the Generate BIN flow.
// ─────────────────────────────────────────────────────────────────────────────

import type { RomGateStatus } from '@/lib/tune-program/packageGates'

interface RomStatusBadgeProps {
  status: RomGateStatus
  /** Optional: override the displayed label */
  label?: string
}

const CONFIG: Record<RomGateStatus, { label: string; className: string }> = {
  READY: {
    label: 'READY',
    className:
      'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  },
  NEEDS_AUDIT: {
    label: 'NEEDS AUDIT',
    className:
      'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  },
  NOT_BUILT: {
    label: 'NOT BUILT',
    className:
      'bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-600',
  },
}

export function RomStatusBadge({ status, label }: RomStatusBadgeProps) {
  const cfg = CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider ${cfg.className}`}
    >
      {label ?? cfg.label}
    </span>
  )
}

// Per-package badge (smaller, used inside the package matrix)
export type PackageBadgeStatus = 'READY' | 'NEEDS_AUDIT' | 'DEPRECATED' | 'BLOCKED'

const PKG_CONFIG: Record<PackageBadgeStatus, { label: string; className: string }> = {
  READY: {
    label: 'READY',
    className:
      'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  },
  NEEDS_AUDIT: {
    label: 'NEEDS AUDIT',
    className:
      'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  DEPRECATED: {
    label: 'DEPRECATED',
    className:
      'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  },
  BLOCKED: {
    label: 'BLOCKED',
    className:
      'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  },
}

export function PackageStatusBadge({ status }: { status: PackageBadgeStatus }) {
  const cfg = PKG_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}
