// ─── Patch Engine Tests ────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { hexStringToBytes, applyPatchesReview, applyPatchesForDownload } from '../patchEngine'
import type { AppSafePatchPackage } from '@/types/tune-program'

const EXPECTED_SIZE = 2_097_152 // 2 MiB

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a minimal valid AppSafePatchPackage for testing.
 * stockSha256 is deliberately wrong (all zeros) to avoid needing a real BIN.
 * tunedSha256 is also zeroed.
 */
function makePkg(overrides: Partial<AppSafePatchPackage> = {}): AppSafePatchPackage {
  return {
    packageId:      'test-i8a0s-stage2-93-v2',
    packageVersion: 2,
    romId:          'I8A0S',
    stage:          'stage2',
    fuel:           '93',
    stockSha256:    'a'.repeat(64),   // dummy — will cause stock_sha_mismatch
    tunedSha256:    'b'.repeat(64),
    outputMode:     'STANDARD_BIN_REVIEW_ONLY',
    ownerReviewRequired:             true,
    encryptionApproved:              false,
    mhdEncryptionAllowed:            false,
    safeForAppPackage:               true,
    externalFlasherRequired:         true,
    requiresExternalFlasherChecksum: true,
    supportedFlashers:               ['MHD N54 Flasher', 'N54 Quickflash'],
    patchRegionCount: 1,
    patchRegions: [
      {
        offset:           0,
        byteCount:        2,
        expectedStockHex: '00 00',
        replacementHex:   'aa bb',
        mapName:          null,
        category:         null,
      },
    ],
    ...overrides,
  }
}

/** Create a 2MB ArrayBuffer with all zeros */
function makeStockBuffer(size = EXPECTED_SIZE): ArrayBuffer {
  return new ArrayBuffer(size)
}

// ─── hexStringToBytes ─────────────────────────────────────────────────────────

describe('hexStringToBytes', () => {
  it('parses space-separated hex', () => {
    const bytes = hexStringToBytes('aa bb cc')
    expect(bytes).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]))
  })

  it('parses packed hex', () => {
    expect(hexStringToBytes('aabbcc')).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]))
  })

  it('returns empty for empty string', () => {
    expect(hexStringToBytes('')).toEqual(new Uint8Array(0))
  })

  it('handles single byte', () => {
    expect(hexStringToBytes('ff')).toEqual(new Uint8Array([0xff]))
  })
})

// ─── Safety gate checks ───────────────────────────────────────────────────────

describe('applyPatchesReview — safety gates', () => {
  it('throws when outputMode is not STANDARD_BIN_REVIEW_ONLY', async () => {
    const pkg = makePkg({ outputMode: 'SOMETHING_ELSE' as 'STANDARD_BIN_REVIEW_ONLY' })
    await expect(applyPatchesReview(makeStockBuffer(), pkg)).rejects.toThrow(
      /outputMode must be/,
    )
  })

  it('throws when encryptionApproved is true', async () => {
    const pkg = makePkg({ encryptionApproved: true })
    await expect(applyPatchesReview(makeStockBuffer(), pkg)).rejects.toThrow(
      /encryptionApproved/,
    )
  })

  it('throws when mhdEncryptionAllowed is true', async () => {
    const pkg = makePkg({ mhdEncryptionAllowed: true })
    await expect(applyPatchesReview(makeStockBuffer(), pkg)).rejects.toThrow(
      /mhdEncryptionAllowed/,
    )
  })

  it('throws when safeForAppPackage is false', async () => {
    const pkg = makePkg({ safeForAppPackage: false })
    await expect(applyPatchesReview(makeStockBuffer(), pkg)).rejects.toThrow(
      /safeForAppPackage/,
    )
  })

  it('throws when buffer is wrong size', async () => {
    await expect(
      applyPatchesReview(new ArrayBuffer(1024), makePkg()),
    ).rejects.toThrow(/2097152/)
  })
})

// ─── Stock SHA mismatch ───────────────────────────────────────────────────────

describe('applyPatchesReview — stock SHA mismatch', () => {
  it('returns stock_sha_mismatch status when SHA does not match', async () => {
    const result = await applyPatchesReview(makeStockBuffer(), makePkg())
    // All-zero buffer SHA won't match pkg.stockSha256 = 'aaa...'
    expect(result.status).toBe('stock_sha_mismatch')
    expect(result.stockSha256Match).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('Stock SHA-256 mismatch')
  })
})

// ─── Region-level stock mismatch ──────────────────────────────────────────────

describe('applyPatchesReview — region stock mismatch', () => {
  it('marks region as stockMismatch when expected bytes differ from actual', async () => {
    // Stock buffer = all zeros; expected = 'ff ff' → mismatch
    const pkg = makePkg({
      patchRegions: [{
        offset: 0, byteCount: 2,
        expectedStockHex: 'ff ff',
        replacementHex:   'aa bb',
        mapName: null, category: null,
      }],
    })

    const result = await applyPatchesReview(makeStockBuffer(), pkg)
    expect(result.regionResults[0].stockMismatch).toBe(true)
    expect(result.regionResults[0].applied).toBe(false)
  })
})

// ─── Output size invariant ────────────────────────────────────────────────────

describe('applyPatchesForDownload — output size', () => {
  it('patched bytes are exactly 2,097,152 bytes', async () => {
    // Use correct expected bytes ('00 00') to match all-zero buffer
    const pkg = makePkg({
      patchRegions: [{
        offset: 100, byteCount: 2,
        expectedStockHex: '00 00',
        replacementHex:   'aa bb',
        mapName: null, category: null,
      }],
    })

    const { patchedBytes } = await applyPatchesForDownload(makeStockBuffer(), pkg)
    expect(patchedBytes.length).toBe(EXPECTED_SIZE)
  })

  it('applies replacement bytes at the correct offset', async () => {
    const pkg = makePkg({
      patchRegions: [{
        offset: 500, byteCount: 3,
        expectedStockHex: '00 00 00',
        replacementHex:   'de ad be',
        mapName: null, category: null,
      }],
    })

    const { patchedBytes } = await applyPatchesForDownload(makeStockBuffer(), pkg)
    expect(patchedBytes[500]).toBe(0xde)
    expect(patchedBytes[501]).toBe(0xad)
    expect(patchedBytes[502]).toBe(0xbe)
  })

  it('does not modify bytes outside of patch regions', async () => {
    const pkg = makePkg({
      patchRegions: [{
        offset: 10, byteCount: 2,
        expectedStockHex: '00 00',
        replacementHex:   'ff ff',
        mapName: null, category: null,
      }],
    })

    const { patchedBytes } = await applyPatchesForDownload(makeStockBuffer(), pkg)
    // Bytes before patch region must be zero
    expect(patchedBytes[0]).toBe(0x00)
    expect(patchedBytes[9]).toBe(0x00)
    // Bytes after patch region must be zero
    expect(patchedBytes[12]).toBe(0x00)
  })

  it('does not mutate the original stock buffer', async () => {
    const stockBuffer = makeStockBuffer()
    const originalView = new Uint8Array(stockBuffer)
    const pkg = makePkg({
      patchRegions: [{
        offset: 0, byteCount: 2,
        expectedStockHex: '00 00',
        replacementHex:   'ff ff',
        mapName: null, category: null,
      }],
    })

    await applyPatchesForDownload(stockBuffer, pkg)

    // Original should still be all zeros
    expect(originalView[0]).toBe(0x00)
    expect(originalView[1]).toBe(0x00)
  })
})

// ─── Hard-coded output mode fields ───────────────────────────────────────────

describe('applyPatchesReview — hard-coded safety output fields', () => {
  it('always sets outputMode to STANDARD_BIN_REVIEW_ONLY', async () => {
    const result = await applyPatchesReview(makeStockBuffer(), makePkg())
    expect(result.outputMode).toBe('STANDARD_BIN_REVIEW_ONLY')
  })

  it('always sets ownerReviewRequired to true', async () => {
    const result = await applyPatchesReview(makeStockBuffer(), makePkg())
    expect(result.ownerReviewRequired).toBe(true)
  })

  it('always sets encryptionApproved to false', async () => {
    const result = await applyPatchesReview(makeStockBuffer(), makePkg())
    expect(result.encryptionApproved).toBe(false)
  })

  it('always sets mhdEncryptionAllowed to false', async () => {
    const result = await applyPatchesReview(makeStockBuffer(), makePkg())
    expect(result.mhdEncryptionAllowed).toBe(false)
  })
})
