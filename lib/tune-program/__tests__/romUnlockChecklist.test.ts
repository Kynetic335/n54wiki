// ─── ROM Unlock Checklist Tests ────────────────────────────────────────────────
//
// Guards the unlock-audit skeleton used for the IJE0S / IKM0S unlock pass.
// Pure: reads only the public manifest + fingerprint registry. No fs, no private
// files. Locks in the current honest state:
//   - I8A0S / INA0S: app-unlocked (all AUTO gates pass)
//   - IJE0S:         READY, app-unlocked (OWNER_ACCEPT promotion 2026-06-08)
//   - IKM0S:         READY, app-unlocked (v90 OTS build 2026-06-09, 16 packages)
//   - manual audit items always 'manual' and never flip appUnlocked
//
import { describe, it, expect } from 'vitest'
import { buildRomUnlockChecklist, buildUnlockChecklists } from '../romUnlockChecklist'

describe('buildRomUnlockChecklist — READY ROMs', () => {
  for (const romId of ['I8A0S', 'INA0S', 'IJE0S', 'IKM0S']) {
    it(`${romId}: app-unlocked with all AUTO gates passing`, () => {
      const cl = buildRomUnlockChecklist(romId)
      expect(cl.romGate).toBe('READY')
      expect(cl.appUnlocked).toBe(true)
      expect(cl.autoFailed).toBe(0)
      expect(cl.readyPackages).toBeGreaterThan(0)
    })
  }
})

describe('buildRomUnlockChecklist — IJE0S (READY after OWNER_ACCEPT promotion)', () => {
  const cl = buildRomUnlockChecklist('IJE0S')

  it('has 13 manifest entries, all READY', () => {
    expect(cl.totalPackages).toBe(13)
    expect(cl.readyPackages).toBe(13)
  })

  it('ROM gate is READY and app IS unlocked', () => {
    expect(cl.romGate).toBe('READY')
    expect(cl.appUnlocked).toBe(true)
  })

  it('stock hash is registered', () => {
    const item = cl.items.find((i) => i.id === 'stock-hash-registered')
    expect(item?.status).toBe('pass')
  })

  it('READY-package and generate-bin gates pass', () => {
    expect(cl.items.find((i) => i.id === 'ready-package-exists')?.status).toBe('pass')
    expect(cl.items.find((i) => i.id === 'generate-bin-enabled')?.status).toBe('pass')
  })
})

describe('buildRomUnlockChecklist — IKM0S (READY after v90 OTS build 2026-06-09)', () => {
  const cl = buildRomUnlockChecklist('IKM0S')

  it('has 16 manifest entries, all READY, and IS app-unlocked', () => {
    expect(cl.totalPackages).toBe(16)
    expect(cl.readyPackages).toBe(16)
    expect(cl.romGate).toBe('READY')
    expect(cl.appUnlocked).toBe(true)
  })

  it('stock hash registered and manifest entries exist', () => {
    expect(cl.items.find((i) => i.id === 'stock-hash-registered')?.status).toBe('pass')
    expect(cl.items.find((i) => i.id === 'manifest-entries-exist')?.status).toBe('pass')
  })
})

describe('manual audit items', () => {
  it('every ROM exposes the same 6 manual private-audit items', () => {
    for (const romId of ['I8A0S', 'IJE0S', 'IKM0S', 'INA0S']) {
      const manual = buildRomUnlockChecklist(romId).items.filter((i) => i.manual)
      expect(manual).toHaveLength(6)
      expect(manual.every((i) => i.status === 'manual')).toBe(true)
    }
  })

  it('manual items never flip appUnlocked (READY ROMs stay unlocked despite manual pending)', () => {
    const cl = buildRomUnlockChecklist('I8A0S')
    expect(cl.manualPending).toBe(6)
    expect(cl.appUnlocked).toBe(true)
  })
})

describe('buildUnlockChecklists', () => {
  it('builds checklists for the unlock-pass ROMs in order', () => {
    const list = buildUnlockChecklists(['IJE0S', 'IKM0S'])
    expect(list.map((c) => c.romId)).toEqual(['IJE0S', 'IKM0S'])
    // IJE0S promoted (unlocked); IKM0S built v90 OTS 2026-06-09 (unlocked).
    expect(list.find((c) => c.romId === 'IJE0S')?.appUnlocked).toBe(true)
    expect(list.find((c) => c.romId === 'IKM0S')?.appUnlocked).toBe(true)
  })
})
