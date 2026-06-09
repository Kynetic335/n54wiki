// ─── Generate BIN Gate — Single Source of Truth ───────────────────────────────
//
// Decides whether the "Generate BIN" action is ENABLED or DISABLED for a given
// ROM / Stage / Fuel / Turbo selection.
//
// DESIGN RULE (non-negotiable):
//   Enablement is decided ONLY by package DATA — never by ROM name.
//   A ROM is enabled iff its selected package is READY + valid + has a known
//   stock hash. I8A0S, IJE0S, IKM0S, and INA0S are all treated identically:
//   the manifest and validator decide, not a hardcoded allowlist.
//
//   READY + valid app-safe patch package + known stock hash  → ENABLED
//   anything else                                            → DISABLED (with reason)
//
// The disabled reason codes match the customer-facing UI exactly:
//   - No matching package
//   - Package not READY
//   - Missing patch file
//   - Missing stock hash
//   - Invalid package
//   - Unsupported selection
//   - Failed validation
//
// This module is PURE and SERVER-SAFE — no Web Crypto, no fetch, no DOM.
// It reasons over the static manifest + fingerprint registry only.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getPackageByFilter,
  type PatchPackageManifestEntry,
} from '@/data/tune-program/patch-packages/manifest'
import { getPackageGateStatus } from '@/lib/tune-program/packageGates'
import { getFingerprintByRomId } from '@/data/tune-program/binFingerprints'

// ─── Disabled reason codes ────────────────────────────────────────────────────

export type GenerateBinDisabledReason =
  | 'No matching package'
  | 'Package not READY'
  | 'Missing patch file'
  | 'Missing stock hash'
  | 'Invalid package'
  | 'Unsupported selection'
  | 'Failed validation'

// ─── Selection input ──────────────────────────────────────────────────────────

export interface GenerateBinSelection {
  /** ROM family id, e.g. 'I8A0S' */
  romId: string
  /** Manifest stage id, e.g. 'stage1+', 'stage2', 'stage3', 'hybrid-base' */
  stage: string
  /** Manifest fuel id (lowercase), e.g. '91', '93', 'e50', 'pump' */
  fuel: string
  /** Manifest package type — disambiguates Standard OTS from N20 MAP */
  packageType: 'standard-ots' | 'n20-map'
}

// ─── Decision result ──────────────────────────────────────────────────────────

export type GenerateBinDecision =
  | {
      enabled: true
      manifestEntry: PatchPackageManifestEntry
      /** Known stock SHA-256 for the selected ROM (64-char lowercase hex) */
      stockSha256: string
      /** Public patch JSON path the loader will fetch */
      patchPackagePath: string
    }
  | {
      enabled: false
      reason: GenerateBinDisabledReason
      /** Human-readable explanation for the UI */
      detail: string
    }

// ─── Stock hash lookup ────────────────────────────────────────────────────────

/**
 * Return the known stock SHA-256 for a ROM, or undefined if none is registered.
 * Data-driven — reads the fingerprint registry, no ROM is special-cased.
 */
export function getStockHashForRom(romId: string): string | undefined {
  const fp = getFingerprintByRomId(romId)
  const hash = fp?.knownStockHashes?.[0]
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return undefined
  return hash
}

// ─── Structural manifest validation ───────────────────────────────────────────

/**
 * Validate the required manifest fields for a READY package.
 * A READY package MUST carry every field the apply pipeline depends on.
 * Returns a list of problems (empty = valid).
 */
export function validateManifestEntry(entry: PatchPackageManifestEntry): string[] {
  const problems: string[] = []
  if (!entry.packageId) problems.push('missing packageId')
  if (!entry.romId) problems.push('missing romId')
  if (!entry.stage) problems.push('missing stage')
  if (!entry.fuel) problems.push('missing fuel')
  if (!entry.packageType) problems.push('missing packageType')
  if (typeof entry.patchRegions !== 'number' || entry.patchRegions < 1) {
    problems.push('patchRegions must be ≥ 1')
  }
  if (!entry.filename) {
    problems.push('missing filename')
  } else {
    // Filename must live under the ROM's own directory — guards against
    // a misfiled package pointing at another ROM's data.
    const expectedDir = `${entry.romId.toLowerCase()}/`
    if (!entry.filename.startsWith(expectedDir)) {
      problems.push(`filename "${entry.filename}" not under "${expectedDir}"`)
    }
    if (!entry.filename.endsWith('.json')) {
      problems.push(`filename "${entry.filename}" is not a .json patch file`)
    }
    if (entry.filename.includes('_private_tuning_sources') || entry.filename.includes('\\')) {
      problems.push('filename references a private/absolute path')
    }
  }
  return problems
}

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Resolve whether Generate BIN is enabled for a selection.
 *
 * Decision order (first failing check wins):
 *   1. Selection completeness          → 'Unsupported selection'
 *   2. Matching manifest entry exists   → 'No matching package'
 *   3. Package gate status === READY    → 'Package not READY'
 *   4. Manifest entry is structurally valid → 'Invalid package'
 *   5. Patch filename present           → 'Missing patch file'
 *   6. Known stock hash for ROM         → 'Missing stock hash'
 *   → otherwise ENABLED.
 *
 * Note: deeper validation of the fetched patch JSON (hex parity, duplicate
 * write ranges, expectedStockHex match) happens at apply time via
 * validatePatchPackage() / the apply engine and surfaces as 'Failed validation'.
 */
export function resolveGenerateBin(selection: GenerateBinSelection): GenerateBinDecision {
  const { romId, stage, fuel, packageType } = selection

  // 1. Selection completeness
  if (!romId || !stage || !fuel || !packageType) {
    return {
      enabled: false,
      reason: 'Unsupported selection',
      detail: 'Select a ROM, stage, and fuel to check package availability.',
    }
  }

  // 2. Matching manifest entry
  const entry = getPackageByFilter({ romId, stage, fuel, packageType })
  if (!entry) {
    return {
      enabled: false,
      reason: 'No matching package',
      detail: `No ${packageType} package exists for ${romId} / ${stage} / ${fuel}.`,
    }
  }

  // 3. READY gate (data-driven — NEEDS_AUDIT / DEPRECATED / BLOCKED all fail here)
  const gate = getPackageGateStatus(entry)
  if (gate !== 'READY') {
    return {
      enabled: false,
      reason: 'Package not READY',
      detail: `Package "${entry.packageId}" status is ${gate}, not READY.`,
    }
  }

  // 4. Structural manifest validity
  const problems = validateManifestEntry(entry)
  if (problems.length > 0) {
    return {
      enabled: false,
      reason: 'Invalid package',
      detail: `Package "${entry.packageId}" is invalid: ${problems.join('; ')}.`,
    }
  }

  // 5. Patch file reference present (validateManifestEntry guarantees filename,
  //    but keep an explicit reason code for a missing patch file)
  if (!entry.filename) {
    return {
      enabled: false,
      reason: 'Missing patch file',
      detail: `Package "${entry.packageId}" has no patch JSON file reference.`,
    }
  }

  // 6. Known stock hash for the ROM
  const stockSha256 = getStockHashForRom(romId)
  if (!stockSha256) {
    return {
      enabled: false,
      reason: 'Missing stock hash',
      detail: `No known stock SHA-256 is registered for ${romId}.`,
    }
  }

  return {
    enabled: true,
    manifestEntry: entry,
    stockSha256,
    patchPackagePath: `/tune-program/patch-packages/${entry.filename}`,
  }
}
