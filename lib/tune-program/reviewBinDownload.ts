// ─── Review BIN Download — Owner-Only ─────────────────────────────────────────
//
// SAFETY CONTRACT — read before modifying:
//   1. The patched buffer is ONLY created inside a direct click handler.
//      It must NEVER be created outside a user-initiated event.
//   2. The patched buffer is NEVER stored in React state, module scope,
//      or any other persistent location.
//   3. The object URL is created immediately before download and revoked
//      immediately after — it is never stored beyond the click handler scope.
//   4. This module NEVER writes to the filesystem, network, or localStorage.
//   5. This module NEVER enables MHD encryption or VIN locking.
//   6. Download output is review-only — NOT customer-ready, NOT flash-approved.
//
// Usage pattern (inside a click handler only):
//
//   async function handleDownload() {
//     // 1. Verify gates inside the handler
//     const gateResult = verifyReviewDownloadGates(result)
//     if (!gateResult.pass) { setError(gateResult.reason); return }
//     // 2. Re-apply patches — buffer lives only inside this call
//     const patchedBuffer = await buildReviewBinForDownload(stockBuffer, pkg)
//     // 3. Build filename and trigger download
//     const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15) + 'Z'
//     const filename = makeReviewFilename(pkg, ts)
//     downloadBlob(new Blob([patchedBuffer], { type: 'application/octet-stream' }), filename)
//     // patchedBuffer goes out of scope here — GC eligible
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

import type { AppSafePatchPackage, AppSafePatchRegion, PatchApplyResult } from '@/types/tune-program'
import type { GateResult } from '@/lib/tune-program/patchReviewGate'
import { ROM_SIZE } from '@/lib/tune-program/patchApplyEngine'

// ─── Re-export so consumers only need one import ──────────────────────────────
export type { GateResult }

// ─────────────────────────────────────────────────────────────────────────────
// 1. Gate verification — must be called first, inside the click handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify that a completed PatchApplyResult is safe to produce a download from.
 *
 * All 5 conditions must be true:
 *   - outputMode is STANDARD_BIN_REVIEW_ONLY
 *   - ownerReviewRequired is true
 *   - encryptionApproved is false (hard-wired, never changes)
 *   - mhdEncryptionAllowed is false (hard-wired, never changes)
 *   - stockMismatchCount is 0 (clean apply)
 *
 * A single failing gate aborts the download — no exception.
 */
export function verifyReviewDownloadGates(result: PatchApplyResult): GateResult {
  if (result.outputMode !== 'STANDARD_BIN_REVIEW_ONLY') {
    return { pass: false, reason: `SAFETY: outputMode is "${result.outputMode}", expected STANDARD_BIN_REVIEW_ONLY` }
  }
  if (result.ownerReviewRequired !== true) {
    return { pass: false, reason: 'SAFETY: ownerReviewRequired !== true' }
  }
  if (result.encryptionApproved !== false) {
    return { pass: false, reason: 'SAFETY: encryptionApproved !== false — download blocked' }
  }
  if (result.mhdEncryptionAllowed !== false) {
    return { pass: false, reason: 'SAFETY: mhdEncryptionAllowed !== false — download blocked' }
  }
  if (result.stockMismatchCount !== 0) {
    return {
      pass: false,
      reason:
        `Download blocked: ${result.stockMismatchCount} stock-byte mismatch(es) found. ` +
        'Clean apply required before download.',
    }
  }
  return { pass: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Patch application — only called from inside a direct click handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-apply all patch regions from a verified app-safe package onto a stock BIN buffer.
 * Returns the patched ArrayBuffer.
 *
 * IMPORTANT:
 *   - This function MUST only be called from inside a direct user-gesture handler.
 *   - The returned buffer must NEVER be stored in React state or module scope.
 *   - The caller is responsible for discarding the buffer immediately after use.
 *
 * Throws if:
 *   - stockBuffer is not exactly ROM_SIZE bytes
 *   - safety gate fields are wrong
 *   - any region has a hex string that cannot be parsed
 */
export async function buildReviewBinForDownload(
  stockBuffer: ArrayBuffer,
  pkg: AppSafePatchPackage,
): Promise<ArrayBuffer> {
  // ── Safety gate: size ───────────────────────────────────────────────
  if (stockBuffer.byteLength !== ROM_SIZE) {
    throw new Error(
      `BIN size mismatch: got ${stockBuffer.byteLength.toLocaleString()} bytes, ` +
      `expected exactly ${ROM_SIZE.toLocaleString()} bytes (2 MB).`
    )
  }

  // ── Safety gate: package fields ─────────────────────────────────────
  if (pkg.encryptionApproved !== false) throw new Error('SAFETY: encryptionApproved must be false')
  if (pkg.mhdEncryptionAllowed !== false) throw new Error('SAFETY: mhdEncryptionAllowed must be false')
  if (pkg.outputMode !== 'STANDARD_BIN_REVIEW_ONLY') throw new Error('SAFETY: invalid outputMode')
  if (!pkg.safeForAppPackage) throw new Error('SAFETY: package not marked safeForAppPackage')

  // ── Copy stock buffer ────────────────────────────────────────────────
  const buffer = stockBuffer.slice(0)
  const view   = new Uint8Array(buffer)

  // ── Apply each region ────────────────────────────────────────────────
  for (let i = 0; i < pkg.patchRegions.length; i++) {
    const region = pkg.patchRegions[i]
    applyRegion(view, region, i)
  }

  return buffer
}

/** Apply a single patch region — throws on hex parse error or bounds violation. */
function applyRegion(view: Uint8Array, region: AppSafePatchRegion, index: number): void {
  const replacementBytes = parseHex(region.replacementHex, region.byteCount, index, 'replacementHex')

  if (region.offset < 0 || region.offset + region.byteCount > view.length) {
    throw new Error(
      `Region ${index}: offset 0x${region.offset.toString(16)} + ${region.byteCount} bytes out of range.`
    )
  }

  for (let j = 0; j < region.byteCount; j++) {
    view[region.offset + j] = replacementBytes[j]
  }
}

/** Parse a space-separated hex string into a Uint8Array. */
function parseHex(hex: string, expectedCount: number, regionIndex: number, field: string): Uint8Array {
  const parts = hex.trim().split(/\s+/)
  if (parts.length !== expectedCount) {
    throw new Error(
      `Region ${regionIndex} ${field}: expected ${expectedCount} bytes, got ${parts.length} hex tokens.`
    )
  }
  const bytes = new Uint8Array(expectedCount)
  for (let i = 0; i < parts.length; i++) {
    const val = parseInt(parts[i], 16)
    if (isNaN(val) || val < 0 || val > 255) {
      throw new Error(`Region ${regionIndex} ${field}[${i}]: invalid hex token "${parts[i]}".`)
    }
    bytes[i] = val
  }
  return bytes
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Manifest blob — JSON sidecar for the download
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewManifest {
  _warning:              string
  outputMode:            'STANDARD_BIN_REVIEW_ONLY'
  ownerReviewRequired:   true
  encryptionApproved:    false
  mhdEncryptionAllowed:  false
  customerReady:         false
  flashApproved:         false
  generatedAt:           string
  packageId:             string
  romId:                 string
  stage:                 string
  fuel:                  string
  stockSha256Expected:   string
  stockSha256Match:      boolean
  inputSha256:           string
  patchedSha256:         string
  tunedSha256Expected:   string
  patchedMatchesTuned:   boolean
  totalRegions:          number
  appliedCount:          number
  stockMismatchCount:    number
  status:                string
}

/**
 * Build the review manifest JSON object that accompanies the download.
 * This is pure data — no I/O, no side effects.
 */
export function buildReviewManifest(
  result:    PatchApplyResult,
  pkg:       AppSafePatchPackage,
  timestamp: string,
): ReviewManifest {
  return {
    _warning:
      'OWNER REVIEW ONLY. Not customer-ready. Not flash-approved. ' +
      'Open in TunerPro and manually compare against the source XDF before any release. ' +
      'MHD encryption requires a separate owner-approved step.',
    outputMode:           'STANDARD_BIN_REVIEW_ONLY',
    ownerReviewRequired:  true,
    encryptionApproved:   false,
    mhdEncryptionAllowed: false,
    customerReady:        false,
    flashApproved:        false,
    generatedAt:          timestamp,
    packageId:            pkg.packageId,
    romId:                pkg.romId,
    stage:                pkg.stage,
    fuel:                 pkg.fuel,
    stockSha256Expected:  result.stockSha256Expected,
    stockSha256Match:     result.stockSha256Match,
    inputSha256:          result.inputSha256,
    patchedSha256:        result.patchedSha256,
    tunedSha256Expected:  result.tunedSha256Expected,
    patchedMatchesTuned:  result.patchedMatchesTuned,
    totalRegions:         result.totalRegions,
    appliedCount:         result.appliedCount,
    stockMismatchCount:   result.stockMismatchCount,
    status:               result.status,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Filename generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the download filename for the review BIN.
 * Format: Synergy_N54_<ROM>_<stage>_<fuel>_TUNERPRO_REVIEW_ONLY_<timestamp>.bin
 *
 * Example: Synergy_N54_I8A0S_stage3_e30_TUNERPRO_REVIEW_ONLY_20260525T120530Z.bin
 */
export function makeReviewFilename(pkg: AppSafePatchPackage, timestamp: string): string {
  const rom   = pkg.romId.toUpperCase()
  const stage = pkg.stage.replace(/[^a-zA-Z0-9]/g, '_')
  const fuel  = pkg.fuel.toUpperCase()
  const ts    = timestamp.replace(/[:.]/g, '').replace('T', 'T').slice(0, 16) + 'Z'
  return `Synergy_N54_${rom}_${stage}_${fuel}_TUNERPRO_REVIEW_ONLY_${ts}.bin`
}

/**
 * Build the manifest filename for the JSON sidecar.
 * Format: <binFilename without .bin>.manifest.json
 */
export function makeManifestFilename(pkg: AppSafePatchPackage, timestamp: string): string {
  return makeReviewFilename(pkg, timestamp).replace(/\.bin$/, '.manifest.json')
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Download trigger — creates and immediately revokes object URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trigger a browser file download for the given blob.
 *
 * - Creates an object URL immediately before use.
 * - Revokes the object URL immediately after click() — zero lingering references.
 * - The blob itself goes out of scope in the caller after this returns.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  try {
    const a      = document.createElement('a')
    a.href       = url
    a.download   = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    // Always revoke — even if click throws
    URL.revokeObjectURL(url)
  }
}
