'use client'

// ─── Owner Review Download — Owner-Only UI ────────────────────────────────────
//
// SAFETY CONTRACT:
//   - Patched buffer is ONLY created inside the direct click handler.
//   - Buffer is NEVER stored in React state.
//   - Object URL is created and immediately revoked after download.
//   - Download output is labelled TUNERPRO_REVIEW_ONLY — not customer-ready.
//   - This component does NOT enable MHD encryption.
//   - This component does NOT create .mhd files.
//   - This component does NOT perform any network upload.
//
// Props:
//   result      — completed PatchApplyResult from applyPatches()
//   stockBuffer — the original stock BIN ArrayBuffer (not modified)
//   pkg         — the loaded AppSafePatchPackage used in the review
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { PatchApplyResult, AppSafePatchPackage } from '@/types/tune-program'
import {
  verifyReviewDownloadGates,
  buildReviewBinForDownload,
  buildReviewManifest,
  makeManifestFilename,
  downloadBlob,
} from '@/lib/tune-program/reviewBinDownload'
import { makeCustomerReviewFilename } from '@/lib/tune-program/reviewFilename'

/** Selection metadata used for the review summary + customer filename. */
export interface ReviewSelection {
  romId:      string
  stage:      string
  fuel:       string
  /** turbo type token, e.g. 'stock', 'n20-map-hybrid-base' */
  turboType:  string
  stageLabel: string
  turboLabel: string
  fuelLabel:  string
}

interface Props {
  result:      PatchApplyResult
  stockBuffer: ArrayBuffer
  pkg:         AppSafePatchPackage
  selection?:  ReviewSelection
}

type DownloadPhase =
  | { phase: 'idle' }
  | { phase: 'building' }
  | { phase: 'done' }
  | { phase: 'error'; message: string }

export default function OwnerReviewDownload({ result, stockBuffer, pkg, selection }: Props) {
  const [binPhase,      setBinPhase]      = useState<DownloadPhase>({ phase: 'idle' })
  const [manifestPhase, setManifestPhase] = useState<DownloadPhase>({ phase: 'idle' })

  // ── Clean review check — must have 0 mismatches to enable download ────────
  const isClean = result.stockMismatchCount === 0 && result.status === 'success'

  // ── "Download Review BIN for TunerPro" handler ────────────────────────────
  async function handleDownloadBin() {
    if (!isClean) return

    // Verify all safety gates inside the click handler
    const gateResult = verifyReviewDownloadGates(result)
    if (!gateResult.pass) {
      setBinPhase({ phase: 'error', message: gateResult.reason })
      return
    }

    setBinPhase({ phase: 'building' })
    try {
      // Build the patched buffer — lives only in this try block
      const patchedBuffer = await buildReviewBinForDownload(stockBuffer, pkg)

      // Customer-facing filename (e.g. I8A0S_Stage2Plus_E50_StockTurbo_REVIEW.bin)
      // falls back to package fields when no selection metadata is supplied.
      const filename = selection
        ? makeCustomerReviewFilename({
            romId:     selection.romId || pkg.romId,
            stage:     selection.stage || pkg.stage,
            fuel:      selection.fuel  || pkg.fuel,
            turboType: selection.turboType,
          })
        : makeCustomerReviewFilename({
            romId: pkg.romId, stage: pkg.stage, fuel: pkg.fuel, turboType: 'stock',
          })

      downloadBlob(
        new Blob([patchedBuffer], { type: 'application/octet-stream' }),
        filename,
      )
      // patchedBuffer is not stored — goes out of scope here

      setBinPhase({ phase: 'done' })
      setTimeout(() => setBinPhase({ phase: 'idle' }), 3000)
    } catch (err) {
      setBinPhase({
        phase:   'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ── "Download Review Manifest" handler ────────────────────────────────────
  function handleDownloadManifest() {
    if (!isClean) return

    const gateResult = verifyReviewDownloadGates(result)
    if (!gateResult.pass) {
      setManifestPhase({ phase: 'error', message: gateResult.reason })
      return
    }

    try {
      const ts       = new Date().toISOString().replace(/:/g, '').split('.')[0] + 'Z'
      const manifest = buildReviewManifest(result, pkg, ts)
      const filename = makeManifestFilename(pkg, ts)

      downloadBlob(
        new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }),
        filename,
      )

      setManifestPhase({ phase: 'done' })
      setTimeout(() => setManifestPhase({ phase: 'idle' }), 3000)
    } catch (err) {
      setManifestPhase({
        phase:   'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{
      background: isClean ? '#040f08' : '#0a0a0a',
      border: `1px solid ${isClean ? '#16a34a44' : '#1e1e1e'}`,
      borderRadius: '0.75rem',
      overflow: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        padding: '0.85rem 1.1rem',
        background: isClean ? '#061a0e' : '#0d0d0d',
        borderBottom: `1px solid ${isClean ? '#16a34a33' : '#1e1e1e'}`,
        display: 'flex', gap: '0.65rem', alignItems: 'center',
      }}>
        <span style={{ fontSize: '1.1rem' }}>{isClean ? '⬇️' : '🔒'}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: isClean ? '#4ade80' : '#4b5563' }}>
            {isClean
              ? 'OWNER REVIEW DOWNLOAD — TunerPro Review Only'
              : 'DOWNLOAD LOCKED — Mismatches Detected'}
          </p>
        </div>
        <span style={{
          fontSize: '0.65rem', fontFamily: 'monospace',
          color: isClean ? '#16a34a' : '#374151',
          background: isClean ? '#052e16' : '#111',
          border: `1px solid ${isClean ? '#16a34a44' : '#1e1e1e'}`,
          padding: '0.15rem 0.45rem', borderRadius: '0.3rem',
        }}>
          TUNERPRO_REVIEW_ONLY
        </span>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div style={{ padding: '1rem 1.1rem' }}>

        {/* ── Lock message when not clean ──────────────────── */}
        {!isClean && (
          <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <span style={{ color: '#dc2626', fontSize: '0.85rem', flexShrink: 0, marginTop: '0.05rem' }}>⛔</span>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6 }}>
              Download is blocked. The patch review found{' '}
              <strong style={{ color: '#f87171' }}>{result.stockMismatchCount} stock-byte mismatch(es)</strong>.
              A clean review (0 mismatches) is required before owner download is enabled.
            </p>
          </div>
        )}

        {/* ── Warning block (always shown) ─────────────────── */}
        <div style={{
          background: '#1a0f00',
          border: '1px solid #854d0e44',
          borderRadius: '0.5rem',
          padding: '0.65rem 0.85rem',
          marginBottom: '1rem',
          display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.05rem' }}>⚠️</span>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#d97706', lineHeight: 1.65 }}>
            <strong style={{ color: '#fbbf24' }}>Owner review only.</strong>{' '}
            Not customer-ready. Not flash-approved. Open in TunerPro and manually compare
            against the source XDF before any release. MHD encryption and VIN locking require
            a separate, explicit owner-approved step outside this app.
          </p>
        </div>

        {/* ── Package info row ─────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
          padding: '0.6rem 0.75rem',
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '0.45rem',
          marginBottom: '1rem',
        }}>
          {[
            { label: 'Package',    value: pkg.packageId },
            { label: 'ROM',        value: selection?.romId || pkg.romId },
            { label: 'Stage',      value: selection?.stageLabel || pkg.stage },
            { label: 'Fuel',       value: selection?.fuelLabel || pkg.fuel.toUpperCase() },
            { label: 'Turbo type', value: selection?.turboLabel || 'Stock Turbo' },
            { label: 'Status',     value: 'READY' },
            { label: 'Patch count', value: String(pkg.patchRegionCount) },
            { label: 'Mismatches', value: String(result.stockMismatchCount), danger: result.stockMismatchCount > 0 },
          ].map(({ label, value, danger }) => (
            <div key={label}>
              <p style={{ margin: '0 0 0.1rem', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#374151', fontWeight: 600 }}>
                {label}
              </p>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: danger ? '#ef4444' : '#9ca3af' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Review-only disclaimer (exact wording) ───────── */}
        <div style={{
          background: '#0d1117', border: '1px solid #21262d', borderRadius: '0.5rem',
          padding: '0.65rem 0.85rem', marginBottom: '1rem',
        }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.6 }}>
            <strong style={{ color: '#c9d1d9' }}>Review-only disclaimer:</strong>{' '}
            This is a review-mode generated BIN. Verify the file in TunerPro/WinOLS and confirm
            checksums before flashing. Use at your own risk.
          </p>
        </div>

        {/* ── Download buttons ─────────────────────────────── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.75rem' }}>

          {/* BIN download */}
          <button
            disabled={!isClean || binPhase.phase === 'building'}
            onClick={handleDownloadBin}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              background:
                !isClean                      ? '#0d0d0d'
                : binPhase.phase === 'done'   ? '#052e16'
                : binPhase.phase === 'error'  ? '#1a0d00'
                : binPhase.phase === 'building'? '#0d1525'
                : '#0a1f0d',
              border: `1px solid ${
                !isClean                       ? '#1a1a1a'
                : binPhase.phase === 'done'    ? '#16a34a'
                : binPhase.phase === 'error'   ? '#854d0e'
                : binPhase.phase === 'building'? '#1d4ed8'
                : '#16a34a55'
              }`,
              borderRadius: '0.45rem',
              cursor: isClean && binPhase.phase !== 'building' ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: '0.85rem',
              color:
                !isClean                       ? '#374151'
                : binPhase.phase === 'done'    ? '#4ade80'
                : binPhase.phase === 'error'   ? '#fbbf24'
                : binPhase.phase === 'building'? '#93c5fd'
                : '#86efac',
              transition: 'all 0.15s',
            }}
          >
            <span>
              {binPhase.phase === 'building' ? '⏳'
                : binPhase.phase === 'done'  ? '✅'
                : binPhase.phase === 'error' ? '⚠️'
                : '⬇️'}
            </span>
            {binPhase.phase === 'building' ? 'Building…'
              : binPhase.phase === 'done'  ? 'Downloaded'
              : binPhase.phase === 'error' ? 'Failed'
              : 'Download Review BIN'}
          </button>

          {/* Manifest download */}
          <button
            disabled={!isClean || manifestPhase.phase === 'building'}
            onClick={handleDownloadManifest}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              background:
                !isClean                          ? '#0d0d0d'
                : manifestPhase.phase === 'done'  ? '#052e16'
                : manifestPhase.phase === 'error' ? '#1a0d00'
                : '#0a0f1a',
              border: `1px solid ${
                !isClean                           ? '#1a1a1a'
                : manifestPhase.phase === 'done'   ? '#16a34a'
                : manifestPhase.phase === 'error'  ? '#854d0e'
                : '#1e3a8a55'
              }`,
              borderRadius: '0.45rem',
              cursor: isClean && manifestPhase.phase !== 'building' ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: '0.85rem',
              color:
                !isClean                           ? '#374151'
                : manifestPhase.phase === 'done'   ? '#4ade80'
                : manifestPhase.phase === 'error'  ? '#fbbf24'
                : '#93c5fd',
              transition: 'all 0.15s',
            }}
          >
            <span>
              {manifestPhase.phase === 'done'  ? '✅'
                : manifestPhase.phase === 'error' ? '⚠️'
                : '📄'}
            </span>
            {manifestPhase.phase === 'done'  ? 'Downloaded'
              : manifestPhase.phase === 'error' ? 'Failed'
              : 'Download Review Manifest'}
          </button>
        </div>

        {/* ── Error messages ────────────────────────────────── */}
        {binPhase.phase === 'error' && (
          <div style={{ padding: '0.6rem 0.85rem', background: '#1a0f00', border: '1px solid #854d0e55', borderRadius: '0.4rem', marginBottom: '0.5rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.75rem', color: '#fbbf24' }}>BIN Download Error</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#d97706', lineHeight: 1.5 }}>{binPhase.message}</p>
            <button
              onClick={() => setBinPhase({ phase: 'idle' })}
              style={{ marginTop: '0.45rem', padding: '0.2rem 0.6rem', background: 'transparent', border: '1px solid #444', borderRadius: '0.3rem', color: '#666', cursor: 'pointer', fontSize: '0.72rem' }}>
              ↺ Dismiss
            </button>
          </div>
        )}
        {manifestPhase.phase === 'error' && (
          <div style={{ padding: '0.6rem 0.85rem', background: '#1a0f00', border: '1px solid #854d0e55', borderRadius: '0.4rem', marginBottom: '0.5rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.75rem', color: '#fbbf24' }}>Manifest Download Error</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#d97706', lineHeight: 1.5 }}>{manifestPhase.message}</p>
            <button
              onClick={() => setManifestPhase({ phase: 'idle' })}
              style={{ marginTop: '0.45rem', padding: '0.2rem 0.6rem', background: 'transparent', border: '1px solid #444', borderRadius: '0.3rem', color: '#666', cursor: 'pointer', fontSize: '0.72rem' }}>
              ↺ Dismiss
            </button>
          </div>
        )}

        {/* ── Safety field table ────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.65rem', borderTop: '1px solid #111' }}>
          {[
            { label: 'encryptionApproved',   value: 'false', color: '#ef4444' },
            { label: 'mhdEncryptionAllowed', value: 'false', color: '#ef4444' },
            { label: 'customerReady',        value: 'false', color: '#ef4444' },
            { label: 'flashApproved',        value: 'false', color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p style={{ margin: '0 0 0.1rem', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#374151', fontWeight: 600 }}>{label}</p>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.72rem', color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
