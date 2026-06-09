// ─── Patch Package Validator Tests ────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  validatePatchPackage,
  decodedByteLength,
  ROM_SIZE,
} from '../patchPackageValidator'
import type { AppSafePatchPackage, AppSafePatchRegion } from '@/types/tune-program'

function region(over: Partial<AppSafePatchRegion> = {}): AppSafePatchRegion {
  return {
    offset: 0,
    byteCount: 2,
    expectedStockHex: '00 00',
    replacementHex: 'aa bb',
    mapName: null,
    category: null,
    ...over,
  }
}

function pkg(over: Partial<AppSafePatchPackage> = {}): AppSafePatchPackage {
  return {
    packageId: 'i8a0s-stage2-91-v2',
    packageVersion: 2,
    romId: 'I8A0S',
    stage: 'stage2',
    fuel: '91',
    stockSha256: 'c'.repeat(64),
    tunedSha256: 'd'.repeat(64),
    outputMode: 'STANDARD_BIN_REVIEW_ONLY',
    ownerReviewRequired: true,
    encryptionApproved: false,
    mhdEncryptionAllowed: false,
    safeForAppPackage: true,
    externalFlasherRequired: true,
    requiresExternalFlasherChecksum: true,
    supportedFlashers: ['MHD N54 Flasher'],
    patchRegionCount: 1,
    patchRegions: [region()],
    ...over,
  }
}

// ─── decodedByteLength ────────────────────────────────────────────────────────

describe('decodedByteLength', () => {
  it('counts space-separated hex', () => {
    expect(decodedByteLength('aa bb cc')).toBe(3)
  })
  it('counts packed even-length hex', () => {
    expect(decodedByteLength('aabbcc')).toBe(3)
  })
  it('rejects odd-length packed hex', () => {
    expect(decodedByteLength('aabbc')).toBe(-1)
  })
  it('rejects non-hex tokens', () => {
    expect(decodedByteLength('aa zz')).toBe(-1)
  })
  it('rejects empty', () => {
    expect(decodedByteLength('   ')).toBe(-1)
  })
})

// ─── Valid package ────────────────────────────────────────────────────────────

describe('validatePatchPackage — valid', () => {
  it('passes a well-formed package', () => {
    expect(validatePatchPackage(pkg())).toEqual({ valid: true, errors: [] })
  })

  it('passes metadata cross-check when ROM/stage/fuel match', () => {
    const out = validatePatchPackage(pkg(), { romId: 'I8A0S', stage: 'stage2', fuel: '91' })
    expect(out.valid).toBe(true)
  })
})

// ─── Rejections ───────────────────────────────────────────────────────────────

describe('validatePatchPackage — rejections', () => {
  it('rejects missing package', () => {
    expect(validatePatchPackage(null).valid).toBe(false)
  })

  it('rejects invalid hex in replacementHex', () => {
    const out = validatePatchPackage(pkg({ patchRegions: [region({ replacementHex: 'zz zz' })] }))
    expect(out.valid).toBe(false)
    expect(out.errors.some((e) => e.includes('replacementHex'))).toBe(true)
  })

  it('rejects expectedStockHex / replacementHex decoding to different lengths', () => {
    const out = validatePatchPackage(pkg({
      patchRegions: [region({ byteCount: 2, expectedStockHex: '00 00', replacementHex: 'aa' })],
    }))
    expect(out.valid).toBe(false)
    expect(out.errors.some((e) => e.includes('different lengths') || e.includes('byteCount'))).toBe(true)
  })

  it('rejects out-of-bounds offset', () => {
    const out = validatePatchPackage(pkg({ patchRegions: [region({ offset: ROM_SIZE })] }))
    expect(out.valid).toBe(false)
    expect(out.errors.some((e) => e.includes('outside the'))).toBe(true)
  })

  it('rejects write range overflowing ROM', () => {
    const out = validatePatchPackage(pkg({
      patchRegions: [region({ offset: ROM_SIZE - 1, byteCount: 2, expectedStockHex: '00 00', replacementHex: 'aa bb' })],
    }))
    expect(out.valid).toBe(false)
    expect(out.errors.some((e) => e.includes('exceeds ROM size'))).toBe(true)
  })

  it('rejects duplicate / conflicting write ranges (overlap)', () => {
    const out = validatePatchPackage(pkg({
      patchRegions: [
        region({ offset: 100, byteCount: 4, expectedStockHex: '00 00 00 00', replacementHex: '11 11 11 11' }),
        region({ offset: 102, byteCount: 4, expectedStockHex: '00 00 00 00', replacementHex: '22 22 22 22' }),
      ],
    }))
    expect(out.valid).toBe(false)
    expect(out.errors.some((e) => e.includes('overlapping'))).toBe(true)
  })

  it('allows adjacent (non-overlapping) ranges', () => {
    const out = validatePatchPackage(pkg({
      patchRegions: [
        region({ offset: 100, byteCount: 2, expectedStockHex: '00 00', replacementHex: '11 11' }),
        region({ offset: 102, byteCount: 2, expectedStockHex: '00 00', replacementHex: '22 22' }),
      ],
    }))
    expect(out.valid).toBe(true)
  })

  it('rejects a READY package missing required safety fields', () => {
    const out = validatePatchPackage(pkg({ safeForAppPackage: false }))
    expect(out.valid).toBe(false)
    expect(out.errors.some((e) => e.includes('safeForAppPackage'))).toBe(true)
  })

  it('rejects encryptionApproved: true', () => {
    const out = validatePatchPackage(pkg({ encryptionApproved: true }))
    expect(out.valid).toBe(false)
  })

  it('rejects metadata cross-check mismatch', () => {
    const out = validatePatchPackage(pkg(), { romId: 'INA0S', stage: 'stage2', fuel: '91' })
    expect(out.valid).toBe(false)
    expect(out.errors.some((e) => e.includes('romId'))).toBe(true)
  })
})
