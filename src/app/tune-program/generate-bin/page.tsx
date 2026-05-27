'use client'

// ─── Generate BIN — Owner Review Mode ─────────────────────────────────────────
//
// Route: /tune-program/generate-bin
//
// Purpose:
//   Internal owner-review tool for generating a patched BIN from a stock BIN
//   + app-safe patch package. NOT a customer release. NOT a flasher.
//   NOT MHD-locked. External flasher required for any real-world use.
//
// Flow:
//   Step 1: Select ROM (I8A0S / INA0S = READY; IJE0S = NEEDS_AUDIT; IKM0S = NOT_BUILT)
//   Step 2: Select package from matrix (READY only; NEEDS_AUDIT shown disabled)
//   Step 3: Upload stock BIN (validated: extension + size + SHA-256 match)
//   Step 4: Run review (applies patches in browser, shows per-region results)
//   Step 5: Owner download (only if review PASS; re-applies + URL.createObjectURL)
//
// Privacy:
//   - No private file paths are read or exposed
//   - Packages fetched from /public/tune-program/patch-packages/ (already public)
//   - Original stock buffer stored in useRef (not React state)
//   - Patched buffer lives only inside the download click handler
//
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react'
import { getRomGateStatus } from '@/lib/tune-program/packageGates'
import type { PatchPackageManifestEntry } from '@/lib/tune-program/packageGates'
import { applyPatchesReview } from '@/lib/tune-program/patchEngine'
import type { AppSafePatchPackage, PatchApplyResult } from '@/types/tune-program'
import type { BinValidationResult } from '@/lib/tune-program/binValidator'

import { SafetyDisclaimer } from './components/SafetyDisclaimer'
import { RomStatusBadge } from './components/RomStatusBadge'
import { PackageMatrix } from './components/PackageMatrix'
import { BinUploader } from './components/BinUploader'
import { ReviewPanel } from './components/ReviewPanel'
import { OwnerDownloadButton } from './components/OwnerDownloadButton'

// ─── Supported ROMs ───────────────────────────────────────────────────────────

type RomId = 'I8A0S' | 'IJE0S' | 'IKM0S' | 'INA0S'

const ROM_ORDER: RomId[] = ['I8A0S', 'INA0S', 'IJE0S', 'IKM0S']

const ROM_DESCRIPTIONS: Record<RomId, string> = {
  I8A0S: 'MT 135i/335i/Z4/1M — MSD80 — most common',
  INA0S: '2010+ 135i/335i — MSD81 — later revision',
  IJE0S: 'AT 135i/335i — MSD80/81 — audit pending',
  IKM0S: 'Regional/late N54 — no v12 source maps yet',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GenerateBinPage() {
  // Step 1: ROM selection
  const [selectedRomId, setSelectedRomId] = useState<RomId | null>(null)

  // Step 2: Package selection
  const [selectedEntry, setSelectedEntry] = useState<PatchPackageManifestEntry | null>(null)
  const [loadedPkg, setLoadedPkg] = useState<AppSafePatchPackage | null>(null)
  const [pkgLoading, setPkgLoading] = useState(false)
  const [pkgError, setPkgError] = useState<string | null>(null)

  // Step 3: BIN upload — buffer stored in ref (not state) to avoid re-renders
  const stockBufferRef = useRef<ArrayBuffer | null>(null)
  const [binValid, setBinValid] = useState(false)
  const [binResult, setBinResult] = useState<BinValidationResult | null>(null)

  // Step 4: Review
  const [reviewResult, setReviewResult] = useState<PatchApplyResult | null>(null)
  const [reviewRunning, setReviewRunning] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRomSelect = useCallback((romId: RomId) => {
    setSelectedRomId(romId)
    setSelectedEntry(null)
    setLoadedPkg(null)
    setPkgError(null)
    stockBufferRef.current = null
    setBinValid(false)
    setBinResult(null)
    setReviewResult(null)
    setReviewError(null)
  }, [])

  const handlePackageSelect = useCallback(async (entry: PatchPackageManifestEntry) => {
    setSelectedEntry(entry)
    setLoadedPkg(null)
    setPkgError(null)
    setPkgLoading(true)
    stockBufferRef.current = null
    setBinValid(false)
    setBinResult(null)
    setReviewResult(null)
    setReviewError(null)

    try {
      const url = `/tune-program/patch-packages/${entry.filename}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to load package (HTTP ${res.status}): ${url}`)
      }
      const pkg = (await res.json()) as AppSafePatchPackage

      // Client-side sanity checks before accepting the package
      if (pkg.outputMode !== 'STANDARD_BIN_REVIEW_ONLY') {
        throw new Error(`Package outputMode is not STANDARD_BIN_REVIEW_ONLY`)
      }
      if (pkg.encryptionApproved) {
        throw new Error(`Package has encryptionApproved: true — blocked`)
      }
      if (pkg.mhdEncryptionAllowed) {
        throw new Error(`Package has mhdEncryptionAllowed: true — blocked`)
      }
      if (!pkg.safeForAppPackage) {
        throw new Error(`Package safeForAppPackage is false — NEEDS_AUDIT`)
      }

      setLoadedPkg(pkg)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setPkgError(message)
    } finally {
      setPkgLoading(false)
    }
  }, [])

  const handleBinValidated = useCallback(
    (buffer: ArrayBuffer, result: BinValidationResult) => {
      stockBufferRef.current = buffer
      setBinValid(true)
      setBinResult(result)
      setReviewResult(null)
      setReviewError(null)
    },
    [],
  )

  const handleBinError = useCallback((result: BinValidationResult) => {
    stockBufferRef.current = null
    setBinValid(false)
    setBinResult(result)
    setReviewResult(null)
  }, [])

  const handleRunReview = useCallback(async () => {
    if (!stockBufferRef.current || !loadedPkg) return

    setReviewRunning(true)
    setReviewResult(null)
    setReviewError(null)

    try {
      const result = await applyPatchesReview(stockBufferRef.current, loadedPkg)
      setReviewResult(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setReviewError(message)
    } finally {
      setReviewRunning(false)
    }
  }, [loadedPkg])

  const reviewPassed = reviewResult?.status === 'success'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-20">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Generate BIN — Owner Review Mode
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Apply a v12 patch package to a stock BIN for TunerPro owner review.
          All processing happens in your browser — no data is uploaded.
        </p>
      </div>

      {/* Safety disclaimer — always visible */}
      <SafetyDisclaimer />

      {/* ── Step 1: ROM Selection ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader step={1} title="Select ROM" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ROM_ORDER.map((romId) => {
            const gateStatus = getRomGateStatus(romId)
            const isSelectable = gateStatus === 'READY'
            const isSelected = selectedRomId === romId

            return (
              <button
                key={romId}
                type="button"
                disabled={!isSelectable}
                onClick={() => isSelectable && handleRomSelect(romId)}
                className={[
                  'flex items-start justify-between rounded-lg border p-3 text-left transition-all',
                  !isSelectable
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/20'
                    : isSelected
                      ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/30'
                      : 'cursor-pointer border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-blue-600',
                ].join(' ')}
              >
                <div>
                  <p className="font-mono font-bold text-gray-800 dark:text-gray-100">{romId}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {ROM_DESCRIPTIONS[romId]}
                  </p>
                  {gateStatus === 'NEEDS_AUDIT' && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      150+ unmatched XDF regions — run audit before enabling
                    </p>
                  )}
                  {gateStatus === 'NOT_BUILT' && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      No v12 source maps — packages not yet built
                    </p>
                  )}
                </div>
                <RomStatusBadge status={gateStatus} />
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Step 2: Package Selection ───────────────────────────────────────── */}
      {selectedRomId && (
        <section className="space-y-3">
          <SectionHeader step={2} title={`Select Package — ${selectedRomId}`} />
          <PackageMatrix
            romId={selectedRomId}
            selectedPackageId={selectedEntry?.packageId ?? null}
            onSelect={handlePackageSelect}
          />

          {pkgLoading && (
            <p className="text-xs text-gray-400">Loading package…</p>
          )}
          {pkgError && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              Failed to load package: {pkgError}
            </div>
          )}
          {loadedPkg && (
            <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
              ✓ Loaded{' '}
              <span className="font-mono font-medium">{loadedPkg.packageId}</span>{' '}
              — {loadedPkg.patchRegionCount} regions
              {' · '}
              <span className="font-mono">{loadedPkg.outputMode}</span>
            </div>
          )}
        </section>
      )}

      {/* ── Step 3: BIN Upload ──────────────────────────────────────────────── */}
      {loadedPkg && (
        <section className="space-y-3">
          <SectionHeader
            step={3}
            title={`Upload Stock BIN — ${selectedRomId}`}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Upload the unmodified stock BIN read directly from the vehicle via MHD.
            SHA-256 must match the known {selectedRomId} stock hash.
          </p>
          <BinUploader
            romId={selectedRomId!}
            onValidated={handleBinValidated}
            onError={handleBinError}
            disabled={!loadedPkg}
          />
        </section>
      )}

      {/* ── Step 4: Review ──────────────────────────────────────────────────── */}
      {binValid && loadedPkg && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader step={4} title="Run Review" />
            <button
              type="button"
              onClick={handleRunReview}
              disabled={reviewRunning}
              className={[
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                reviewRunning
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
              ].join(' ')}
            >
              {reviewRunning ? 'Running…' : reviewResult ? 'Re-run Review' : 'Run Review'}
            </button>
          </div>

          <ReviewPanel
            result={reviewResult}
            isRunning={reviewRunning}
            error={reviewError}
          />
        </section>
      )}

      {/* ── Step 5: Owner Download ──────────────────────────────────────────── */}
      {reviewResult && (
        <section className="space-y-3">
          <SectionHeader step={5} title="Owner Review Download" />
          <OwnerDownloadButton
            reviewPassed={reviewPassed}
            stockBuffer={stockBufferRef.current}
            pkg={loadedPkg}
          />
        </section>
      )}
    </div>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white dark:bg-blue-500">
        {step}
      </span>
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
  )
}
