// ─── Hard SHA Gate Tests ───────────────────────────────────────────────────────
//
// Task 5: Generate BIN requires exact SHA-256 match for the selected ROM.
// Tests cover:
//   - unknown 2MB BIN (wrong SHA) cannot generate
//   - correct stock hash enables generate
//   - .ori/.org extension blocks generate (only .bin accepted)
//   - rom-mismatch SHA blocks generate
//   - region mismatch still blocks DOWNLOAD as second safety layer
//
// These tests operate at the logic level (binVerifier + isStockBinVerified rules).
// The TuneProgram component uses `isStockBinVerified` which requires:
//   extensionStatus === 'preferred' AND sizeValid AND hashMatchStatus === 'known-stock'
//
import { describe, it, expect } from 'vitest'
import { validatePatchPackage } from '../patchPackageValidator'
import { verifyReviewDownloadGates } from '../reviewBinDownload'
import type { PatchApplyResult } from '@/types/tune-program'

// ─── isStockBinVerified logic (mirrors TuneProgram.tsx) ──────────────────────

interface FakeBinResult {
  extensionStatus: 'preferred' | 'allowed_with_warning' | 'rejected'
  sizeValid: boolean
  hashMatchStatus: 'known-stock' | 'unknown-2mb' | 'rom-mismatch' | 'invalid'
  hashMatchedRom?: string
}

function isStockBinVerified(r: FakeBinResult): boolean {
  return (
    r.extensionStatus === 'preferred' &&
    r.sizeValid &&
    r.hashMatchStatus === 'known-stock'
  )
}

// ─── Hard SHA gate ─────────────────────────────────────────────────────────────

describe('isStockBinVerified — hard pre-generate gate', () => {
  const validBin: FakeBinResult = {
    extensionStatus: 'preferred',
    sizeValid: true,
    hashMatchStatus: 'known-stock',
  }

  it('enables when extension=.bin + correct size + known-stock SHA', () => {
    expect(isStockBinVerified(validBin)).toBe(true)
  })

  it('blocks unknown 2MB BIN with wrong SHA (hashMatchStatus unknown-2mb)', () => {
    expect(isStockBinVerified({ ...validBin, hashMatchStatus: 'unknown-2mb' })).toBe(false)
  })

  it('blocks rom-mismatch SHA (hash matches a different ROM)', () => {
    expect(
      isStockBinVerified({ ...validBin, hashMatchStatus: 'rom-mismatch', hashMatchedRom: 'INA0S' }),
    ).toBe(false)
  })

  it('blocks invalid (size/extension failure)', () => {
    expect(isStockBinVerified({ ...validBin, hashMatchStatus: 'invalid' })).toBe(false)
  })

  it('blocks .ori extension even with correct SHA (only .bin accepted)', () => {
    expect(
      isStockBinVerified({ ...validBin, extensionStatus: 'allowed_with_warning' }),
    ).toBe(false)
  })

  it('blocks .xyz extension', () => {
    expect(isStockBinVerified({ ...validBin, extensionStatus: 'rejected' })).toBe(false)
  })

  it('blocks wrong size even with correct extension', () => {
    expect(isStockBinVerified({ ...validBin, sizeValid: false })).toBe(false)
  })

  it('all three conditions must pass simultaneously', () => {
    // Each single failure blocks
    const cases: FakeBinResult[] = [
      { extensionStatus: 'rejected',             sizeValid: true,  hashMatchStatus: 'known-stock' },
      { extensionStatus: 'allowed_with_warning', sizeValid: true,  hashMatchStatus: 'known-stock' },
      { extensionStatus: 'preferred',            sizeValid: false, hashMatchStatus: 'known-stock' },
      { extensionStatus: 'preferred',            sizeValid: true,  hashMatchStatus: 'unknown-2mb' },
      { extensionStatus: 'preferred',            sizeValid: true,  hashMatchStatus: 'rom-mismatch' },
      { extensionStatus: 'preferred',            sizeValid: true,  hashMatchStatus: 'invalid' },
    ]
    for (const c of cases) {
      expect(isStockBinVerified(c)).toBe(false)
    }
  })
})

// ─── Download gate — second safety layer ─────────────────────────────────────

describe('verifyReviewDownloadGates — second safety layer after apply', () => {
  function makeResult(over: Partial<PatchApplyResult> = {}): PatchApplyResult {
    return {
      outputMode: 'STANDARD_BIN_REVIEW_ONLY',
      ownerReviewRequired: true,
      encryptionApproved: false,
      mhdEncryptionAllowed: false,
      packageId: 'i8a0s-stage2-91-v2',
      romId: 'I8A0S',
      stage: 'stage2',
      fuel: '91',
      inputSha256: 'c53ff0d4da3aafb0aee93b2a4df165b4f98229752b2bc2ea694a2699bc396b38',
      stockSha256Expected: 'c53ff0d4da3aafb0aee93b2a4df165b4f98229752b2bc2ea694a2699bc396b38',
      stockSha256Match: true,
      status: 'success',
      totalRegions: 1,
      appliedCount: 1,
      stockMismatchCount: 0,
      patchedSha256: 'f'.repeat(64),
      tunedSha256Expected: 'e'.repeat(64),
      patchedMatchesTuned: false,
      regionResults: [],
      errors: [],
      notes: [],
      ...over,
    }
  }

  it('passes a clean apply result', () => {
    const gate = verifyReviewDownloadGates(makeResult())
    expect(gate.pass).toBe(true)
  })

  it('blocks download when stockMismatchCount > 0 (region mismatch = second safety layer)', () => {
    const gate = verifyReviewDownloadGates(makeResult({ stockMismatchCount: 3 }))
    expect(gate.pass).toBe(false)
    if (!gate.pass) expect(gate.reason).toContain('mismatch')
  })

  it('blocks download when encryptionApproved:true (safety violation)', () => {
    // Cast needed: the type is readonly false, but we test the runtime guard.
    const gate = verifyReviewDownloadGates(makeResult({ encryptionApproved: true as false }))
    expect(gate.pass).toBe(false)
  })

  it('blocks download when outputMode is wrong', () => {
    const gate = verifyReviewDownloadGates(
      makeResult({ outputMode: 'WRONG_MODE' as 'STANDARD_BIN_REVIEW_ONLY' }),
    )
    expect(gate.pass).toBe(false)
  })
})

// ─── Patch validator rejects safeForAppPackage:false ─────────────────────────

describe('validatePatchPackage — safeForAppPackage must be true', () => {
  it('rejects IJE0S package with safeForAppPackage:false', () => {
    const out = validatePatchPackage({
      packageId: 'ije0s-stage2-91-v2',
      packageVersion: 2,
      romId: 'IJE0S',
      stage: 'stage2',
      fuel: '91',
      stockSha256: '25adcdcc54f698154315f50731db033c5aa48136e93b20a4de8e9e87cba59c18',
      tunedSha256: 'a'.repeat(64),
      outputMode: 'STANDARD_BIN_REVIEW_ONLY',
      ownerReviewRequired: true,
      encryptionApproved: false,
      mhdEncryptionAllowed: false,
      safeForAppPackage: false,   // ← set by build pipeline when audit incomplete
      externalFlasherRequired: true,
      requiresExternalFlasherChecksum: true,
      supportedFlashers: [],
      patchRegionCount: 1,
      patchRegions: [{ offset: 0, byteCount: 1, expectedStockHex: '00', replacementHex: 'ff', mapName: null, category: null }],
    })
    expect(out.valid).toBe(false)
    expect(out.errors.some((e) => e.includes('safeForAppPackage'))).toBe(true)
  })
})
