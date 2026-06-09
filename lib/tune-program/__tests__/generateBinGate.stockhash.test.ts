// ─── Generate BIN Gate — Missing Stock Hash path ──────────────────────────────
//
// Isolated test: a READY + valid package whose ROM has NO registered stock hash
// must disable Generate BIN with reason 'Missing stock hash'. We mock the
// fingerprint registry so getStockHashForRom() returns undefined while the
// manifest still reports a READY package.
//
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/data/tune-program/binFingerprints', () => ({
  // No known stock hash for any ROM in this isolated module.
  getFingerprintByRomId: () => undefined,
}))

import { resolveGenerateBin } from '../generateBinGate'

describe('resolveGenerateBin — Missing stock hash', () => {
  it('disables a READY package when no stock hash is registered for the ROM', () => {
    // I8A0S/stage2/91 is READY + valid in the manifest, but the mocked
    // fingerprint registry yields no hash.
    const d = resolveGenerateBin({ romId: 'I8A0S', stage: 'stage2', fuel: '91', packageType: 'standard-ots' })
    expect(d.enabled).toBe(false)
    if (!d.enabled) expect(d.reason).toBe('Missing stock hash')
  })
})
