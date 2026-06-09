// ─── ROM Unlock Checklist ──────────────────────────────────────────────────────
//
// Programmatic skeleton for the private-audit unlock pass (IJE0S, IKM0S).
//
// Produces a structured checklist for one ROM, combining:
//   - AUTO gates  — derivable from the public manifest + fingerprint registry
//                   (stock hash, manifest entries, structural validity, READY,
//                    Generate BIN enablement). These decide `appUnlocked`.
//   - MANUAL gates — the private XDF / stock-BIN audit steps that CANNOT be
//                   verified from public data alone. Always status 'manual';
//                   a human auditor ticks them off against private files.
//
// PURE + SERVER-SAFE:
//   - No node:fs, no crypto, no fetch, no DOM.
//   - Reads ONLY the public manifest and fingerprint registry.
//   - Touches NO private BIN / XDF / tune files.
//
// `appUnlocked` is decided ONLY by the AUTO gates — never by ROM name and never
// by a manual item. A ROM cannot become app-unlocked until its manifest entries
// are promoted to safeForApp:true, which only happens AFTER the private audit.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getRomGateStatus,
  listActivePackagesForRom,
  listReadyPackagesForRom,
  type RomGateStatus,
} from '@/lib/tune-program/packageGates'
import {
  resolveGenerateBin,
  validateManifestEntry,
  getStockHashForRom,
} from '@/lib/tune-program/generateBinGate'

export type ChecklistStatus = 'pass' | 'fail' | 'manual'

export interface ChecklistItem {
  id: string
  label: string
  status: ChecklistStatus
  detail: string
  /** true = needs private BIN/XDF audit; cannot be auto-verified from public data. */
  manual: boolean
}

export interface RomUnlockChecklist {
  romId: string
  romGate: RomGateStatus
  totalPackages: number
  readyPackages: number
  autoPassed: number
  autoFailed: number
  manualPending: number
  items: ChecklistItem[]
  /** True only when every AUTO gate passes. Manual items never flip this. */
  appUnlocked: boolean
}

// ─── Auto gate builders ─────────────────────────────────────────────────────

function buildAutoItems(romId: string): ChecklistItem[] {
  const items: ChecklistItem[] = []

  // 1. Stock hash registered for the ROM.
  const stockHash = getStockHashForRom(romId)
  items.push({
    id: 'stock-hash-registered',
    label: 'Stock SHA-256 registered in fingerprint registry',
    status: stockHash ? 'pass' : 'fail',
    detail: stockHash
      ? `Known stock hash present (${stockHash.slice(0, 12)}…).`
      : 'No known stock SHA-256 registered for this ROM.',
    manual: false,
  })

  // 2. Manifest entries exist (non-deprecated).
  const active = listActivePackagesForRom(romId)
  items.push({
    id: 'manifest-entries-exist',
    label: 'App-safe manifest entries exist',
    status: active.length > 0 ? 'pass' : 'fail',
    detail:
      active.length > 0
        ? `${active.length} non-deprecated manifest entr${active.length === 1 ? 'y' : 'ies'}.`
        : 'No manifest entries — packages not built yet (NOT_BUILT).',
    manual: false,
  })

  // 3. Every manifest entry is structurally valid.
  const structuralProblems = active.flatMap((e) =>
    validateManifestEntry(e).map((p) => `${e.packageId}: ${p}`),
  )
  items.push({
    id: 'manifest-entries-valid',
    label: 'All manifest entries structurally valid',
    status: active.length > 0 && structuralProblems.length === 0 ? 'pass' : 'fail',
    detail:
      active.length === 0
        ? 'No entries to validate.'
        : structuralProblems.length === 0
          ? 'All entries pass validateManifestEntry().'
          : structuralProblems.join('; '),
    manual: false,
  })

  // 4. At least one READY package.
  const ready = listReadyPackagesForRom(romId)
  items.push({
    id: 'ready-package-exists',
    label: 'At least one READY (safeForApp:true) package',
    status: ready.length > 0 ? 'pass' : 'fail',
    detail:
      ready.length > 0
        ? `${ready.length} READY package(s).`
        : 'No READY packages — all NEEDS_AUDIT or none built.',
    manual: false,
  })

  // 5. At least one selection enables Generate BIN.
  const anyEnabled = active.some(
    (e) =>
      resolveGenerateBin({
        romId: e.romId,
        stage: e.stage,
        fuel: e.fuel,
        packageType: e.packageType,
      }).enabled,
  )
  items.push({
    id: 'generate-bin-enabled',
    label: 'Generate BIN enabled for ≥1 selection',
    status: anyEnabled ? 'pass' : 'fail',
    detail: anyEnabled
      ? 'resolveGenerateBin() returns enabled for at least one package.'
      : 'No package currently enables Generate BIN.',
    manual: false,
  })

  return items
}

// ─── Manual gate builders ───────────────────────────────────────────────────
//
// These mirror the private-audit checklist in docs/tune-app/rom-unlock-workflow.md.
// They can NEVER auto-pass from public data — a human verifies them against the
// private stock BIN + XDF and then promotes the manifest entries.

const MANUAL_ITEMS: ReadonlyArray<Omit<ChecklistItem, 'status' | 'manual'>> = [
  {
    id: 'xdf-coverage-verified',
    label: 'XDF coverage verified for every patch region',
    detail: 'Confirm each patched offset maps to a known XDF parameter (no unaudited blocks).',
  },
  {
    id: 'offsets-verified-against-stock-bin',
    label: 'Every patch offset verified against the real stock BIN',
    detail: 'Each offset lands inside calibration space (≥0x040410) on the genuine stock BIN.',
  },
  {
    id: 'expected-stock-hex-matches',
    label: 'expectedStockHex matches the real stock bytes',
    detail: 'Dry-run each region against the stock BIN — 0 stock-byte mismatches.',
  },
  {
    id: 'replacement-hex-correct',
    label: 'replacementHex is the correct tuned value',
    detail: 'Confirm replacement bytes against the validated private tuned package.',
  },
  {
    id: 'no-overlapping-ranges-in-source',
    label: 'No overlapping write ranges in the re-exported package',
    detail: 'validatePatchPackage() reports 0 overlapping regions on the exported JSON.',
  },
  {
    id: 'needs-full-xdf-audit-cleared',
    label: 'NEEDS_FULL_XDF_AUDIT removed after private audit passes',
    detail: 'Only after all of the above pass: set safeForAppPackage:true and re-export.',
  },
]

function buildManualItems(): ChecklistItem[] {
  return MANUAL_ITEMS.map((m) => ({ ...m, status: 'manual', manual: true }))
}

// ─── Main builder ───────────────────────────────────────────────────────────

/**
 * Build the full unlock checklist for one ROM.
 * AUTO items decide `appUnlocked`; MANUAL items track the private audit steps.
 */
export function buildRomUnlockChecklist(romId: string): RomUnlockChecklist {
  const autoItems = buildAutoItems(romId)
  const manualItems = buildManualItems()
  const items = [...autoItems, ...manualItems]

  const autoPassed = autoItems.filter((i) => i.status === 'pass').length
  const autoFailed = autoItems.filter((i) => i.status === 'fail').length

  return {
    romId,
    romGate: getRomGateStatus(romId),
    totalPackages: listActivePackagesForRom(romId).length,
    readyPackages: listReadyPackagesForRom(romId).length,
    autoPassed,
    autoFailed,
    manualPending: manualItems.length,
    items,
    // App is unlocked only when no AUTO gate fails (and at least one passed,
    // which is implied — a ROM with zero entries fails the entry gates).
    appUnlocked: autoFailed === 0,
  }
}

/** Build checklists for several ROMs at once. */
export function buildUnlockChecklists(romIds: string[]): RomUnlockChecklist[] {
  return romIds.map(buildRomUnlockChecklist)
}
