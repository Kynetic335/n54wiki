// ─── Patch Package Manifest ────────────────────────────────────────────────────
//
// Source:  _private_tuning_sources/NEW MAPS/ (private, gitignored)
// Built:   2026-05-26 by build-packages.mjs (v12 source maps)
// Output:  data/tune-program/patch-packages/ (app-safe data — no private paths)
//
// ⚠ REVIEW-ONLY MODE:
//   outputMode:           "STANDARD_BIN_REVIEW_ONLY"
//   ownerReviewRequired:  true
//   encryptionApproved:   false   (per-order approval required)
//   mhdEncryptionAllowed: false
//
// Generate BIN is NOT enabled — these packages are for server-side review only.
//
// ─── Source version: v12 ──────────────────────────────────────────────────────
//
// READY (safeForApp=true):  I8A0S + INA0S × Stage 1+/2/3 + Hybrid/N20 (v12);
//                           IJE0S × Stage 1+/2/3 + N20 (v12, OWNER_ACCEPT 2026-06-08);
//                           IKM0S × Stage 1/1+/2/3 (v90, 2026-06-09 — 16 packages)
// NOT BUILT:
//   - I8A0S/IJE0S/INA0S Stage 1 (basic): v12 series starts at Stage 1+
//   - E40 Stage 1+ files: NEEDS_MANUAL_MAPPING (fuel ambiguous, owner review required)
//   - IKM0S 95 / ACN91 fuels: 'future' (not active selectors)
//   - IKM0S: no v12 NEW MAPS series exists — built from verified v90 OTS instead
// DEPRECATED (archived to deprecated/): 18 v1 packages (v90-source / old Hybrid Twins)
//
// Classification rules applied:
//   - TD03-H = hybrid-base, N20 MAP scaled
//   - Non-TD03-H PUMP = stock-turbo Stage 3, split 91 + 93
//   - E40-50/E40-E50 → E50 only (no E40 package)
//   - E50-E60/E50-60 → E50 only (conservative mapping, no E60 package)
//   - IJE0S → safeForAppPackage: false until XDF audit complete
// ─────────────────────────────────────────────────────────────────────────────

export type PatchPackageStatus = {
  /** Package is ready for server-side apply pipeline review. */
  outputMode: 'STANDARD_BIN_REVIEW_ONLY'
  /** Owner must review the patched BIN before any export step. */
  ownerReviewRequired: true
  /** Defaults false — set to true per-order by owner after BIN review. */
  encryptionApproved: boolean
  /** Defaults false — set to true per-order after owner approves encryption. */
  mhdEncryptionAllowed: boolean
  /**
   * True only when all patch regions validated:
   * - 0 stock-byte mismatches in dry-run
   * - 0 unaudited unmatched regions
   * - safeForAppPackage confirmed by build pipeline
   */
  safeForAppPackage: boolean
}

export type PatchPackageManifestEntry = {
  packageId:    string                        // e.g. "i8a0s-stage1p-91-v2"
  romId:        string                        // e.g. "I8A0S"
  stage:        string                        // e.g. "stage1+", "stage2", "stage3", "hybrid-base"
  fuel:         string                        // e.g. "91", "93", "e50", "pump" (always lowercase)
  patchRegions: number                        // region count
  safeForApp:   boolean                       // mirrors safeForAppPackage from build pipeline
  filename:     string                        // relative path within data/tune-program/patch-packages/
  /**
   * Disambiguates Standard OTS packages from N20 MAP packages.
   * 'standard-ots' — Stage 1+/2/3 pump-gas and ethanol OTS packages
   * 'n20-map'      — N20 MAP sensor-scaled packages (stock-turbo Stage 3, hybrid-base)
   */
  packageType:  'standard-ots' | 'n20-map'
  /**
   * Source map version.
   *   v12           = NEW MAPS v12 sources (I8A0S / IJE0S / INA0S)
   *   v90-source    = verified v90 OTS sources (IKM0S — no v12 series exists)
   *   v1-deprecated = old v90/Hybrid Twins, archived to deprecated/
   */
  sourceMapVersion: 'v12' | 'v90-source' | 'v1-deprecated'
}

// ─── Manifest entries ─────────────────────────────────────────────────────────
// All packages below are built from NEW MAPS v12 sources.
// Old v1 packages (v90 source) archived to deprecated/.
//
// Stock SHAs:
//   I8A0S: c53ff0d4da3aafb0aee93b2a4df165b4f98229752b2bc2ea694a2699bc396b38
//   INA0S: 66296babb3f4060ecc9cb8f40faa982651a790c255361a39cd653f448db3f8e0
//   IJE0S: 25adcdcc54f698154315f50731db033c5aa48136e93b20a4de8e9e87cba59c18
//   IKM0S: 6e1e4d70166dfe7a6608b8c63101153c8e1b163a2acc5e9ffd49bf0a49e9a4df
// ─────────────────────────────────────────────────────────────────────────────

export const patchPackageManifest: PatchPackageManifestEntry[] = [

  // ══ I8A0S / Standard OTS ════════════════════════════════════════════════════
  // Stage 1+ (v12)
  { packageId: 'i8a0s-stage1p-91-v2', romId: 'I8A0S', stage: 'stage1+', fuel: '91',  patchRegions: 193, safeForApp: true,  packageType: 'standard-ots', filename: 'i8a0s/i8a0s-stage1p-91-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'i8a0s-stage1p-93-v2', romId: 'I8A0S', stage: 'stage1+', fuel: '93',  patchRegions: 181, safeForApp: true,  packageType: 'standard-ots', filename: 'i8a0s/i8a0s-stage1p-93-v2.json',  sourceMapVersion: 'v12' },

  // Stage 2 (v12)
  { packageId: 'i8a0s-stage2-91-v2',  romId: 'I8A0S', stage: 'stage2',  fuel: '91',  patchRegions: 155, safeForApp: true,  packageType: 'standard-ots', filename: 'i8a0s/i8a0s-stage2-91-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'i8a0s-stage2-93-v2',  romId: 'I8A0S', stage: 'stage2',  fuel: '93',  patchRegions: 152, safeForApp: true,  packageType: 'standard-ots', filename: 'i8a0s/i8a0s-stage2-93-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'i8a0s-stage2-e50-v2', romId: 'I8A0S', stage: 'stage2',  fuel: 'e50', patchRegions: 158, safeForApp: true,  packageType: 'standard-ots', filename: 'i8a0s/i8a0s-stage2-e50-v2.json',  sourceMapVersion: 'v12' },

  // Stage 3 (v12)
  { packageId: 'i8a0s-stage3-91-v2',  romId: 'I8A0S', stage: 'stage3',  fuel: '91',  patchRegions: 167, safeForApp: true,  packageType: 'standard-ots', filename: 'i8a0s/i8a0s-stage3-91-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'i8a0s-stage3-93-v2',  romId: 'I8A0S', stage: 'stage3',  fuel: '93',  patchRegions: 165, safeForApp: true,  packageType: 'standard-ots', filename: 'i8a0s/i8a0s-stage3-93-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'i8a0s-stage3-e50-v2', romId: 'I8A0S', stage: 'stage3',  fuel: 'e50', patchRegions: 163, safeForApp: true,  packageType: 'standard-ots', filename: 'i8a0s/i8a0s-stage3-e50-v2.json',  sourceMapVersion: 'v12' },

  // Hybrid Base N20 MAP (TD03-H)
  { packageId: 'i8a0s-hybrid-base-pump-n20-v2',       romId: 'I8A0S', stage: 'hybrid-base', fuel: 'pump', patchRegions: 148, safeForApp: true,  packageType: 'n20-map', filename: 'i8a0s/i8a0s-hybrid-base-pump-n20-v2.json',       sourceMapVersion: 'v12' },
  { packageId: 'i8a0s-hybrid-base-e50-n20-v2',        romId: 'I8A0S', stage: 'hybrid-base', fuel: 'e50',  patchRegions: 158, safeForApp: true,  packageType: 'n20-map', filename: 'i8a0s/i8a0s-hybrid-base-e50-n20-v2.json',        sourceMapVersion: 'v12' },

  // Stock Turbo Stage 3 N20 MAP
  { packageId: 'i8a0s-stock-turbo-stage3-91-n20-v2',  romId: 'I8A0S', stage: 'stage3', fuel: '91',  patchRegions: 148, safeForApp: true,  packageType: 'n20-map', filename: 'i8a0s/i8a0s-stock-turbo-stage3-91-n20-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'i8a0s-stock-turbo-stage3-93-n20-v2',  romId: 'I8A0S', stage: 'stage3', fuel: '93',  patchRegions: 148, safeForApp: true,  packageType: 'n20-map', filename: 'i8a0s/i8a0s-stock-turbo-stage3-93-n20-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'i8a0s-stock-turbo-stage3-e50-n20-v2', romId: 'I8A0S', stage: 'stage3', fuel: 'e50', patchRegions: 159, safeForApp: true,  packageType: 'n20-map', filename: 'i8a0s/i8a0s-stock-turbo-stage3-e50-n20-v2.json', sourceMapVersion: 'v12' },

  // ══ INA0S / Standard OTS ════════════════════════════════════════════════════
  // Stage 1+ (v12)
  { packageId: 'ina0s-stage1p-91-v2', romId: 'INA0S', stage: 'stage1+', fuel: '91',  patchRegions: 137, safeForApp: true,  packageType: 'standard-ots', filename: 'ina0s/ina0s-stage1p-91-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'ina0s-stage1p-93-v2', romId: 'INA0S', stage: 'stage1+', fuel: '93',  patchRegions: 137, safeForApp: true,  packageType: 'standard-ots', filename: 'ina0s/ina0s-stage1p-93-v2.json',  sourceMapVersion: 'v12' },

  // Stage 2 (v12)
  { packageId: 'ina0s-stage2-91-v2',  romId: 'INA0S', stage: 'stage2',  fuel: '91',  patchRegions: 129, safeForApp: true,  packageType: 'standard-ots', filename: 'ina0s/ina0s-stage2-91-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'ina0s-stage2-93-v2',  romId: 'INA0S', stage: 'stage2',  fuel: '93',  patchRegions: 115, safeForApp: true,  packageType: 'standard-ots', filename: 'ina0s/ina0s-stage2-93-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'ina0s-stage2-e50-v2', romId: 'INA0S', stage: 'stage2',  fuel: 'e50', patchRegions: 115, safeForApp: true,  packageType: 'standard-ots', filename: 'ina0s/ina0s-stage2-e50-v2.json',  sourceMapVersion: 'v12' },

  // Stage 3 (v12)
  { packageId: 'ina0s-stage3-91-v2',  romId: 'INA0S', stage: 'stage3',  fuel: '91',  patchRegions: 132, safeForApp: true,  packageType: 'standard-ots', filename: 'ina0s/ina0s-stage3-91-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'ina0s-stage3-93-v2',  romId: 'INA0S', stage: 'stage3',  fuel: '93',  patchRegions: 115, safeForApp: true,  packageType: 'standard-ots', filename: 'ina0s/ina0s-stage3-93-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'ina0s-stage3-e50-v2', romId: 'INA0S', stage: 'stage3',  fuel: 'e50', patchRegions: 119, safeForApp: true,  packageType: 'standard-ots', filename: 'ina0s/ina0s-stage3-e50-v2.json',  sourceMapVersion: 'v12' },

  // Hybrid Base N20 MAP (TD03-H)
  { packageId: 'ina0s-hybrid-base-pump-n20-v2',       romId: 'INA0S', stage: 'hybrid-base', fuel: 'pump', patchRegions: 113, safeForApp: true,  packageType: 'n20-map', filename: 'ina0s/ina0s-hybrid-base-pump-n20-v2.json',       sourceMapVersion: 'v12' },
  { packageId: 'ina0s-hybrid-base-e50-n20-v2',        romId: 'INA0S', stage: 'hybrid-base', fuel: 'e50',  patchRegions: 113, safeForApp: true,  packageType: 'n20-map', filename: 'ina0s/ina0s-hybrid-base-e50-n20-v2.json',        sourceMapVersion: 'v12' },

  // Stock Turbo Stage 3 N20 MAP
  { packageId: 'ina0s-stock-turbo-stage3-91-n20-v2',  romId: 'INA0S', stage: 'stage3', fuel: '91',  patchRegions: 111, safeForApp: true,  packageType: 'n20-map', filename: 'ina0s/ina0s-stock-turbo-stage3-91-n20-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'ina0s-stock-turbo-stage3-93-n20-v2',  romId: 'INA0S', stage: 'stage3', fuel: '93',  patchRegions: 111, safeForApp: true,  packageType: 'n20-map', filename: 'ina0s/ina0s-stock-turbo-stage3-93-n20-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'ina0s-stock-turbo-stage3-e50-n20-v2', romId: 'INA0S', stage: 'stage3', fuel: 'e50', patchRegions: 114, safeForApp: true,  packageType: 'n20-map', filename: 'ina0s/ina0s-stock-turbo-stage3-e50-n20-v2.json', sourceMapVersion: 'v12' },

  // ══ IJE0S — READY (safeForApp: true) — OWNER_ACCEPT promotion 2026-06-08 ════
  // Audit 2026-06-08: all included regions verified against IJE0S_original.bin
  //   (0 stock-hex mismatch, 0 overlap, all in bounds). 14 IDENT + 2 CHECKSUM
  //   regions STRIPPED (software-identity + checksum bytes — excluded from app).
  //   132 calibration-space writes = OWNER_ACCEPT / OWNER_VERIFIED_CALIBRATION
  //   (known-good V90 IJE0S source + owner confirmation; NOT XDF-evidenced —
  //   available XDFs do not define these regions). 2 regions legacy-XDF-evidenced.
  //   patchRegions counts below = post-strip (original − 16). Review BIN only.

  // Stage 1+ (v12) — READY (OWNER_ACCEPT)
  { packageId: 'ije0s-stage1p-91-v2', romId: 'IJE0S', stage: 'stage1+', fuel: '91',  patchRegions: 272, safeForApp: true, packageType: 'standard-ots', filename: 'ije0s/ije0s-stage1p-91-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'ije0s-stage1p-93-v2', romId: 'IJE0S', stage: 'stage1+', fuel: '93',  patchRegions: 273, safeForApp: true, packageType: 'standard-ots', filename: 'ije0s/ije0s-stage1p-93-v2.json',  sourceMapVersion: 'v12' },

  // Stage 2 (v12) — READY (OWNER_ACCEPT)
  { packageId: 'ije0s-stage2-91-v2',  romId: 'IJE0S', stage: 'stage2',  fuel: '91',  patchRegions: 281, safeForApp: true, packageType: 'standard-ots', filename: 'ije0s/ije0s-stage2-91-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'ije0s-stage2-93-v2',  romId: 'IJE0S', stage: 'stage2',  fuel: '93',  patchRegions: 285, safeForApp: true, packageType: 'standard-ots', filename: 'ije0s/ije0s-stage2-93-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'ije0s-stage2-e50-v2', romId: 'IJE0S', stage: 'stage2',  fuel: 'e50', patchRegions: 292, safeForApp: true, packageType: 'standard-ots', filename: 'ije0s/ije0s-stage2-e50-v2.json',  sourceMapVersion: 'v12' },

  // Stage 3 (v12) — READY (OWNER_ACCEPT)
  { packageId: 'ije0s-stage3-91-v2',  romId: 'IJE0S', stage: 'stage3',  fuel: '91',  patchRegions: 298, safeForApp: true, packageType: 'standard-ots', filename: 'ije0s/ije0s-stage3-91-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'ije0s-stage3-93-v2',  romId: 'IJE0S', stage: 'stage3',  fuel: '93',  patchRegions: 296, safeForApp: true, packageType: 'standard-ots', filename: 'ije0s/ije0s-stage3-93-v2.json',   sourceMapVersion: 'v12' },
  { packageId: 'ije0s-stage3-e50-v2', romId: 'IJE0S', stage: 'stage3',  fuel: 'e50', patchRegions: 292, safeForApp: true, packageType: 'standard-ots', filename: 'ije0s/ije0s-stage3-e50-v2.json',  sourceMapVersion: 'v12' },

  // Hybrid Base N20 MAP (TD03-H) — READY (OWNER_ACCEPT)
  { packageId: 'ije0s-hybrid-base-pump-n20-v2',       romId: 'IJE0S', stage: 'hybrid-base', fuel: 'pump', patchRegions: 267, safeForApp: true, packageType: 'n20-map', filename: 'ije0s/ije0s-hybrid-base-pump-n20-v2.json',       sourceMapVersion: 'v12' },
  { packageId: 'ije0s-hybrid-base-e50-n20-v2',        romId: 'IJE0S', stage: 'hybrid-base', fuel: 'e50',  patchRegions: 280, safeForApp: true, packageType: 'n20-map', filename: 'ije0s/ije0s-hybrid-base-e50-n20-v2.json',        sourceMapVersion: 'v12' },

  // Stock Turbo Stage 3 N20 MAP — READY (OWNER_ACCEPT)
  { packageId: 'ije0s-stock-turbo-stage3-91-n20-v2',  romId: 'IJE0S', stage: 'stage3', fuel: '91',  patchRegions: 269, safeForApp: true, packageType: 'n20-map', filename: 'ije0s/ije0s-stock-turbo-stage3-91-n20-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'ije0s-stock-turbo-stage3-93-n20-v2',  romId: 'IJE0S', stage: 'stage3', fuel: '93',  patchRegions: 269, safeForApp: true, packageType: 'n20-map', filename: 'ije0s/ije0s-stock-turbo-stage3-93-n20-v2.json',  sourceMapVersion: 'v12' },
  { packageId: 'ije0s-stock-turbo-stage3-e50-n20-v2', romId: 'IJE0S', stage: 'stage3', fuel: 'e50', patchRegions: 279, safeForApp: true, packageType: 'n20-map', filename: 'ije0s/ije0s-stock-turbo-stage3-e50-n20-v2.json', sourceMapVersion: 'v12' },

  // ══ IKM0S — Standard OTS (v90 source) — READY 2026-06-09 ═══════════════════════
  // Source: verified v90 OTS BINs (no v12 NEW MAPS series exists for IKM0S).
  // Stock SHA-256: 6e1e4d70166dfe7a6608b8c63101153c8e1b163a2acc5e9ffd49bf0a49e9a4df
  // All included regions XDF-evidenced against ikm0s.xdf (0 un-evidenced writes).
  // Single flag byte 0x0470B2 excluded (UNKNOWN_EXCLUDE, owner-approved 2026-06-09).
  // Stage map: v90 "stage 2+" → stage3 (owner-mapped). Fuels: active 91/93/E30/E50
  // only (95/ACN91 held — 'future'). Review BIN only; external flasher checksums.
  // Stage 1 (v90)
  { packageId: 'ikm0s-stage1-91-v90',   romId: 'IKM0S', stage: 'stage1',  fuel: '91',  patchRegions: 152, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage1-91-v90.json',   sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage1-93-v90',   romId: 'IKM0S', stage: 'stage1',  fuel: '93',  patchRegions: 152, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage1-93-v90.json',   sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage1-e30-v90',  romId: 'IKM0S', stage: 'stage1',  fuel: 'e30', patchRegions: 124, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage1-e30-v90.json',  sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage1-e50-v90',  romId: 'IKM0S', stage: 'stage1',  fuel: 'e50', patchRegions: 124, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage1-e50-v90.json',  sourceMapVersion: 'v90-source' },

  // Stage 1+ (v90)
  { packageId: 'ikm0s-stage1p-91-v90',  romId: 'IKM0S', stage: 'stage1+', fuel: '91',  patchRegions: 152, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage1p-91-v90.json',  sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage1p-93-v90',  romId: 'IKM0S', stage: 'stage1+', fuel: '93',  patchRegions: 152, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage1p-93-v90.json',  sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage1p-e30-v90', romId: 'IKM0S', stage: 'stage1+', fuel: 'e30', patchRegions: 143, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage1p-e30-v90.json', sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage1p-e50-v90', romId: 'IKM0S', stage: 'stage1+', fuel: 'e50', patchRegions: 124, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage1p-e50-v90.json', sourceMapVersion: 'v90-source' },

  // Stage 2 (v90)
  { packageId: 'ikm0s-stage2-91-v90',   romId: 'IKM0S', stage: 'stage2',  fuel: '91',  patchRegions: 152, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage2-91-v90.json',   sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage2-93-v90',   romId: 'IKM0S', stage: 'stage2',  fuel: '93',  patchRegions: 152, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage2-93-v90.json',   sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage2-e30-v90',  romId: 'IKM0S', stage: 'stage2',  fuel: 'e30', patchRegions: 124, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage2-e30-v90.json',  sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage2-e50-v90',  romId: 'IKM0S', stage: 'stage2',  fuel: 'e50', patchRegions: 124, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage2-e50-v90.json',  sourceMapVersion: 'v90-source' },

  // Stage 3 (v90 — mapped from v90 "stage 2+")
  { packageId: 'ikm0s-stage3-91-v90',   romId: 'IKM0S', stage: 'stage3',  fuel: '91',  patchRegions: 152, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage3-91-v90.json',   sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage3-93-v90',   romId: 'IKM0S', stage: 'stage3',  fuel: '93',  patchRegions: 152, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage3-93-v90.json',   sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage3-e30-v90',  romId: 'IKM0S', stage: 'stage3',  fuel: 'e30', patchRegions: 124, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage3-e30-v90.json',  sourceMapVersion: 'v90-source' },
  { packageId: 'ikm0s-stage3-e50-v90',  romId: 'IKM0S', stage: 'stage3',  fuel: 'e50', patchRegions: 124, safeForApp: true, packageType: 'standard-ots', filename: 'ikm0s/ikm0s-stage3-e50-v90.json',  sourceMapVersion: 'v90-source' },

]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getPackageById(id: string): PatchPackageManifestEntry | undefined {
  return patchPackageManifest.find((p) => p.packageId === id)
}

export function getPackageByFilter(params: {
  romId?:       string
  stage?:       string
  fuel?:        string
  /**
   * Required when stage+fuel combo is ambiguous between Standard OTS and N20 MAP.
   * e.g. stage3/91 exists in both 'standard-ots' and 'n20-map' for I8A0S.
   * Always pass this from the UI to guarantee the correct package is returned.
   */
  packageType?: 'standard-ots' | 'n20-map'
  /** Filter to only READY packages (default: all) */
  readyOnly?: boolean
}): PatchPackageManifestEntry | undefined {
  return patchPackageManifest.find((p) => {
    if (params.romId       && p.romId       !== params.romId)       return false
    if (params.stage       && p.stage       !== params.stage)       return false
    if (params.fuel        && p.fuel        !== params.fuel)        return false
    if (params.packageType && p.packageType !== params.packageType) return false
    if (params.readyOnly   && !p.safeForApp)                        return false
    return true
  })
}

export function listPackagesByRom(romId: string): PatchPackageManifestEntry[] {
  return patchPackageManifest.filter((p) => p.romId === romId)
}

export function listReadyPackages(): PatchPackageManifestEntry[] {
  return patchPackageManifest.filter((p) => p.safeForApp)
}
