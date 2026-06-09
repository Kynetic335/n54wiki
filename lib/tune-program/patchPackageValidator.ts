// ─── App-Safe Patch Package Validator ─────────────────────────────────────────
//
// Deep validation of a loaded app-safe patch package JSON, BEFORE it is applied
// to an uploaded BIN. Pure + server-safe (no crypto, no fetch, no DOM).
//
// Checks (per the Tune App contract):
//   - package object is present and well-formed
//   - required metadata fields exist
//   - optional metadata cross-check against the selected manifest entry
//   - every patch region:
//       · offset is a valid integer inside the 2 MB ROM
//       · expectedStockHex / replacementHex are even-length hex strings
//       · expectedStockHex and replacementHex decode to the SAME byte length
//       · that byte length equals byteCount
//       · write range stays within 0 .. ROM_SIZE
//   - no two regions have overlapping (duplicate / conflicting) write ranges
//   - READY packages cannot pass if required safety fields are missing
//
// Returns a ValidationOutcome — never throws.
// ─────────────────────────────────────────────────────────────────────────────

import type { AppSafePatchPackage, AppSafePatchRegion } from '@/types/tune-program'

export const ROM_SIZE = 2_097_152 // 0x200000

export interface PatchPackageValidationOutcome {
  valid: boolean
  errors: string[]
}

/** Selected manifest metadata to cross-check the loaded package against. */
export interface ManifestCrossCheck {
  romId: string
  stage: string
  fuel: string
}

// ─── Hex helpers ──────────────────────────────────────────────────────────────

/**
 * Count decoded bytes in a hex string, supporting both space-separated
 * ("aa bb cc") and packed ("aabbcc") forms. Returns -1 if any token / the
 * packed string is not valid even-length hex.
 */
export function decodedByteLength(hex: string): number {
  const cleaned = (hex ?? '').trim()
  if (cleaned === '') return -1

  if (/\s/.test(cleaned)) {
    const tokens = cleaned.split(/\s+/)
    for (const t of tokens) {
      if (!/^[0-9a-fA-F]{2}$/.test(t)) return -1
    }
    return tokens.length
  }

  // Packed form — must be even length, all hex.
  if (cleaned.length % 2 !== 0) return -1
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return -1
  return cleaned.length / 2
}

// ─── Region validation ────────────────────────────────────────────────────────

interface Range {
  start: number
  end: number // exclusive
  index: number
}

function validateRegion(r: AppSafePatchRegion, i: number, errors: string[]): Range | null {
  let ok = true

  // offset
  if (typeof r.offset !== 'number' || !Number.isInteger(r.offset) || r.offset < 0) {
    errors.push(`Region[${i}]: invalid offset ${String(r.offset)}`)
    ok = false
  } else if (r.offset >= ROM_SIZE) {
    errors.push(`Region[${i}]: offset ${r.offset} is outside the ${ROM_SIZE}-byte ROM`)
    ok = false
  }

  // byteCount
  if (typeof r.byteCount !== 'number' || !Number.isInteger(r.byteCount) || r.byteCount < 1) {
    errors.push(`Region[${i}]: invalid byteCount ${String(r.byteCount)}`)
    ok = false
  }

  // hex parity + decode lengths
  const expLen = decodedByteLength(r.expectedStockHex)
  const repLen = decodedByteLength(r.replacementHex)
  if (expLen < 0) {
    errors.push(`Region[${i}]: expectedStockHex is not valid even-length hex`)
    ok = false
  }
  if (repLen < 0) {
    errors.push(`Region[${i}]: replacementHex is not valid even-length hex`)
    ok = false
  }
  if (expLen >= 0 && repLen >= 0 && expLen !== repLen) {
    errors.push(
      `Region[${i}]: expectedStockHex (${expLen} bytes) and replacementHex (${repLen} bytes) ` +
        'decode to different lengths',
    )
    ok = false
  }
  if (expLen >= 0 && typeof r.byteCount === 'number' && expLen !== r.byteCount) {
    errors.push(`Region[${i}]: expectedStockHex (${expLen} bytes) ≠ byteCount (${r.byteCount})`)
    ok = false
  }

  // write range bounds
  if (
    ok &&
    typeof r.offset === 'number' &&
    typeof r.byteCount === 'number' &&
    r.offset + r.byteCount > ROM_SIZE
  ) {
    errors.push(`Region[${i}]: write range ${r.offset}..${r.offset + r.byteCount} exceeds ROM size`)
    ok = false
  }

  if (!ok) return null
  return { start: r.offset, end: r.offset + r.byteCount, index: i }
}

// ─── Duplicate / conflicting range detection ──────────────────────────────────

function detectOverlaps(ranges: Range[], errors: string[]): void {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end)
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (cur.start < prev.end) {
      errors.push(
        `Regions[${prev.index}] and Regions[${cur.index}] have overlapping write ranges ` +
          `(${prev.start}..${prev.end} vs ${cur.start}..${cur.end})`,
      )
    }
  }
}

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validate a loaded app-safe patch package.
 * Pass the selected manifest metadata to cross-check ROM/stage/fuel.
 */
export function validatePatchPackage(
  pkg: AppSafePatchPackage | null | undefined,
  crossCheck?: ManifestCrossCheck,
): PatchPackageValidationOutcome {
  const errors: string[] = []

  if (!pkg || typeof pkg !== 'object') {
    return { valid: false, errors: ['Patch package is missing or not an object'] }
  }

  // ── Required metadata ──────────────────────────────────────────────────────
  if (!pkg.packageId) errors.push('Missing packageId')
  if (!pkg.romId) errors.push('Missing romId')
  if (!pkg.stage) errors.push('Missing stage')
  if (pkg.fuel === undefined || pkg.fuel === null || pkg.fuel === '') errors.push('Missing fuel')
  if (!pkg.stockSha256 || !/^[0-9a-f]{64}$/i.test(pkg.stockSha256)) {
    errors.push('Invalid or missing stockSha256')
  }

  // ── Safety fields (READY packages must carry these exactly) ────────────────
  if (pkg.outputMode !== 'STANDARD_BIN_REVIEW_ONLY') {
    errors.push(`Invalid outputMode "${String(pkg.outputMode)}"`)
  }
  if (pkg.ownerReviewRequired !== true) errors.push('ownerReviewRequired must be true')
  if (pkg.encryptionApproved !== false) errors.push('encryptionApproved must be false')
  if (pkg.mhdEncryptionAllowed !== false) errors.push('mhdEncryptionAllowed must be false')
  if (pkg.safeForAppPackage !== true) errors.push('safeForAppPackage must be true')

  // ── Metadata cross-check against the selected manifest entry ────────────────
  if (crossCheck) {
    if (pkg.romId && pkg.romId.toUpperCase() !== crossCheck.romId.toUpperCase()) {
      errors.push(`Package romId "${pkg.romId}" ≠ selected ROM "${crossCheck.romId}"`)
    }
    if (pkg.stage && pkg.stage.toLowerCase() !== crossCheck.stage.toLowerCase()) {
      errors.push(`Package stage "${pkg.stage}" ≠ selected stage "${crossCheck.stage}"`)
    }
    if (
      pkg.fuel !== undefined &&
      pkg.fuel !== null &&
      String(pkg.fuel).toLowerCase() !== crossCheck.fuel.toLowerCase()
    ) {
      errors.push(`Package fuel "${pkg.fuel}" ≠ selected fuel "${crossCheck.fuel}"`)
    }
  }

  // ── Regions ────────────────────────────────────────────────────────────────
  if (!Array.isArray(pkg.patchRegions) || pkg.patchRegions.length === 0) {
    errors.push('patchRegions is empty or missing')
  } else {
    const ranges: Range[] = []
    for (let i = 0; i < pkg.patchRegions.length; i++) {
      const range = validateRegion(pkg.patchRegions[i], i, errors)
      if (range) ranges.push(range)
    }
    detectOverlaps(ranges, errors)
  }

  return { valid: errors.length === 0, errors }
}
