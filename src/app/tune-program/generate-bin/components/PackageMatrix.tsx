'use client'

// ─── Package Matrix ────────────────────────────────────────────────────────────
// Displays all non-deprecated packages for a selected ROM.
// READY packages are selectable. NEEDS_AUDIT rows are visible but disabled.
// ─────────────────────────────────────────────────────────────────────────────

import {
  listActivePackagesForRom,
  getPackageGateStatus,
} from '@/lib/tune-program/packageGates'
import type { PatchPackageManifestEntry } from '@/lib/tune-program/packageGates'
import { PackageStatusBadge } from './RomStatusBadge'

interface PackageMatrixProps {
  romId: string
  selectedPackageId: string | null
  onSelect: (entry: PatchPackageManifestEntry) => void
}

const STAGE_LABELS: Record<string, string> = {
  'stage1+': 'Stage 1+',
  stage2: 'Stage 2',
  stage3: 'Stage 3',
  'hybrid-base': 'Hybrid Base (N20 MAP)',
}

const FUEL_LABELS: Record<string, string> = {
  '91': '91 oct',
  '93': '93 oct',
  e50: 'E50',
  pump: 'Pump (N20)',
}

const TYPE_LABELS: Record<string, string> = {
  'standard-ots': 'Standard OTS',
  'n20-map': 'N20 MAP',
}

export function PackageMatrix({ romId, selectedPackageId, onSelect }: PackageMatrixProps) {
  const packages = listActivePackagesForRom(romId)

  if (packages.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No packages available for {romId}.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <th className="pb-2 pr-4">Stage</th>
            <th className="pb-2 pr-4">Fuel</th>
            <th className="pb-2 pr-4">Type</th>
            <th className="pb-2 pr-4">Regions</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {packages.map((pkg) => {
            const gateStatus = getPackageGateStatus(pkg)
            const isReady = gateStatus === 'READY'
            const isSelected = pkg.packageId === selectedPackageId

            return (
              <tr
                key={pkg.packageId}
                className={[
                  'transition-colors',
                  isReady ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'opacity-50',
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : '',
                ].join(' ')}
                onClick={() => isReady && onSelect(pkg)}
                aria-disabled={!isReady}
              >
                <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-200">
                  {STAGE_LABELS[pkg.stage] ?? pkg.stage}
                </td>
                <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                  {FUEL_LABELS[pkg.fuel] ?? pkg.fuel.toUpperCase()}
                </td>
                <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">
                  {TYPE_LABELS[pkg.packageType] ?? pkg.packageType}
                </td>
                <td className="py-2 pr-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                  {pkg.patchRegions}
                </td>
                <td className="py-2 pr-4">
                  <PackageStatusBadge status={gateStatus === 'NEEDS_AUDIT' ? 'NEEDS_AUDIT' : 'READY'} />
                </td>
                <td className="py-2 text-right">
                  {isReady && (
                    <button
                      type="button"
                      disabled={!isReady}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(pkg)
                      }}
                      className={[
                        'rounded px-3 py-1 text-xs font-medium transition-colors',
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-blue-800/40 dark:hover:text-blue-300',
                      ].join(' ')}
                    >
                      {isSelected ? '✓ Selected' : 'Select'}
                    </button>
                  )}
                  {!isReady && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {gateStatus === 'NEEDS_AUDIT' ? 'Audit required' : 'Unavailable'}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
