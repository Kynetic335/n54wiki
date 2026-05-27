'use client'

// ─── Review Panel ──────────────────────────────────────────────────────────────
// Displays the per-region patch apply result after review runs.
// Shows: overall status, SHA-256 summary, per-region table (first 20 rows),
// and notes / errors.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { PatchApplyResult, RegionApplyResult } from '@/types/tune-program'

interface ReviewPanelProps {
  result: PatchApplyResult | null
  isRunning: boolean
  error?: string | null
}

export function ReviewPanel({ result, isRunning, error }: ReviewPanelProps) {
  const [showAllRegions, setShowAllRegions] = useState(false)

  if (isRunning) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          ⏳ Applying patches and computing SHA-256…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/30">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">Review failed</p>
        <p className="mt-1 font-mono text-xs text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!result) return null

  const isPassed = result.status === 'success'
  const hasMismatches = result.stockMismatchCount > 0
  const shownRegions = showAllRegions
    ? result.regionResults
    : result.regionResults.slice(0, 20)

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div
        className={[
          'flex items-center justify-between rounded-lg border p-4',
          isPassed
            ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30'
            : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30',
        ].join(' ')}
      >
        <div>
          <p
            className={[
              'text-base font-bold',
              isPassed
                ? 'text-green-800 dark:text-green-300'
                : 'text-red-800 dark:text-red-300',
            ].join(' ')}
          >
            {isPassed ? '✅ Review PASS' : '❌ Review FAILED'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {result.appliedCount}/{result.totalRegions} regions applied
            {hasMismatches && (
              <span className="ml-2 text-red-600 dark:text-red-400">
                — {result.stockMismatchCount} stock-byte mismatch(es)
              </span>
            )}
          </p>
        </div>
        <span
          className={[
            'rounded px-2 py-1 font-mono text-xs font-bold tracking-wider',
            isPassed
              ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
              : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
          ].join(' ')}
        >
          {result.status}
        </span>
      </div>

      {/* SHA-256 summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          SHA-256 Summary
        </p>
        <div className="space-y-1 font-mono text-xs">
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-gray-400">Input stock:</span>
            <span
              className={
                result.stockSha256Match
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }
            >
              {result.inputSha256}
              {!result.stockSha256Match && ' ⚠ mismatch'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-gray-400">Expected:</span>
            <span className="text-gray-600 dark:text-gray-300">{result.stockSha256Expected}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-gray-400">Patched:</span>
            <span className="text-blue-700 dark:text-blue-400">{result.patchedSha256}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-gray-400">Tuned ref:</span>
            <span className="text-gray-400 dark:text-gray-500">
              {result.tunedSha256Expected}
              {!result.patchedMatchesTuned && (
                <span className="ml-1 text-gray-400 dark:text-gray-500">
                  (expected — CRC byte excluded)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
          <p className="mb-1 text-xs font-semibold text-red-700 dark:text-red-300">Errors</p>
          <ul className="list-inside list-disc space-y-1 text-xs text-red-600 dark:text-red-400">
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {result.notes.length > 0 && (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
          <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Notes</p>
          <ul className="list-inside list-disc space-y-1 text-xs text-gray-500 dark:text-gray-400">
            {result.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-region table */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Patch Regions ({result.totalRegions} total)
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">Offset</th>
                <th className="px-2 py-1.5">Bytes</th>
                <th className="px-2 py-1.5">Status</th>
                <th className="px-2 py-1.5">Expected Stock</th>
                <th className="px-2 py-1.5">Actual Stock</th>
                <th className="px-2 py-1.5">Replacement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {shownRegions.map((r: RegionApplyResult) => (
                <tr
                  key={r.regionIndex}
                  className={
                    r.stockMismatch
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : 'bg-white dark:bg-transparent'
                  }
                >
                  <td className="px-2 py-1 font-mono text-gray-400">{r.regionIndex}</td>
                  <td className="px-2 py-1 font-mono text-gray-600 dark:text-gray-300">
                    0x{r.offset.toString(16).toUpperCase().padStart(6, '0')}
                  </td>
                  <td className="px-2 py-1 font-mono text-gray-500">{r.byteCount}</td>
                  <td className="px-2 py-1">
                    {r.stockMismatch ? (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        ✗ MISMATCH
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">✓ applied</span>
                    )}
                  </td>
                  <td className="px-2 py-1 font-mono text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
                    {r.expectedHex}
                  </td>
                  <td
                    className={[
                      'px-2 py-1 font-mono max-w-[120px] truncate',
                      r.stockMismatch
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-400 dark:text-gray-500',
                    ].join(' ')}
                  >
                    {r.actualStockHex}
                  </td>
                  <td className="px-2 py-1 font-mono text-blue-600 dark:text-blue-400 max-w-[120px] truncate">
                    {r.applied ? r.replacementHex : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.regionResults.length > 20 && (
          <button
            type="button"
            onClick={() => setShowAllRegions((v) => !v)}
            className="mt-2 text-xs text-blue-500 underline hover:text-blue-700 dark:text-blue-400"
          >
            {showAllRegions
              ? 'Show fewer regions'
              : `Show all ${result.regionResults.length} regions`}
          </button>
        )}
      </div>
    </div>
  )
}
