// ─── Audit Report Tests ────────────────────────────────────────────────────────
//
// Runs the full package audit against real on-disk patch JSON and manifest.
// Proves the audit table is accurate for all 4 ROMs.
// This is the authoritative test for Task 3 (audit reporting).
//
import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import {
  auditAllPackages,
  auditPackage,
  summarizeAudit,
  formatAuditTable,
  DATA_PACKAGE_ROOT,
} from '../auditPackages'
import { patchPackageManifest } from '@/data/tune-program/patch-packages/manifest'

const REPO_ROOT = resolve(__dirname, '..', '..', '..') // n54wiki-main/n54wiki-main

// ─── Full audit run ────────────────────────────────────────────────────────────

describe('auditAllPackages — full manifest', () => {
  const rows = auditAllPackages(REPO_ROOT, DATA_PACKAGE_ROOT)

  it('audits every manifest entry', () => {
    expect(rows.length).toBe(patchPackageManifest.length)
  })

  it('all patch files are found on disk', () => {
    const missing = rows.filter((r) => !r.patchFileFound)
    expect(missing.map((r) => r.packageId)).toEqual([])
  })

  it('all ROMs have stock hashes registered', () => {
    const missingHash = rows.filter((r) => !r.stockHashFound)
    expect(missingHash.map((r) => r.romId)).toEqual([])
  })
})

// ─── I8A0S + INA0S — READY ────────────────────────────────────────────────────

describe('I8A0S + INA0S packages all READY and enabled', () => {
  const rows = auditAllPackages(REPO_ROOT, DATA_PACKAGE_ROOT)

  it('I8A0S: all 13 packages manifest READY', () => {
    const i8 = rows.filter((r) => r.romId === 'I8A0S')
    expect(i8).toHaveLength(13)
    expect(i8.every((r) => r.manifestStatus === 'READY')).toBe(true)
  })

  it('I8A0S: all 13 packages pass validator', () => {
    const i8 = rows.filter((r) => r.romId === 'I8A0S')
    const failing = i8.filter((r) => !r.validatorPass)
    expect(failing.map((r) => `${r.packageId}: ${r.validatorErrors.join('; ')}`)).toEqual([])
  })

  it('I8A0S: all 13 Generate BIN enabled', () => {
    const i8 = rows.filter((r) => r.romId === 'I8A0S')
    expect(i8.every((r) => r.generateBinEnabled)).toBe(true)
  })

  it('INA0S: all 13 packages READY + enabled', () => {
    const ina = rows.filter((r) => r.romId === 'INA0S')
    expect(ina).toHaveLength(13)
    expect(ina.every((r) => r.manifestStatus === 'READY')).toBe(true)
    expect(ina.every((r) => r.generateBinEnabled)).toBe(true)
  })
})

// ─── IJE0S audit ──────────────────────────────────────────────────────────────

describe('IJE0S audit — READY after OWNER_ACCEPT promotion (2026-06-08)', () => {
  const rows = auditAllPackages(REPO_ROOT, DATA_PACKAGE_ROOT)
  const ijeRows = rows.filter((r) => r.romId === 'IJE0S')

  it('audits all 13 IJE0S manifest entries', () => {
    expect(ijeRows).toHaveLength(13)
  })

  it('all IJE0S patch files are found on disk', () => {
    expect(ijeRows.every((r) => r.patchFileFound)).toBe(true)
  })

  it('IJE0S has a registered stock hash', () => {
    expect(ijeRows.every((r) => r.stockHashFound)).toBe(true)
  })

  it('IJE0S manifest status is READY for all 13 (safeForApp:true in exported JSON)', () => {
    expect(ijeRows.every((r) => r.manifestStatus === 'READY')).toBe(true)
  })

  it('IJE0S validator passes — 14 IDENT + 2 CHECKSUM stripped, safeForAppPackage:true', () => {
    const failing = ijeRows.filter((r) => !r.validatorPass)
    expect(failing.map((r) => `${r.packageId}: ${r.validatorErrors.join('; ')}`)).toEqual([])
  })

  it('IJE0S Generate BIN enabled for all 13', () => {
    expect(ijeRows.every((r) => r.generateBinEnabled)).toBe(true)
  })

  it('IJE0S output size invariant passes (regions stay within ROM bounds)', () => {
    expect(ijeRows.every((r) => r.outputSizeOk)).toBe(true)
  })
})

// ─── IKM0S ────────────────────────────────────────────────────────────────────

describe('IKM0S — built 2026-06-09 (v90 OTS)', () => {
  it('16 IKM0S entries in manifest, all enabled', () => {
    const rows = auditAllPackages(REPO_ROOT, DATA_PACKAGE_ROOT)
    const ikm = rows.filter((r) => r.romId === 'IKM0S')
    expect(ikm).toHaveLength(16)
    expect(ikm.every((r) => r.generateBinEnabled)).toBe(true)
  })
})

// ─── Audit summary ────────────────────────────────────────────────────────────

describe('summarizeAudit', () => {
  it('produces correct totals', () => {
    const rows = auditAllPackages(REPO_ROOT, DATA_PACKAGE_ROOT)
    const s = summarizeAudit(rows)
    // 13 I8A0S + 13 INA0S + 13 IJE0S + 16 IKM0S (v90 OTS) = 55 enabled; 0 disabled
    expect(s.readyEnabled).toBe(55)
    expect(s.disabled).toBe(0)
    expect(s.total).toBe(55)
    expect(s.byRom['IJE0S'].enabled).toBe(13)
    expect(s.byRom['IJE0S'].disabled).toBe(0)
    expect(s.byRom['IKM0S'].enabled).toBe(16)
    expect(s.byRom['IKM0S'].disabled).toBe(0)
  })
})

// ─── Audit table formatting ────────────────────────────────────────────────────

describe('formatAuditTable', () => {
  it('produces a non-empty table string', () => {
    const rows = auditAllPackages(REPO_ROOT, DATA_PACKAGE_ROOT)
    const table = formatAuditTable(rows)
    expect(table).toContain('ROM')
    expect(table).toContain('I8A0S')
    expect(table).toContain('IJE0S')
    expect(table).toContain('READY')
  })
})
