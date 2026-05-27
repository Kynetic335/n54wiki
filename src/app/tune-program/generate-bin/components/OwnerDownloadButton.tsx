'use client'

// ─── Owner Download Button ─────────────────────────────────────────────────────
// Gated download for the owner-review patched BIN.
//
// SECURITY DESIGN:
//   - Re-applies patches on every click (does NOT read from React state buffer)
//   - Patched Uint8Array lives only inside the click handler callback
//   - URL.createObjectURL is called ONCE inside the handler
//   - URL.revokeObjectURL is called IMMEDIATELY after download is triggered
//   - No patched buffer is ever stored in React state, localStorage, or sessionStorage
//
// GATES (all must be true to enable download):
//   - reviewPassed === true (result.status === 'success')
//   - stockBuffer is not null (validated BIN loaded)
//   - pkg is not null (package selected and loaded)
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { applyPatchesForDownload } from '@/lib/tune-program/patchEngine'
import type { AppSafePatchPackage, PatchApplyResult } from '@/types/tune-program'

interface OwnerDownloadButtonProps {
  /** Must be true (result.status === 'success') before download is enabled */
  reviewPassed: boolean
  /** Reference to the validated stock BIN buffer */
  stockBuffer: ArrayBuffer | null
  /** The loaded patch package */
  pkg: AppSafePatchPackage | null
  /** Called when download completes (pass or fail) */
  onDownloadResult?: (result: PatchApplyResult) => void
}

type DownloadState = 'idle' | 'applying' | 'done' | 'error'

export function OwnerDownloadButton({
  reviewPassed,
  stockBuffer,
  pkg,
  onDownloadResult,
}: OwnerDownloadButtonProps) {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const isEnabled = reviewPassed && stockBuffer !== null && pkg !== null

  const handleDownload = async () => {
    if (!isEnabled || !stockBuffer || !pkg) return

    setDownloadState('applying')
    setDownloadError(null)

    try {
      const { result, patchedBytes } = await applyPatchesForDownload(stockBuffer, pkg)

      // Double-gate: if re-apply unexpectedly fails, abort
      if (result.status !== 'success') {
        setDownloadState('error')
        setDownloadError(
          `Re-apply failed (status: ${result.status}). ` +
            'Patched BIN was not created. Review the errors above and try again.',
        )
        onDownloadResult?.(result)
        return
      }

      // Create object URL → trigger download → revoke URL immediately
      const blob = new Blob([patchedBytes], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${pkg.packageId}-review.bin`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Revoke immediately — buffer is no longer needed
      URL.revokeObjectURL(url)

      setDownloadState('done')
      onDownloadResult?.(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setDownloadState('error')
      setDownloadError(message)
    }
  }

  const blockReason = !reviewPassed
    ? 'Run review first — download requires a PASS result'
    : !stockBuffer
      ? 'Upload a validated stock BIN first'
      : !pkg
        ? 'Load a package first'
        : null

  return (
    <div className="space-y-2">
      {/* Owner-review label */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase dark:border-gray-700 dark:bg-gray-800">
          OWNER REVIEW ONLY
        </span>
        <span>Raw unencrypted BIN — for TunerPro inspection only</span>
      </div>

      <button
        type="button"
        disabled={!isEnabled || downloadState === 'applying'}
        onClick={handleDownload}
        className={[
          'flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all',
          isEnabled && downloadState !== 'applying'
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600'
            : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
        ].join(' ')}
      >
        {downloadState === 'applying' ? (
          <>
            <span>Applying patches…</span>
          </>
        ) : downloadState === 'done' ? (
          <>
            <span>✅ Downloaded</span>
            <span className="font-mono text-xs font-normal opacity-80">
              {pkg?.packageId}-review.bin
            </span>
          </>
        ) : (
          <>
            <span>⬇ Owner Review Download</span>
            {pkg && (
              <span className="font-mono text-xs font-normal opacity-70">
                {pkg.packageId}-review.bin
              </span>
            )}
          </>
        )}
      </button>

      {/* Blocked reason */}
      {blockReason && (
        <p className="text-xs text-gray-400 dark:text-gray-500">⚠ {blockReason}</p>
      )}

      {/* Download error */}
      {downloadState === 'error' && downloadError && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {downloadError}
        </div>
      )}

      {/* Re-download */}
      {downloadState === 'done' && (
        <button
          type="button"
          onClick={() => setDownloadState('idle')}
          className="text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500"
        >
          Download again
        </button>
      )}
    </div>
  )
}
