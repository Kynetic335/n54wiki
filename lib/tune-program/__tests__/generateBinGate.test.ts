// ─── Generate BIN Gate Tests ──────────────────────────────────────────────────
//
// Verifies the data-driven enable/disable decision. The key contract:
//   ROMs are NEVER locked by name — only by package data (READY + valid + hash).
//
import { describe, it, expect } from 'vitest'
import {
  resolveGenerateBin,
  getStockHashForRom,
  validateManifestEntry,
} from '../generateBinGate'
import type { GenerateBinSelection } from '../generateBinGate'
import { getPackageByFilter } from '@/data/tune-program/patch-packages/manifest'

const std = (over: Partial<GenerateBinSelection>): GenerateBinSelection => ({
  romId: 'I8A0S',
  stage: 'stage2',
  fuel: '91',
  packageType: 'standard-ots',
  ...over,
})

// ─── READY valid package enables Generate BIN ─────────────────────────────────

describe('resolveGenerateBin — READY enables', () => {
  it('enables a READY valid I8A0S standard-ots package', () => {
    const d = resolveGenerateBin(std({}))
    expect(d.enabled).toBe(true)
    if (d.enabled) {
      expect(d.manifestEntry.romId).toBe('I8A0S')
      expect(d.stockSha256).toMatch(/^[0-9a-f]{64}$/)
      expect(d.patchPackagePath).toBe('/tune-program/patch-packages/i8a0s/i8a0s-stage2-91-v2.json')
    }
  })

  // ── ROMs are NOT hardcoded-locked by name ──────────────────────────────────
  it('enables INA0S when its selected package is READY + valid (not locked by name)', () => {
    const d = resolveGenerateBin(std({ romId: 'INA0S' }))
    expect(d.enabled).toBe(true)
  })

  it('enables INA0S N20 MAP hybrid-base (READY)', () => {
    const d = resolveGenerateBin({ romId: 'INA0S', stage: 'hybrid-base', fuel: 'e50', packageType: 'n20-map' })
    expect(d.enabled).toBe(true)
  })
})

// ─── Disabled cases ───────────────────────────────────────────────────────────

describe('resolveGenerateBin — disabled reasons', () => {
  it('IJE0S is ENABLED after OWNER_ACCEPT promotion (2026-06-08), decided by data not name', () => {
    // IJE0S package EXISTS in the manifest and is now READY (safeForApp:true).
    expect(getPackageByFilter({ romId: 'IJE0S', stage: 'stage2', fuel: '91', packageType: 'standard-ots' }))
      .toBeDefined()
    const d = resolveGenerateBin(std({ romId: 'IJE0S' }))
    expect(d.enabled).toBe(true)
  })

  it('IKM0S enabled for a built combo (stage2/91 — v90 OTS, 2026-06-09)', () => {
    const d = resolveGenerateBin(std({ romId: 'IKM0S' }))
    expect(d.enabled).toBe(true)
    if (d.enabled) {
      expect(d.manifestEntry.romId).toBe('IKM0S')
      expect(d.patchPackagePath).toBe('/tune-program/patch-packages/ikm0s/ikm0s-stage2-91-v90.json')
    }
  })

  it('IKM0S unbuilt fuel (95 — future) stays disabled (No matching package)', () => {
    const d = resolveGenerateBin(std({ romId: 'IKM0S', fuel: '95' }))
    expect(d.enabled).toBe(false)
    if (!d.enabled) expect(d.reason).toBe('No matching package')
  })

  it('missing package disables (I8A0S stage1 basic — never built)', () => {
    const d = resolveGenerateBin(std({ stage: 'stage1' }))
    expect(d.enabled).toBe(false)
    if (!d.enabled) expect(d.reason).toBe('No matching package')
  })

  it('incomplete selection → Unsupported selection', () => {
    const d = resolveGenerateBin(std({ fuel: '' }))
    expect(d.enabled).toBe(false)
    if (!d.enabled) expect(d.reason).toBe('Unsupported selection')
  })

  it('mismatched packageType disables (standard-ots stage requested as n20-map)', () => {
    const d = resolveGenerateBin(std({ stage: 'stage1+', packageType: 'n20-map' }))
    expect(d.enabled).toBe(false)
    if (!d.enabled) expect(d.reason).toBe('No matching package')
  })
})

// ─── getStockHashForRom ───────────────────────────────────────────────────────

describe('getStockHashForRom', () => {
  it('returns a 64-char hash for each supported ROM', () => {
    for (const rom of ['I8A0S', 'IJE0S', 'IKM0S', 'INA0S']) {
      expect(getStockHashForRom(rom)).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('returns undefined for an unknown ROM (missing stock hash)', () => {
    expect(getStockHashForRom('ZZZ0S')).toBeUndefined()
  })
})

// ─── validateManifestEntry ────────────────────────────────────────────────────

describe('validateManifestEntry', () => {
  it('passes a well-formed entry', () => {
    const entry = getPackageByFilter({ romId: 'I8A0S', stage: 'stage2', fuel: '91', packageType: 'standard-ots' })!
    expect(validateManifestEntry(entry)).toEqual([])
  })

  it('flags a filename outside the ROM directory', () => {
    const entry = getPackageByFilter({ romId: 'I8A0S', stage: 'stage2', fuel: '91', packageType: 'standard-ots' })!
    const problems = validateManifestEntry({ ...entry, filename: 'ina0s/i8a0s-stage2-91-v2.json' })
    expect(problems.some((p) => p.includes('not under'))).toBe(true)
  })

  it('flags a private/absolute filename', () => {
    const entry = getPackageByFilter({ romId: 'I8A0S', stage: 'stage2', fuel: '91', packageType: 'standard-ots' })!
    const problems = validateManifestEntry({ ...entry, filename: 'i8a0s\\_private_tuning_sources\\x.json' })
    expect(problems.some((p) => p.includes('private/absolute'))).toBe(true)
  })
})
