// ─── Package Gates Tests ───────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  getPackageGateStatus,
  isPackageAllowed,
  getRomGateStatus,
  listReadyPackagesForRom,
  listActivePackagesForRom,
} from '../packageGates'
import type { PatchPackageManifestEntry } from '../packageGates'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<PatchPackageManifestEntry>): PatchPackageManifestEntry {
  return {
    packageId:        'test-pkg-v2',
    romId:            'I8A0S',
    stage:            'stage2',
    fuel:             '93',
    patchRegions:     100,
    safeForApp:       true,
    filename:         'i8a0s/test-pkg-v2.json',
    packageType:      'standard-ots',
    sourceMapVersion: 'v12',
    ...overrides,
  }
}

// ─── getPackageGateStatus ─────────────────────────────────────────────────────

describe('getPackageGateStatus', () => {
  it('returns READY for a v12 safeForApp package', () => {
    expect(getPackageGateStatus(makeEntry({}))).toBe('READY')
  })

  it('returns NEEDS_AUDIT for safeForApp: false (v12)', () => {
    expect(getPackageGateStatus(makeEntry({ safeForApp: false }))).toBe('NEEDS_AUDIT')
  })

  it('returns DEPRECATED for v1-deprecated packages', () => {
    expect(
      getPackageGateStatus(makeEntry({ sourceMapVersion: 'v1-deprecated' })),
    ).toBe('DEPRECATED')
  })

  it('treats v1-deprecated safeForApp:false as DEPRECATED (not NEEDS_AUDIT)', () => {
    // deprecated takes precedence over NEEDS_AUDIT
    expect(
      getPackageGateStatus(makeEntry({ sourceMapVersion: 'v1-deprecated', safeForApp: false })),
    ).toBe('DEPRECATED')
  })
})

// ─── isPackageAllowed ─────────────────────────────────────────────────────────

describe('isPackageAllowed', () => {
  it('allows READY I8A0S package', () => {
    expect(isPackageAllowed(makeEntry({ romId: 'I8A0S', safeForApp: true }))).toBe(true)
  })

  it('allows READY INA0S package', () => {
    expect(isPackageAllowed(makeEntry({ romId: 'INA0S', safeForApp: true }))).toBe(true)
  })

  it('blocks NEEDS_AUDIT package (IJE0S)', () => {
    expect(
      isPackageAllowed(makeEntry({ romId: 'IJE0S', safeForApp: false })),
    ).toBe(false)
  })

  it('blocks DEPRECATED package', () => {
    expect(
      isPackageAllowed(makeEntry({ sourceMapVersion: 'v1-deprecated' })),
    ).toBe(false)
  })
})

// ─── getRomGateStatus ─────────────────────────────────────────────────────────

describe('getRomGateStatus', () => {
  it('returns READY for I8A0S', () => {
    expect(getRomGateStatus('I8A0S')).toBe('READY')
  })

  it('returns READY for INA0S', () => {
    expect(getRomGateStatus('INA0S')).toBe('READY')
  })

  it('returns NEEDS_AUDIT for IJE0S (all packages safeForApp: false)', () => {
    expect(getRomGateStatus('IJE0S')).toBe('NEEDS_AUDIT')
  })

  it('returns NOT_BUILT for IKM0S (no v12 manifest entries)', () => {
    expect(getRomGateStatus('IKM0S')).toBe('NOT_BUILT')
  })

  it('returns NOT_BUILT for an unknown ROM', () => {
    expect(getRomGateStatus('UNKNOWN_ROM')).toBe('NOT_BUILT')
  })
})

// ─── listReadyPackagesForRom ──────────────────────────────────────────────────

describe('listReadyPackagesForRom', () => {
  it('returns 13 READY packages for I8A0S', () => {
    const pkgs = listReadyPackagesForRom('I8A0S')
    expect(pkgs).toHaveLength(13)
    expect(pkgs.every((p) => p.safeForApp)).toBe(true)
    expect(pkgs.every((p) => p.romId === 'I8A0S')).toBe(true)
  })

  it('returns 13 READY packages for INA0S', () => {
    const pkgs = listReadyPackagesForRom('INA0S')
    expect(pkgs).toHaveLength(13)
    expect(pkgs.every((p) => p.safeForApp)).toBe(true)
  })

  it('returns 0 READY packages for IJE0S', () => {
    expect(listReadyPackagesForRom('IJE0S')).toHaveLength(0)
  })

  it('returns 0 packages for IKM0S', () => {
    expect(listReadyPackagesForRom('IKM0S')).toHaveLength(0)
  })
})

// ─── listActivePackagesForRom ─────────────────────────────────────────────────

describe('listActivePackagesForRom', () => {
  it('returns 13 active packages for IJE0S (NEEDS_AUDIT but not deprecated)', () => {
    const pkgs = listActivePackagesForRom('IJE0S')
    expect(pkgs).toHaveLength(13)
    expect(pkgs.every((p) => p.safeForApp === false)).toBe(true)
  })

  it('excludes deprecated packages from active list', () => {
    const all = listActivePackagesForRom('I8A0S')
    expect(all.every((p) => p.sourceMapVersion !== 'v1-deprecated')).toBe(true)
  })
})

// ─── No private paths exposed ─────────────────────────────────────────────────

describe('privacy scan — no private paths in package entries', () => {
  it('no package filename contains _private_tuning_sources', () => {
    const all = [
      ...listActivePackagesForRom('I8A0S'),
      ...listActivePackagesForRom('INA0S'),
      ...listActivePackagesForRom('IJE0S'),
    ]
    for (const pkg of all) {
      expect(pkg.filename).not.toContain('_private_tuning_sources')
      expect(pkg.filename).not.toContain('\\')  // no Windows paths
    }
  })
})
