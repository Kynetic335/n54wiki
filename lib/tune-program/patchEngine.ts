// ─── Patch Apply Engine ────────────────────────────────────────────────────────
//
// Applies an app-safe patch package to a stock BIN buffer in the browser.
//
// DESIGN PRINCIPLES:
//   - All patching happens in memory (Uint8Array copy of the stock buffer)
//   - applyPatchesReview():      returns PatchApplyResult only — NO buffer returned
//   - applyPatchesForDownload(): returns result + Uint8Array for one-shot download use
//   - The patched buffer must NEVER be stored in React state
//   - SHA-256 computed via Web Crypto API (crypto.subtle.digest)
//
// SAFETY HARD-GATES (throw on violation):
//   - pkg.outputMode must be 'STANDARD_BIN_REVIEW_ONLY'
//   - pkg.encryptionApproved must be false
//   - pkg.mhdEncryptionAllowed must be false
//   - pkg.safeForAppPackage must be true
//
// PER-REGION LOGIC:
//   1. Parse expectedStockHex → expected byte array
//   2. Read actual bytes from copy at region.offset
//   3. Compare byte-for-byte
//   4. If match: write replacementHex bytes; mark applied: true
//   5. If mismatch: leave bytes unchanged; mark stockMismatch: true
//
// OUTPUT SIZE:
//   - Assert output is exactly 2,097,152 bytes (unchanged from input)
//   - Only bytes in patchRegions are modified; rest is preserved
//
// NOTES:
//   - tunedSha256 in the package will NOT match the patched BIN hash.
//     The ROM CRC byte at 0x041366 is excluded from patch regions.
//     External flashers (MHD, Quickflash) recalculate the CRC on flash.
//     patchedMatchesTuned is therefore expected to be false.
//
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AppSafePatchPackage,
  AppSafePatchRegion,
  PatchApplyResult,
  PatchApplyStatus,
  RegionApplyResult,
} from '@/types/tune-program'

const EXPECTED_SIZE = 2_097_152

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Parse a space-separated hex string into a Uint8Array.
 * Handles both "aa bb cc" and "aabbcc" formats.
 */
export function hexStringToBytes(hex: string): Uint8Array {
  const cleaned = hex.trim()
  if (!cleaned) return new Uint8Array(0)

  const parts = cleaned.includes(' ')
    ? cleaned.split(/\s+/)
    : cleaned.match(/.{1,2}/g) ?? []

  return new Uint8Array(parts.map((h) => parseInt(h, 16)))
}

/**
 * Compute SHA-256 of an ArrayBuffer and return lowercase hex (64 chars).
 * Uses Web Crypto API (browser) or globalThis.crypto (Node/vitest).
 *
 * Accepts ArrayBuffer only. Callers with a Uint8Array should cast
 * `.buffer as ArrayBuffer` — this is safe when the typed array was
 * constructed from `new Uint8Array(n)` or `new Uint8Array(arrayBuffer)`,
 * which always yields a regular ArrayBuffer, never a SharedArrayBuffer.
 */
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Read `count` bytes from `view` starting at `offset` and return as lowercase hex string.
 */
function readHex(view: Uint8Array, offset: number, count: number): string {
  return Array.from(view.subarray(offset, offset + count))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
}

// ─── Safety gate validator ────────────────────────────────────────────────────

function assertSafetyGates(pkg: AppSafePatchPackage): void {
  if (pkg.outputMode !== 'STANDARD_BIN_REVIEW_ONLY') {
    throw new Error(
      `[patchEngine] Safety gate: outputMode must be 'STANDARD_BIN_REVIEW_ONLY', ` +
        `got '${pkg.outputMode}'`,
    )
  }
  if (pkg.encryptionApproved === true) {
    throw new Error(
      `[patchEngine] Safety gate: encryptionApproved must be false for review-mode packages`,
    )
  }
  if (pkg.mhdEncryptionAllowed === true) {
    throw new Error(
      `[patchEngine] Safety gate: mhdEncryptionAllowed must be false for review-mode packages`,
    )
  }
  if (!pkg.safeForAppPackage) {
    throw new Error(
      `[patchEngine] Safety gate: safeForAppPackage must be true. ` +
        `Package '${pkg.packageId}' is NEEDS_AUDIT — run unmatched-region-audit first.`,
    )
  }
}

// ─── Core apply logic ─────────────────────────────────────────────────────────

interface ApplyCoreResult {
  regionResults: RegionApplyResult[]
  appliedCount: number
  stockMismatchCount: number
  /**
   * Typed as Uint8Array<ArrayBuffer> (TS 5.7+) so it satisfies BlobPart
   * and crypto.subtle.digest's BufferSource parameter without unsafe casts.
   */
  patchedBytes: Uint8Array<ArrayBuffer>
}

/**
 * Apply all patch regions to a COPY of stockBytes.
 * Returns the patched Uint8Array and per-region results.
 * The input stockBytes is NEVER modified.
 */
function applyCore(
  stockBytes: Uint8Array,
  regions: AppSafePatchRegion[],
): ApplyCoreResult {
  // Work on a copy — never mutate the original.
  // Allocate via new ArrayBuffer(n) so TypeScript 5.7 infers
  // Uint8Array<ArrayBuffer> (not Uint8Array<ArrayBufferLike>), which is
  // required for BlobPart and crypto.subtle.digest's BufferSource parameter.
  const patchedBuffer = new ArrayBuffer(stockBytes.length)
  const patchedBytes: Uint8Array<ArrayBuffer> = new Uint8Array(patchedBuffer)
  patchedBytes.set(stockBytes)

  const regionResults: RegionApplyResult[] = []
  let appliedCount = 0
  let stockMismatchCount = 0

  for (let i = 0; i < regions.length; i++) {
    const region = regions[i]
    const { offset, byteCount, expectedStockHex, replacementHex, mapName, category } =
      region

    const expectedBytes = hexStringToBytes(expectedStockHex)
    const replacementBytes = hexStringToBytes(replacementHex)
    const actualStockHex = readHex(stockBytes, offset, byteCount)

    // Byte-for-byte comparison
    let stockMismatch = false
    if (expectedBytes.length !== byteCount) {
      stockMismatch = true
    } else {
      for (let j = 0; j < byteCount; j++) {
        if (stockBytes[offset + j] !== expectedBytes[j]) {
          stockMismatch = true
          break
        }
      }
    }

    if (!stockMismatch && replacementBytes.length === byteCount) {
      // Write replacement bytes
      for (let j = 0; j < byteCount; j++) {
        patchedBytes[offset + j] = replacementBytes[j]
      }
      appliedCount++
    } else {
      stockMismatchCount++
    }

    regionResults.push({
      regionIndex: i,
      offset,
      byteCount,
      mapName,
      category,
      applied: !stockMismatch && replacementBytes.length === byteCount,
      stockMismatch,
      expectedHex: expectedStockHex,
      actualStockHex,
      replacementHex,
    })
  }

  return { regionResults, appliedCount, stockMismatchCount, patchedBytes }
}

/**
 * Determine the overall apply status from the counts.
 */
function resolveStatus(
  stockSha256Match: boolean,
  stockMismatchCount: number,
): PatchApplyStatus {
  if (!stockSha256Match) return 'stock_sha_mismatch'
  if (stockMismatchCount > 0) return 'region_errors'
  return 'success'
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Apply patches to a copy of the stock BIN for owner review.
 * Returns PatchApplyResult metadata only — no buffer is returned.
 * Call this for the review panel display.
 */
export async function applyPatchesReview(
  stockBuffer: ArrayBuffer,
  pkg: AppSafePatchPackage,
): Promise<PatchApplyResult> {
  assertSafetyGates(pkg)

  if (stockBuffer.byteLength !== EXPECTED_SIZE) {
    throw new Error(
      `[patchEngine] Stock buffer must be exactly ${EXPECTED_SIZE} bytes. ` +
        `Got: ${stockBuffer.byteLength}`,
    )
  }

  const stockBytes = new Uint8Array(stockBuffer)
  const inputSha256 = await sha256Hex(stockBuffer)
  const stockSha256Match = inputSha256 === pkg.stockSha256.toLowerCase()

  const errors: string[] = []
  const notes: string[] = []

  if (!stockSha256Match) {
    errors.push(
      `Stock SHA-256 mismatch. Expected: ${pkg.stockSha256}. Got: ${inputSha256}. ` +
        `Upload the exact unmodified stock BIN for ROM ${pkg.romId}.`,
    )
  }

  const { regionResults, appliedCount, stockMismatchCount, patchedBytes } = applyCore(
    stockBytes,
    pkg.patchRegions,
  )

  // Verify output size
  if (patchedBytes.length !== EXPECTED_SIZE) {
    throw new Error(
      `[patchEngine] Output size invariant violated: expected ${EXPECTED_SIZE} bytes, ` +
        `got ${patchedBytes.length}`,
    )
  }

  // patchedBytes was created via new Uint8Array(new ArrayBuffer(n)), so its
  // backing store is always a regular ArrayBuffer — TS 5.7 infers the explicit
  // Uint8Array<ArrayBuffer> generic, making .buffer typed as ArrayBuffer directly.
  const patchedSha256 = await sha256Hex(patchedBytes.buffer)
  const patchedMatchesTuned =
    patchedSha256 === pkg.tunedSha256.toLowerCase()

  if (!patchedMatchesTuned) {
    notes.push(
      `Patched BIN SHA-256 (${patchedSha256}) does not match tunedSha256 ` +
        `(${pkg.tunedSha256}). This is expected — the ROM CRC byte at 0x041366 ` +
        `is excluded from patch regions. The external flasher recalculates CRC on flash.`,
    )
  }

  const status = resolveStatus(stockSha256Match, stockMismatchCount)

  return {
    outputMode: 'STANDARD_BIN_REVIEW_ONLY',
    ownerReviewRequired: true,
    encryptionApproved: false,
    mhdEncryptionAllowed: false,

    packageId: pkg.packageId,
    romId: pkg.romId,
    stage: pkg.stage,
    fuel: pkg.fuel,

    inputSha256,
    stockSha256Expected: pkg.stockSha256,
    stockSha256Match,

    status,
    totalRegions: pkg.patchRegions.length,
    appliedCount,
    stockMismatchCount,

    patchedSha256,
    tunedSha256Expected: pkg.tunedSha256,
    patchedMatchesTuned,

    regionResults,
    errors,
    notes,
  }
}

/**
 * Apply patches and return BOTH the review result and the patched buffer.
 * This function must only be called inside an owner download click handler.
 *
 * CALLER RESPONSIBILITIES:
 *   - Create Blob from patchedBytes
 *   - Call URL.createObjectURL(blob)
 *   - Trigger download via <a> click
 *   - Call URL.revokeObjectURL(url) IMMEDIATELY after
 *   - Do NOT store patchedBytes in React state
 *
 * Returns null if safety gates fail.
 */
export async function applyPatchesForDownload(
  stockBuffer: ArrayBuffer,
  pkg: AppSafePatchPackage,
): Promise<{ result: PatchApplyResult; patchedBytes: Uint8Array<ArrayBuffer> }> {
  // Run through the same path as review — includes safety gate checks
  const reviewResult = await applyPatchesReview(stockBuffer, pkg)

  // Re-apply to get the buffer (review discards it)
  const stockBytes = new Uint8Array(stockBuffer)
  const { patchedBytes } = applyCore(stockBytes, pkg.patchRegions)

  return { result: reviewResult, patchedBytes }
}
