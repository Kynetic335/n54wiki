// ─── N54 Patch Apply Engine — Client-Side, Review Mode Only ───────────────────
//
// SAFETY CONTRACT:
//   outputMode:           'STANDARD_BIN_REVIEW_ONLY'  — hard-coded, never changes
//   ownerReviewRequired:  true                         — hard-coded
//   encryptionApproved:   false                        — hard-coded
//   mhdEncryptionAllowed: false                        — hard-coded
//
// This engine applies patch regions to a 2MB N54 ROM buffer in-memory and
// returns a detailed review result. It does NOT:
//   - Return the patched buffer to the caller
//   - Enable download of the patched BIN
//   - Connect to TuningMapBuilder-v6.exe or the MHD encryption pipeline
//   - Write any files to disk
//
// The patched SHA-256 is computed and returned for review purposes only.
// Real flashing still requires the external flasher (MHD / N54 Quickflash)
// which recalculates the excluded ROM CRC byte at 0x041366 after apply.
//
// IMPORTANT: This module uses browser Web Crypto API (crypto.subtle).
// Import only in 'use client' components.
//
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AppSafePatchPackage,
  AppSafePatchRegion,
  RegionApplyResult,
  PatchApplyResult,
  PatchApplyStatus,
} from '@/types/tune-program'

// ─── Constants ────────────────────────────────────────────────────────────────

export const ROM_SIZE = 2_097_152 // 0x200000 — all N54 MSD80 ROMs

// ─── Hex utilities ────────────────────────────────────────────────────────────

/**
 * Parse a space-separated hex string ("d7 03 48 02 8f") into a Uint8Array.
 * Throws if any token is not a valid 2-char hex byte.
 */
function parseHexString(hex: string): Uint8Array {
  const tokens = hex.trim().split(/\s+/)
  const arr = new Uint8Array(tokens.length)
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (!/^[0-9a-f]{2}$/i.test(t)) {
      throw new Error(`Invalid hex token at index ${i}: "${t}"`)
    }
    arr[i] = parseInt(t, 16)
  }
  return arr
}

/**
 * Format a Uint8Array slice as space-separated lowercase hex.
 * Used for displaying actual stock bytes in mismatch reporting.
 */
function formatHex(arr: Uint8Array, offset: number, length: number): string {
  const parts: string[] = []
  for (let i = 0; i < length; i++) {
    parts.push(arr[offset + i].toString(16).padStart(2, '0'))
  }
  return parts.join(' ')
}

// ─── SHA-256 via Web Crypto API ───────────────────────────────────────────────

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('crypto.subtle unavailable — ensure page is served over HTTPS or localhost.')
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Package validation ───────────────────────────────────────────────────────

/**
 * Validate that a loaded package is structurally safe to apply.
 * Does not modify any data — pure checks only.
 */
export function validatePackage(pkg: AppSafePatchPackage): string[] {
  const errors: string[] = []

  if (!pkg.packageId) errors.push('Missing packageId')
  if (!pkg.romId)     errors.push('Missing romId')
  if (!pkg.stockSha256 || !/^[0-9a-f]{64}$/.test(pkg.stockSha256)) {
    errors.push('Invalid or missing stockSha256')
  }

  // Enforce safety gate fields
  if (pkg.outputMode !== 'STANDARD_BIN_REVIEW_ONLY') {
    errors.push(`Unexpected outputMode: "${pkg.outputMode}". Only STANDARD_BIN_REVIEW_ONLY is permitted.`)
  }
  if (pkg.ownerReviewRequired !== true) {
    errors.push('ownerReviewRequired must be true')
  }
  if (pkg.encryptionApproved !== false) {
    errors.push('encryptionApproved must be false in app-safe packages')
  }
  if (pkg.mhdEncryptionAllowed !== false) {
    errors.push('mhdEncryptionAllowed must be false in app-safe packages')
  }
  if (!pkg.safeForAppPackage) {
    errors.push('Package is not marked safeForAppPackage — cannot apply')
  }

  // Region array
  if (!Array.isArray(pkg.patchRegions) || pkg.patchRegions.length === 0) {
    errors.push('patchRegions is empty or missing')
  } else {
    for (let i = 0; i < pkg.patchRegions.length; i++) {
      const r = pkg.patchRegions[i]
      if (typeof r.offset !== 'number' || r.offset < 0 || r.offset >= ROM_SIZE) {
        errors.push(`Region[${i}] offset=${r.offset} is out of ROM bounds`)
      }
      if (typeof r.byteCount !== 'number' || r.byteCount < 1) {
        errors.push(`Region[${i}] byteCount=${r.byteCount} is invalid`)
      }
      if (r.offset + r.byteCount > ROM_SIZE) {
        errors.push(`Region[${i}] offset+byteCount overflows ROM bounds`)
      }
      const stockTokens = r.expectedStockHex.trim().split(/\s+/).length
      const replTokens  = r.replacementHex.trim().split(/\s+/).length
      if (stockTokens !== r.byteCount) {
        errors.push(`Region[${i}] expectedStockHex token count (${stockTokens}) ≠ byteCount (${r.byteCount})`)
      }
      if (replTokens !== r.byteCount) {
        errors.push(`Region[${i}] replacementHex token count (${replTokens}) ≠ byteCount (${r.byteCount})`)
      }
    }
  }

  return errors
}

// ─── Core apply engine ────────────────────────────────────────────────────────

/**
 * Apply patch regions from an app-safe package to a ROM ArrayBuffer in-memory.
 *
 * REVIEW MODE ONLY:
 *   - The patched buffer is created internally and immediately discarded.
 *   - Only the SHA-256 hash of the patched result is returned.
 *   - No buffer, no Blob, no download link is produced.
 *
 * @param buffer  ArrayBuffer of the user's uploaded BIN (unmodified — engine copies it)
 * @param pkg     App-safe patch package (loaded from data/tune-program/patch-packages/)
 * @returns       PatchApplyResult — review data only, no patched buffer
 */
export async function applyPatches(
  buffer: ArrayBuffer,
  pkg: AppSafePatchPackage
): Promise<PatchApplyResult> {
  const errors: string[] = []
  const notes:  string[] = []

  // ── 0. Package validation ──────────────────────────────────────────────────
  const pkgErrors = validatePackage(pkg)
  if (pkgErrors.length > 0) {
    return buildErrorResult(pkg, buffer, pkgErrors)
  }

  // ── 1. Input buffer size check ─────────────────────────────────────────────
  if (buffer.byteLength !== ROM_SIZE) {
    errors.push(
      `Input BIN is ${buffer.byteLength.toLocaleString()} bytes — expected ${ROM_SIZE.toLocaleString()} bytes (2 MB). ` +
      'Upload the correct stock BIN.'
    )
    return buildErrorResult(pkg, buffer, errors)
  }

  // ── 2. Compute input SHA-256 ───────────────────────────────────────────────
  const inputSha256 = await sha256Hex(buffer)
  const stockSha256Match = inputSha256 === pkg.stockSha256

  let applyStatus: PatchApplyStatus
  if (stockSha256Match) {
    applyStatus = 'stock_verified'
  } else {
    applyStatus = 'stock_sha_mismatch'
    notes.push(
      `Input BIN SHA-256 (${inputSha256.slice(0, 12)}…) does not match package stockSha256 (${pkg.stockSha256.slice(0, 12)}…). ` +
      'This may be a different ROM version, an already-patched BIN, or the wrong file. ' +
      'Proceeding with apply — individual region mismatches will be reported.'
    )
  }

  // ── 3. Create mutable working copy ────────────────────────────────────────
  // The patched buffer is never returned — SHA-256 only.
  const patchedBuffer = buffer.slice(0)
  const view          = new Uint8Array(patchedBuffer)
  const stockView     = new Uint8Array(buffer)

  // ── 4. Apply regions ──────────────────────────────────────────────────────
  const regionResults: RegionApplyResult[] = []
  let appliedCount       = 0
  let stockMismatchCount = 0

  for (let i = 0; i < pkg.patchRegions.length; i++) {
    const region = pkg.patchRegions[i]
    const regionResult = applyRegion(i, region, stockView, view)
    regionResults.push(regionResult)
    if (regionResult.applied)       appliedCount++
    if (regionResult.stockMismatch) stockMismatchCount++
  }

  // ── 5. Compute patched SHA-256 ────────────────────────────────────────────
  const patchedSha256       = await sha256Hex(patchedBuffer as ArrayBuffer)
  const patchedMatchesTuned = patchedSha256 === pkg.tunedSha256

  if (!patchedMatchesTuned) {
    notes.push(
      'Patched BIN hash does not match tunedSha256 — this is expected. ' +
      'The excluded ROM CRC byte (0x041366) is never patched; the external flasher ' +
      '(MHD / N54 Quickflash) recalculates it during flashing.'
    )
  }

  // ── 6. Final status ───────────────────────────────────────────────────────
  if (stockMismatchCount > 0) {
    applyStatus = 'region_errors'
    errors.push(
      `${stockMismatchCount} region(s) had unexpected stock bytes. ` +
      'This may indicate a partially-patched BIN or wrong ROM version. ' +
      'Review per-region results before proceeding.'
    )
  } else if (applyStatus === 'stock_verified' || applyStatus === 'stock_sha_mismatch') {
    applyStatus = 'success'
  }

  // Ensure patchedBuffer is garbage-collected — do not leak it
  // (JS has no explicit free, but we avoid exposing it via return value)

  return {
    // Safety gate — hard-coded, non-negotiable
    outputMode:           'STANDARD_BIN_REVIEW_ONLY',
    ownerReviewRequired:  true,
    encryptionApproved:   false,
    mhdEncryptionAllowed: false,

    packageId: pkg.packageId,
    romId:     pkg.romId,
    stage:     pkg.stage,
    fuel:      pkg.fuel,

    inputSha256,
    stockSha256Expected:  pkg.stockSha256,
    stockSha256Match,

    status:             applyStatus,
    totalRegions:       pkg.patchRegions.length,
    appliedCount,
    stockMismatchCount,

    patchedSha256,
    tunedSha256Expected:  pkg.tunedSha256,
    patchedMatchesTuned,

    regionResults,
    errors,
    notes,
  }
}

// ─── Region apply ─────────────────────────────────────────────────────────────

function applyRegion(
  i:        number,
  region:   AppSafePatchRegion,
  stock:    Uint8Array,
  patched:  Uint8Array
): RegionApplyResult {
  const { offset, byteCount, expectedStockHex, replacementHex, mapName, category } = region

  // Parse hex strings
  let expectedBytes: Uint8Array
  let replacementBytes: Uint8Array
  try {
    expectedBytes   = parseHexString(expectedStockHex)
    replacementBytes = parseHexString(replacementHex)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      regionIndex: i, offset, byteCount, mapName, category,
      applied: false, stockMismatch: false,
      expectedHex:    expectedStockHex,
      actualStockHex: formatHex(stock, offset, byteCount),
      replacementHex,
    }
  }

  // Check actual stock bytes
  let stockMismatch = false
  const actualStockHex = formatHex(stock, offset, byteCount)
  for (let j = 0; j < byteCount; j++) {
    if (stock[offset + j] !== expectedBytes[j]) {
      stockMismatch = true
      break
    }
  }

  // Apply replacement bytes regardless of stock mismatch
  // (mismatch is reported but we still write — lets review show full picture)
  for (let j = 0; j < byteCount; j++) {
    patched[offset + j] = replacementBytes[j]
  }

  return {
    regionIndex: i,
    offset,
    byteCount,
    mapName,
    category,
    applied: true,
    stockMismatch,
    expectedHex:    expectedStockHex,
    actualStockHex,
    replacementHex,
  }
}

// ─── Error result builder ─────────────────────────────────────────────────────

async function buildErrorResult(
  pkg:    AppSafePatchPackage,
  buffer: ArrayBuffer,
  errors: string[]
): Promise<PatchApplyResult> {
  let inputSha256 = ''
  try { inputSha256 = await sha256Hex(buffer) } catch { /* swallow */ }

  return {
    outputMode:           'STANDARD_BIN_REVIEW_ONLY',
    ownerReviewRequired:  true,
    encryptionApproved:   false,
    mhdEncryptionAllowed: false,

    packageId: pkg.packageId ?? '(unknown)',
    romId:     pkg.romId     ?? '(unknown)',
    stage:     pkg.stage     ?? '(unknown)',
    fuel:      pkg.fuel      ?? '(unknown)',

    inputSha256,
    stockSha256Expected: pkg.stockSha256 ?? '',
    stockSha256Match:    false,

    status:             'region_errors',
    totalRegions:       pkg.patchRegions?.length ?? 0,
    appliedCount:       0,
    stockMismatchCount: 0,

    patchedSha256:       '',
    tunedSha256Expected: pkg.tunedSha256 ?? '',
    patchedMatchesTuned: false,

    regionResults: [],
    errors,
    notes:  [],
  }
}

// ─── Package loader ───────────────────────────────────────────────────────────

/**
 * Load an app-safe patch package by packageId from the public data directory.
 * Validates the package before returning it.
 *
 * @param packageId  e.g. "i8a0s-stage1-91-v1"
 * @param romId      ROM family, used to build the fetch path (e.g. "I8A0S" → "i8a0s/")
 * @returns          Validated AppSafePatchPackage
 * @throws           If the package cannot be fetched, parsed, or validated
 */
export async function loadPackage(
  packageId: string,
  romId: string
): Promise<AppSafePatchPackage> {
  const romDir  = romId.toLowerCase()
  const url     = `/tune-program/patch-packages/${romDir}/${packageId}.json`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load package "${packageId}": HTTP ${res.status} ${res.statusText}`)
  }

  const pkg = (await res.json()) as AppSafePatchPackage

  const errors = validatePackage(pkg)
  if (errors.length > 0) {
    throw new Error(`Package "${packageId}" failed validation:\n${errors.join('\n')}`)
  }

  return pkg
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Hex offset as a 6-digit uppercase hex string, e.g. 271886 → "0x042A0E" */
export function toHexOffset(n: number): string {
  return `0x${n.toString(16).toUpperCase().padStart(6, '0')}`
}

/** Status label for display */
export function statusLabel(status: PatchApplyResult['status']): string {
  switch (status) {
    case 'stock_verified':     return 'Stock BIN verified ✓'
    case 'unknown_stock':      return 'Unknown BIN (2MB valid)'
    case 'stock_sha_mismatch': return 'Stock SHA-256 mismatch'
    case 'region_errors':      return 'Region byte mismatches'
    case 'success':            return 'All regions applied'
  }
}

/** Colour token for status badge */
export function statusColor(status: PatchApplyResult['status']): string {
  switch (status) {
    case 'success':
    case 'stock_verified':     return '#10b981'  // green
    case 'unknown_stock':      return '#f59e0b'  // amber
    case 'stock_sha_mismatch':
    case 'region_errors':      return '#ef4444'  // red
  }
}
