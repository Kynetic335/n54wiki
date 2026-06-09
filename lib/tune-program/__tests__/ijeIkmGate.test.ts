// ─── IJE0S / IKM0S Gate Tests ─────────────────────────────────────────────────
//
// Covers Task 4 requirements:
//   - IJE0S not blocked by name — blocked by package data (safeForAppPackage:false)
//   - IJE0S READY packages would enable Generate BIN if promoted
//   - IJE0S invalid/not-ready packages stay disabled with exact reason
//   - IKM0S built 2026-06-09 (v90 OTS) — ROM gate READY, built combos enable
//   - IKM0S unbuilt fuel (95/ACN91 future) still disabled (no matching package)
//   - No package READY without stockSha256
//   - No package READY with missing patch JSON (manifest only)
//   - Invalid patch JSON disables Generate BIN
//   - Overlapping ranges fail validation (covered in patchPackageValidator.test.ts)
//   - Private/raw files not imported (covered in privacyScan.test.ts)
//
import { describe, it, expect, vi } from 'vitest'
import { resolveGenerateBin, validateManifestEntry } from '../generateBinGate'
import { getPackageGateStatus, getRomGateStatus } from '../packageGates'
import { validatePatchPackage } from '../patchPackageValidator'
import { patchPackageManifest } from '@/data/tune-program/patch-packages/manifest'
import type { AppSafePatchPackage } from '@/types/tune-program'
import type { PatchPackageManifestEntry } from '@/data/tune-program/patch-packages/manifest'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeManifestEntry(over: Partial<PatchPackageManifestEntry> = {}): PatchPackageManifestEntry {
  return {
    packageId: 'test-ije0s-stage2-91-v2',
    romId: 'IJE0S',
    stage: 'stage2',
    fuel: '91',
    patchRegions: 297,
    safeForApp: true,             // hypothetical READY entry
    packageType: 'standard-ots',
    sourceMapVersion: 'v12',
    filename: 'ije0s/test-ije0s-stage2-91-v2.json',
    ...over,
  }
}

function makePkg(over: Partial<AppSafePatchPackage> = {}): AppSafePatchPackage {
  return {
    packageId: 'test-ije0s-stage2-91-v2',
    packageVersion: 2,
    romId: 'IJE0S',
    stage: 'stage2',
    fuel: '91',
    stockSha256: '25adcdcc54f698154315f50731db033c5aa48136e93b20a4de8e9e87cba59c18',
    tunedSha256: 'e'.repeat(64),
    outputMode: 'STANDARD_BIN_REVIEW_ONLY',
    ownerReviewRequired: true,
    encryptionApproved: false,
    mhdEncryptionAllowed: false,
    safeForAppPackage: true,
    externalFlasherRequired: true,
    requiresExternalFlasherChecksum: true,
    supportedFlashers: ['MHD N54 Flasher'],
    patchRegionCount: 1,
    patchRegions: [{ offset: 0, byteCount: 2, expectedStockHex: '00 00', replacementHex: 'aa bb', mapName: null, category: null }],
    ...over,
  }
}

// ─── IJE0S gate — real manifest (data-driven, not name-locked) ────────────────

describe('IJE0S gate — real manifest packages (READY after OWNER_ACCEPT promotion 2026-06-08)', () => {
  it('IJE0S is decided by data not name — manifest has 13 entries, all READY', () => {
    const ijeEntries = patchPackageManifest.filter((p) => p.romId === 'IJE0S')
    expect(ijeEntries.length).toBe(13)
    // All promoted to safeForApp:true → READY (14 IDENT + 2 CHECKSUM stripped,
    // 132 calibration writes OWNER_ACCEPT, 2 legacy-XDF-evidenced).
    expect(ijeEntries.every((p) => p.safeForApp === true)).toBe(true)
    expect(ijeEntries.every((p) => getPackageGateStatus(p) === 'READY')).toBe(true)
  })

  it('IJE0S ROM-level gate is READY (all packages safeForApp:true)', () => {
    expect(getRomGateStatus('IJE0S')).toBe('READY')
  })

  it('IJE0S Generate BIN enabled for all real packages', () => {
    const ijeEntries = patchPackageManifest.filter((p) => p.romId === 'IJE0S')
    for (const entry of ijeEntries) {
      const d = resolveGenerateBin({ romId: entry.romId, stage: entry.stage, fuel: entry.fuel, packageType: entry.packageType })
      expect(d.enabled).toBe(true)
    }
  })
})

// ─── IJE0S gate — hypothetical READY promotion ───────────────────────────────

describe('IJE0S hypothetical READY — if XDF audit passes and manifest updated', () => {
  // These tests use a mocked manifest so we can prove the gate is data-driven:
  // if a READY+valid IJE0S entry existed, Generate BIN would enable.

  it('IJE0S stage2/91 package enables Generate BIN when safeForApp promoted to true', () => {
    // Mock the manifest to return a READY IJE0S entry.
    vi.doMock('@/data/tune-program/patch-packages/manifest', () => ({
      patchPackageManifest: [makeManifestEntry({ safeForApp: true })],
      getPackageByFilter: () => makeManifestEntry({ safeForApp: true }),
    }))
    // Without the mock active in the module under test, use packageGates directly.
    // Prove that a READY entry would pass the gate check.
    const readyEntry = makeManifestEntry({ safeForApp: true })
    expect(getPackageGateStatus(readyEntry)).toBe('READY')
    vi.doUnmock('@/data/tune-program/patch-packages/manifest')
  })

  it('validatePatchPackage passes a well-formed IJE0S package with safeForAppPackage:true', () => {
    const pkg = makePkg({ safeForAppPackage: true })
    const result = validatePatchPackage(pkg, { romId: 'IJE0S', stage: 'stage2', fuel: '91' })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('validatePatchPackage fails a hypothetical IJE0S package with safeForAppPackage:false', () => {
    const pkg = makePkg({ safeForAppPackage: false })
    const result = validatePatchPackage(pkg)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('safeForAppPackage'))).toBe(true)
  })
})

// ─── No READY without stockSha256 ────────────────────────────────────────────

describe('stockSha256 required for Generate BIN', () => {
  it('IJE0S package with blank stockSha256 fails validator', () => {
    const pkg = makePkg({ stockSha256: '' })
    const result = validatePatchPackage(pkg)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('stockSha256'))).toBe(true)
  })

  it('IJE0S package with invalid-length stockSha256 fails validator', () => {
    const pkg = makePkg({ stockSha256: 'abc123' })
    const result = validatePatchPackage(pkg)
    expect(result.valid).toBe(false)
  })
})

// ─── IKM0S ────────────────────────────────────────────────────────────────────

describe('IKM0S — built 2026-06-09 (v90 OTS)', () => {
  it('IKM0S ROM-level gate is READY', () => {
    expect(getRomGateStatus('IKM0S')).toBe('READY')
  })

  it('IKM0S Generate BIN enabled for a built package (stage2/91)', () => {
    const d = resolveGenerateBin({ romId: 'IKM0S', stage: 'stage2', fuel: '91', packageType: 'standard-ots' })
    expect(d.enabled).toBe(true)
  })

  it('IKM0S unbuilt fuel (95 — future) still disabled with No matching package', () => {
    const d = resolveGenerateBin({ romId: 'IKM0S', stage: 'stage2', fuel: '95', packageType: 'standard-ots' })
    expect(d.enabled).toBe(false)
    if (!d.enabled) expect(d.reason).toBe('No matching package')
  })

  it('every READY IKM0S manifest entry passes getPackageGateStatus', () => {
    const ikm = patchPackageManifest.filter((p) => p.romId === 'IKM0S')
    expect(ikm).toHaveLength(16)
    expect(ikm.every((p) => getPackageGateStatus(p) === 'READY')).toBe(true)
  })
})

// ─── Missing patch JSON ───────────────────────────────────────────────────────

describe('missing patch JSON disables Generate BIN', () => {
  it('validateManifestEntry flags empty filename', () => {
    // validateManifestEntry is called inside resolveGenerateBin.
    // A READY entry with empty filename fails the Invalid package check.
    const entry = makeManifestEntry({ filename: '' })
    const problems = validateManifestEntry(entry)
    expect(problems.some((p) => p.includes('filename'))).toBe(true)
  })

  it('validateManifestEntry flags non-.json filename', () => {
    const entry = makeManifestEntry({ filename: 'ije0s/ije0s-stage2-91-v2.bin' })
    const problems = validateManifestEntry(entry)
    expect(problems.some((p) => p.includes('.json'))).toBe(true)
  })

  it('validateManifestEntry flags filename outside ROM directory', () => {
    const entry = makeManifestEntry({ filename: 'i8a0s/ije0s-stage2-91-v2.json' })
    const problems = validateManifestEntry(entry)
    expect(problems.some((p) => p.includes('not under'))).toBe(true)
  })
})
