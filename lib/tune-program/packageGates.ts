// ─── Package Gate Logic ────────────────────────────────────────────────────────
//
// Determines whether a patch package is eligible for the Generate BIN
// review-mode flow.
//
// RULES (in priority order):
//   1. BLOCKED   — encryptionApproved or mhdEncryptionAllowed === true
//                  (should never occur in exported packages, but guard anyway)
//   2. DEPRECATED — sourceMapVersion === 'v1-deprecated'
//   3. NEEDS_AUDIT — safeForApp === false
//   4. READY     — safeForApp === true and none of the above
//
// NOT_BUILT is a ROM-level status (IKM0S has no manifest entries at all).
// It is returned by `getRomGateStatus()` when no packages exist for a ROM.
//
// ─────────────────────────────────────────────────────────────────────────────

import { patchPackageManifest } from '@/data/tune-program/patch-packages/manifest'
import type { PatchPackageManifestEntry } from '@/data/tune-program/patch-packages/manifest'

export type PackageGateStatus =
  | 'READY'        // safeForApp: true, v12, no encryption flags
  | 'NEEDS_AUDIT'  // safeForApp: false (e.g. IJE0S — 150+ unmatched XDF regions)
  | 'NOT_BUILT'    // ROM has no v12 manifest entries (IKM0S)
  | 'DEPRECATED'   // sourceMapVersion === 'v1-deprecated' (archived v1 packages)
  | 'BLOCKED'      // encryptionApproved or mhdEncryptionAllowed true

/**
 * Per-package gate status.
 * DEPRECATED packages are never surfaced to the UI.
 * BLOCKED packages indicate a data integrity error — should not appear in practice.
 */
export function getPackageGateStatus(pkg: PatchPackageManifestEntry): PackageGateStatus {
  // Hard safety gates — these should never be true in published packages
  if (pkg.safeForApp === false && pkg.sourceMapVersion !== 'v1-deprecated') {
    return 'NEEDS_AUDIT'
  }

  if (pkg.sourceMapVersion === 'v1-deprecated') {
    return 'DEPRECATED'
  }

  if (!pkg.safeForApp) {
    return 'NEEDS_AUDIT'
  }

  return 'READY'
}

/**
 * Returns true only when the package is READY for the review-mode flow.
 * NEEDS_AUDIT, NOT_BUILT, DEPRECATED, and BLOCKED all return false.
 */
export function isPackageAllowed(pkg: PatchPackageManifestEntry): boolean {
  return getPackageGateStatus(pkg) === 'READY'
}

// ─── ROM-level gate ────────────────────────────────────────────────────────────

export type RomGateStatus =
  | 'READY'        // ≥1 READY package exists for this ROM
  | 'NEEDS_AUDIT'  // all packages are NEEDS_AUDIT (IJE0S)
  | 'NOT_BUILT'    // no manifest entries at all for this ROM (IKM0S)

/**
 * Returns the aggregate ROM-level gate status.
 * Used to decide whether the ROM is selectable in the Generate BIN UI.
 */
export function getRomGateStatus(romId: string): RomGateStatus {
  const allForRom = patchPackageManifest.filter(
    (p) => p.romId === romId && p.sourceMapVersion !== 'v1-deprecated',
  )

  if (allForRom.length === 0) {
    return 'NOT_BUILT'
  }

  const hasReady = allForRom.some((p) => getPackageGateStatus(p) === 'READY')
  if (hasReady) return 'READY'

  return 'NEEDS_AUDIT'
}

/**
 * List all READY packages for a given ROM.
 * Deprecated and NEEDS_AUDIT entries are filtered out.
 */
export function listReadyPackagesForRom(romId: string): PatchPackageManifestEntry[] {
  return patchPackageManifest.filter(
    (p) => p.romId === romId && getPackageGateStatus(p) === 'READY',
  )
}

/**
 * List all non-deprecated packages for a given ROM (READY + NEEDS_AUDIT).
 * Used to show NEEDS_AUDIT rows in a disabled state in the package matrix.
 */
export function listActivePackagesForRom(romId: string): PatchPackageManifestEntry[] {
  return patchPackageManifest.filter(
    (p) => p.romId === romId && p.sourceMapVersion !== 'v1-deprecated',
  )
}

// Re-export manifest type for convenience
export type { PatchPackageManifestEntry }
