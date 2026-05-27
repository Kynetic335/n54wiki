// ─── Patch Review Gate — Pre-apply Safety Checks ─────────────────────────────
//
// Pure validation functions for the review-mode safety gate.
// All checks are synchronous and side-effect free.
//
// SAFETY CONTRACT:
//   - None of these functions modify data or trigger I/O.
//   - All checks must pass before loadPackage() / applyPatches() are called.
//   - encryptionApproved/mhdEncryptionAllowed are always hard-false in app packages.
//   - The patched buffer is never returned from applyPatches() — enforced at type level.
//
// Manual validation scenarios (no test runner in project — run in browser console):
//
//   gateRomSupported('I8A0S')    → { pass: true }
//   gateRomSupported('INA0S')    → { pass: true }
//   gateRomSupported('IJE0S')    → { pass: false, reason: '...' }
//   gatePackageExists(undefined) → { pass: false, reason: '...' }
//   gatePackageSafe({ packageId: 'x', safeForApp: false }) → { pass: false }
//   gateBufferSize(new ArrayBuffer(1024)) → { pass: false }
//   gateBufferSize(new ArrayBuffer(2097152)) → { pass: true }
//
//   stageToManifestId('stage1plus') → 'stage1+'   (manifest uses '+' suffix)
//   stageToManifestId('stage3')     → 'stage3'    (direct pass-through)
//   fuelToManifestId('E30')         → 'e30'        (lowercase)
//
// Post-apply checks (against PatchApplyResult):
//   gateResultSafetyFields(result) — verifies hard-coded safety gate in result
//   gateResultNoBuffer(result)     — confirms no buffer field exists on result
//
// ─────────────────────────────────────────────────────────────────────────────

import type { AppSafePatchPackage, PatchApplyResult } from '@/types/tune-program'
import { ROM_SIZE } from '@/lib/tune-program/patchApplyEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GatePass = { pass: true }
export type GateFail = { pass: false; reason: string }
export type GateResult = GatePass | GateFail

const PASS: GatePass = { pass: true }
const fail = (reason: string): GateFail => ({ pass: false, reason })

// ─── ROM support gate ─────────────────────────────────────────────────────────

/**
 * ROMs with validated patch packages in v1.
 * Other ROMs are gated out — packages don't exist yet.
 */
export const REVIEW_SUPPORTED_ROMS = ['I8A0S', 'INA0S'] as const
export type ReviewSupportedRom = typeof REVIEW_SUPPORTED_ROMS[number]

/**
 * Gate: romId must be in REVIEW_SUPPORTED_ROMS.
 * I8A0S: Standard OTS (stage1+/2/3 × 91/93/E50) + N20 MAP packages — all READY.
 * INA0S: Standard OTS (stage1+/2/3 × 91/93/E50) + N20 MAP packages — all READY (v12).
 * IJE0S: needs-audit (150+ unmatched XDF regions per package) — blocked until audit passes.
 * IKM0S: not built yet — no v12 source files found.
 */
export function gateRomSupported(romId: string): GateResult {
  if ((REVIEW_SUPPORTED_ROMS as readonly string[]).includes(romId)) return PASS
  return fail(
    `Patch review is only available for ${REVIEW_SUPPORTED_ROMS.join(' and ')} in this version. ` +
    `${romId} packages are not yet available for owner-review.`
  )
}

// ─── Manifest entry gates ─────────────────────────────────────────────────────

/**
 * Gate: a manifest entry must exist for this ROM / stage / fuel combination.
 * undefined means the package hasn't been built or exported yet.
 */
export function gatePackageExists(
  entry: { packageId: string } | undefined
): GateResult {
  if (entry) return PASS
  return fail(
    'No patch package is available for this ROM / stage / fuel combination yet. ' +
    'Contact Synergy for availability.'
  )
}

/**
 * Gate: the manifest entry must be marked safeForApp.
 * safeForApp: false means the dry-run validation found stock-byte mismatches
 * or unaudited regions — the package is not cleared for app apply.
 */
export function gatePackageSafe(
  entry: { packageId: string; safeForApp: boolean }
): GateResult {
  if (entry.safeForApp) return PASS
  return fail(
    `Package "${entry.packageId}" is not marked safeForApp — it failed dry-run validation. ` +
    'Contact Synergy. This package cannot be applied in review mode.'
  )
}

// ─── Buffer gates ─────────────────────────────────────────────────────────────

/**
 * Gate: buffer must be exactly ROM_SIZE bytes (2,097,152 / 0x200000).
 * The apply engine enforces this too — this is a pre-flight check.
 */
export function gateBufferSize(buffer: ArrayBuffer): GateResult {
  if (buffer.byteLength === ROM_SIZE) return PASS
  return fail(
    `BIN is ${buffer.byteLength.toLocaleString()} bytes — expected exactly ` +
    `${ROM_SIZE.toLocaleString()} bytes (2 MB / 0x200000). ` +
    'Upload the correct stock BIN.'
  )
}

// ─── Package safety field gates ───────────────────────────────────────────────

/**
 * Gate: loaded package must have all safety fields at their required values.
 * These are set at export time by export-app-safe-packages.mjs and validated
 * by patchApplyEngine.validatePackage() — this is a defence-in-depth check.
 */
export function gatePackageSafetyFields(pkg: AppSafePatchPackage): GateResult {
  if (pkg.encryptionApproved !== false) {
    return fail('SAFETY VIOLATION: encryptionApproved must be false in all app-safe packages.')
  }
  if (pkg.mhdEncryptionAllowed !== false) {
    return fail('SAFETY VIOLATION: mhdEncryptionAllowed must be false in all app-safe packages.')
  }
  if (pkg.outputMode !== 'STANDARD_BIN_REVIEW_ONLY') {
    return fail(`SAFETY VIOLATION: outputMode must be STANDARD_BIN_REVIEW_ONLY, got "${pkg.outputMode}".`)
  }
  if (pkg.ownerReviewRequired !== true) {
    return fail('SAFETY VIOLATION: ownerReviewRequired must be true in all app-safe packages.')
  }
  if (!pkg.safeForAppPackage) {
    return fail('SAFETY VIOLATION: safeForAppPackage is not true — package not cleared for apply.')
  }
  return PASS
}

// ─── Post-apply result gates ──────────────────────────────────────────────────

/**
 * Gate: verify PatchApplyResult has correct hard-coded safety fields.
 * The apply engine sets these unconditionally — this is a runtime assertion.
 *
 * Scenario: encryptionApproved:true → rejected ✓
 * Scenario: mhdEncryptionAllowed:true → rejected ✓
 * Scenario: outputMode wrong → rejected ✓
 */
export function gateResultSafetyFields(result: PatchApplyResult): GateResult {
  if (result.encryptionApproved !== false) {
    return fail('SAFETY VIOLATION: result.encryptionApproved !== false')
  }
  if (result.mhdEncryptionAllowed !== false) {
    return fail('SAFETY VIOLATION: result.mhdEncryptionAllowed !== false')
  }
  if (result.outputMode !== 'STANDARD_BIN_REVIEW_ONLY') {
    return fail(`SAFETY VIOLATION: result.outputMode is "${result.outputMode}", expected STANDARD_BIN_REVIEW_ONLY`)
  }
  if (result.ownerReviewRequired !== true) {
    return fail('SAFETY VIOLATION: result.ownerReviewRequired !== true')
  }
  return PASS
}

/**
 * Gate: confirm the result object has no buffer or download-related fields.
 * The patched buffer must never be returned — enforced by the PatchApplyResult
 * type at compile time and by the engine implementation.
 *
 * Scenario: patched buffer never returned ✓ (enforced at type level)
 * Scenario: successful apply returns review only ✓
 */
export function gateResultNoBuffer(result: unknown): GateResult {
  if (result === null || typeof result !== 'object') {
    return fail('Result is not an object.')
  }
  const r = result as Record<string, unknown>
  const forbidden = ['buffer', 'patchedBuffer', 'blob', 'downloadUrl', 'url', 'data']
  for (const key of forbidden) {
    if (key in r) {
      return fail(`SAFETY VIOLATION: result has forbidden field "${key}" — patched buffer must not be returned.`)
    }
  }
  return PASS
}

// ─── Composite pre-review gate ─────────────────────────────────────────────────

/**
 * Run all pre-apply gates in sequence.
 * Returns the first failing gate, or { pass: true } if all pass.
 *
 * Call this BEFORE loadPackage() and applyPatches().
 */
export function runPreReviewGates(
  romId:         string,
  manifestEntry: { packageId: string; safeForApp: boolean } | undefined,
  buffer:        ArrayBuffer
): GateResult {
  const gates: Array<() => GateResult> = [
    () => gateRomSupported(romId),
    () => gatePackageExists(manifestEntry),
    () => (manifestEntry ? gatePackageSafe(manifestEntry) : fail('No package entry to check.')),
    () => gateBufferSize(buffer),
  ]

  for (const gate of gates) {
    const result = gate()
    if (!result.pass) return result
  }

  return PASS
}

/**
 * Run all post-apply gates in sequence.
 * Returns the first failing gate, or { pass: true } if all pass.
 *
 * Call this AFTER applyPatches() returns a result.
 * A failure here is a hard safety violation — do not show the result to the user.
 */
export function runPostReviewGates(result: PatchApplyResult): GateResult {
  const gates: Array<() => GateResult> = [
    () => gateResultSafetyFields(result),
    () => gateResultNoBuffer(result),
  ]

  for (const gate of gates) {
    const r = gate()
    if (!r.pass) return r
  }

  return PASS
}

// ─── Stage → Manifest ID mapping ─────────────────────────────────────────────

/**
 * Map TuneProgram.tsx stage values to manifest stage IDs.
 * TuneProgram uses 'stage1plus'; manifest uses 'stage1+'.
 * stage2plus is removed — Stage 3 uses id 'stage3' in both places.
 */
export function stageToManifestId(stage: string): string {
  if (stage === 'stage1plus') return 'stage1+'
  return stage
}

/**
 * Normalize UI fuel value to manifest fuel ID (lowercase).
 * TuneProgram uses 'E30'/'E50'; manifest uses 'e30'/'e50'.
 */
export function fuelToManifestId(fuel: string): string {
  return fuel.toLowerCase()
}
