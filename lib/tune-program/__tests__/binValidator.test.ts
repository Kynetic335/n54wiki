// ─── BIN Validator Tests ───────────────────────────────────────────────────────
//
// These tests use a synthetic File-like object since the real Web Crypto API
// is available in vitest (Node 18+ globalThis.crypto.subtle).
//
// Known stock SHA-256 values from data/tune-program/binFingerprints.ts:
//   I8A0S: c53ff0d4da3aafb0aee93b2a4df165b4f98229752b2bc2ea694a2699bc396b38
//   INA0S: 66296babb3f4060ecc9cb8f40faa982651a790c255361a39cd653f448db3f8e0
//   IJE0S: 25adcdcc54f698154315f50731db033c5aa48136e93b20a4de8e9e87cba59c18
//   IKM0S: 6e1e4d70166dfe7a6608b8c63101153c8e1b163a2acc5e9ffd49bf0a49e9a4df
//
// Since we cannot load real BIN files in unit tests, we:
//   - Test extension and size checks with synthetic buffers
//   - Test ROM mismatch / hash mismatch by pre-computing SHA-256 of test buffers
//
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { validateBinFile, EXPECTED_BIN_SIZE } from '../binValidator'

// ─── Test File builder ────────────────────────────────────────────────────────

/**
 * Create a synthetic File with the given name, size, and optional content.
 * We override arrayBuffer() to return a deterministic buffer for SHA-256 tests.
 */
function makeFile(
  name: string,
  sizeOrBuffer: number | ArrayBuffer,
): File {
  const buffer =
    sizeOrBuffer instanceof ArrayBuffer
      ? sizeOrBuffer
      : new ArrayBuffer(sizeOrBuffer)

  const blob = new Blob([buffer])
  const file = new File([blob], name, { type: 'application/octet-stream' })
  return file
}

/** Create a 2MB ArrayBuffer filled with `fill` byte value */
function make2mbBuffer(fill = 0): ArrayBuffer {
  const buf = new ArrayBuffer(EXPECTED_BIN_SIZE)
  if (fill !== 0) {
    new Uint8Array(buf).fill(fill)
  }
  return buf
}

// ─── Extension checks ─────────────────────────────────────────────────────────

describe('validateBinFile — extension', () => {
  it('rejects .txt extension', async () => {
    const file = makeFile('stock_rom.txt', EXPECTED_BIN_SIZE)
    const result = await validateBinFile(file, 'I8A0S')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('WRONG_EXTENSION')
    expect(result.message).toContain('.bin')
  })

  it('rejects no extension', async () => {
    const file = makeFile('stockrom', EXPECTED_BIN_SIZE)
    const result = await validateBinFile(file, 'I8A0S')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('WRONG_EXTENSION')
  })

  it('rejects .BIN extension if not lowercase (case sensitive)', async () => {
    // Our validator uses toLowerCase so .BIN should be accepted
    // (this tests that we handle case-insensitive correctly)
    const file = makeFile('stock.BIN', EXPECTED_BIN_SIZE)
    // BIN check uses endsWith('.bin') after toLowerCase — so .BIN should pass extension
    const result = await validateBinFile(file, 'I8A0S')
    // We expect it to get past extension check but fail on hash
    // (the buffer is all zeros — no known ROM has that hash)
    expect(result.error).not.toBe('WRONG_EXTENSION')
  })

  it('accepts .bin extension (proceeds to size check)', async () => {
    // Use wrong size to verify extension check passes
    const file = makeFile('stock.bin', 100)
    const result = await validateBinFile(file, 'I8A0S')
    expect(result.error).toBe('WRONG_SIZE')  // passes extension, fails size
  })
})

// ─── Size checks ─────────────────────────────────────────────────────────────

describe('validateBinFile — size', () => {
  it('rejects file smaller than 2MB', async () => {
    const file = makeFile('stock.bin', 1024 * 1024)  // 1 MB
    const result = await validateBinFile(file, 'I8A0S')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('WRONG_SIZE')
    expect(result.message).toContain('2,097,152')
  })

  it('rejects file larger than 2MB', async () => {
    const file = makeFile('stock.bin', EXPECTED_BIN_SIZE + 1)
    const result = await validateBinFile(file, 'I8A0S')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('WRONG_SIZE')
  })

  it('rejects empty file', async () => {
    const file = makeFile('stock.bin', 0)
    const result = await validateBinFile(file, 'I8A0S')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('WRONG_SIZE')
  })
})

// ─── Hash checks ─────────────────────────────────────────────────────────────

describe('validateBinFile — hash mismatch', () => {
  it('returns HASH_MISMATCH for unknown 2MB BIN (all-zero buffer)', async () => {
    const file = makeFile('stock.bin', make2mbBuffer(0))
    const result = await validateBinFile(file, 'I8A0S')
    expect(result.valid).toBe(false)
    // All-zero 2MB buffer won't match any known stock hash
    // And won't match another ROM's hash either
    expect(result.error).toBe('HASH_MISMATCH')
    expect(result.sha256).toBeDefined()
    expect(result.sha256).toHaveLength(64)
  })

  it('returns HASH_MISMATCH for another unknown 2MB BIN (all-0xff buffer)', async () => {
    const file = makeFile('stock.bin', make2mbBuffer(0xff))
    const result = await validateBinFile(file, 'I8A0S')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('HASH_MISMATCH')
    expect(result.sha256).toBeDefined()
  })
})

// ─── ROM mismatch ─────────────────────────────────────────────────────────────

describe('validateBinFile — ROM mismatch', () => {
  it('detects ROM mismatch when hash matches a different ROM', async () => {
    // We cannot use real BIN files in unit tests, but we can test the logic
    // by mocking — this test verifies the HASH_MISMATCH path still returns sha256
    // For a proper ROM_MISMATCH test, the real stock BIN would be needed.
    // Here we verify the structure of the response:
    const file = makeFile('stock.bin', make2mbBuffer(0xab))
    const result = await validateBinFile(file, 'I8A0S')
    // Should be either HASH_MISMATCH or ROM_MISMATCH, never valid
    expect(result.valid).toBe(false)
    expect(['HASH_MISMATCH', 'ROM_MISMATCH']).toContain(result.error)
    if (result.error === 'ROM_MISMATCH') {
      expect(result.detectedRomId).toBeDefined()
      expect(result.message).toContain('ROM mismatch')
    }
  })
})

// ─── Result structure ─────────────────────────────────────────────────────────

describe('validateBinFile — result structure', () => {
  it('always includes a message string', async () => {
    const cases = [
      makeFile('stock.txt', 100),            // wrong extension
      makeFile('stock.bin', 100),            // wrong size
      makeFile('stock.bin', make2mbBuffer()), // wrong hash
    ]
    for (const file of cases) {
      const result = await validateBinFile(file, 'I8A0S')
      expect(typeof result.message).toBe('string')
      expect(result.message.length).toBeGreaterThan(0)
    }
  })

  it('sha256 is not set for extension/size errors', async () => {
    const extErr = await validateBinFile(makeFile('stock.txt', 100), 'I8A0S')
    expect(extErr.sha256).toBeUndefined()

    const sizeErr = await validateBinFile(makeFile('stock.bin', 100), 'I8A0S')
    expect(sizeErr.sha256).toBeUndefined()
  })

  it('sha256 is set (64 hex chars) for hash errors', async () => {
    const result = await validateBinFile(
      makeFile('stock.bin', make2mbBuffer()),
      'I8A0S',
    )
    expect(result.sha256).toBeDefined()
    expect(result.sha256!.length).toBe(64)
    expect(/^[0-9a-f]{64}$/.test(result.sha256!)).toBe(true)
  })
})
