// ─── Patch Package Audit ──────────────────────────────────────────────────────
//
// Node/test-only auditor. Walks the patch-package manifest, loads each exported
// app-safe JSON from disk, and reports the full Generate BIN readiness picture
// for every ROM / stage / fuel / turbo package.
//
// NEVER import this from client code — it uses node:fs. It exists to produce an
// honest audit table for tests and the `tune:audit` script. It does not modify
// any package; it only reports what the manifest + validator say.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import {
  patchPackageManifest,
  type PatchPackageManifestEntry,
} from '@/data/tune-program/patch-packages/manifest'
import { getPackageGateStatus } from '@/lib/tune-program/packageGates'
import { validatePatchPackage, ROM_SIZE } from '@/lib/tune-program/patchPackageValidator'
import { resolveGenerateBin, getStockHashForRom } from '@/lib/tune-program/generateBinGate'
import type { AppSafePatchPackage } from '@/types/tune-program'

export { ROM_SIZE }

// ─── Row shape ────────────────────────────────────────────────────────────────

export interface PackageAuditRow {
  romId: string
  stage: string
  fuel: string
  turboType: string
  packageType: 'standard-ots' | 'n20-map'
  packageId: string
  manifestStatus: ReturnType<typeof getPackageGateStatus>
  patchFileFound: boolean
  stockHashFound: boolean
  outputSizeOk: boolean
  validatorPass: boolean
  validatorErrors: string[]
  generateBinEnabled: boolean
  disabledReason?: string
}

// ─── Turbo type derivation ────────────────────────────────────────────────────

function deriveTurboType(entry: PatchPackageManifestEntry): string {
  if (entry.packageType === 'standard-ots') return 'stock'
  if (entry.stage === 'hybrid-base') return 'hybrid'
  return 'stock-turbo-n20-map'
}

// ─── Default patch-package roots ──────────────────────────────────────────────

/** Repo-root-relative roots that hold the exported app-safe patch JSON. */
export const DATA_PACKAGE_ROOT = join('data', 'tune-program', 'patch-packages')
export const PUBLIC_PACKAGE_ROOT = join('public', 'tune-program', 'patch-packages')

// ─── Core auditor ─────────────────────────────────────────────────────────────

/**
 * Audit one manifest entry against the patch JSON on disk.
 *
 * @param entry      manifest entry
 * @param repoRoot   absolute path to the repo root (n54wiki-main/n54wiki-main)
 * @param packageRoot relative dir holding the JSON (data or public root)
 */
export function auditPackage(
  entry: PatchPackageManifestEntry,
  repoRoot: string,
  packageRoot: string = DATA_PACKAGE_ROOT,
): PackageAuditRow {
  const turboType = deriveTurboType(entry)
  const manifestStatus = getPackageGateStatus(entry)
  const stockHash = getStockHashForRom(entry.romId)
  const stockHashFound = !!stockHash

  const filePath = join(repoRoot, packageRoot, entry.filename)
  const patchFileFound = existsSync(filePath)

  let validatorPass = false
  let validatorErrors: string[] = []
  let outputSizeOk = false

  if (!patchFileFound) {
    validatorErrors = [`patch JSON not found at ${packageRoot}/${entry.filename}`]
  } else {
    let pkg: AppSafePatchPackage | null = null
    try {
      pkg = JSON.parse(readFileSync(filePath, 'utf8')) as AppSafePatchPackage
    } catch (err) {
      validatorErrors = [`patch JSON unparseable: ${err instanceof Error ? err.message : String(err)}`]
    }
    if (pkg) {
      const outcome = validatePatchPackage(pkg, {
        romId: entry.romId,
        stage: entry.stage,
        fuel: entry.fuel,
      })
      validatorPass = outcome.valid
      validatorErrors = outcome.errors
      // Output-size invariant: the highest write end must stay within the 2 MB ROM.
      const maxEnd = Array.isArray(pkg.patchRegions)
        ? pkg.patchRegions.reduce((m, r) => Math.max(m, (r.offset ?? 0) + (r.byteCount ?? 0)), 0)
        : 0
      outputSizeOk = maxEnd <= ROM_SIZE
    }
  }

  const decision = resolveGenerateBin({
    romId: entry.romId,
    stage: entry.stage,
    fuel: entry.fuel,
    packageType: entry.packageType,
  })

  return {
    romId: entry.romId,
    stage: entry.stage,
    fuel: entry.fuel,
    turboType,
    packageType: entry.packageType,
    packageId: entry.packageId,
    manifestStatus,
    patchFileFound,
    stockHashFound,
    outputSizeOk,
    validatorPass,
    validatorErrors,
    generateBinEnabled: decision.enabled,
    disabledReason: decision.enabled ? undefined : `${decision.reason}: ${decision.detail}`,
  }
}

/** Audit every package in the manifest. */
export function auditAllPackages(
  repoRoot: string,
  packageRoot: string = DATA_PACKAGE_ROOT,
): PackageAuditRow[] {
  return patchPackageManifest.map((e) => auditPackage(e, repoRoot, packageRoot))
}

// ─── Reporting ────────────────────────────────────────────────────────────────

export interface AuditSummary {
  total: number
  readyEnabled: number
  disabled: number
  byRom: Record<string, { total: number; enabled: number; disabled: number }>
}

export function summarizeAudit(rows: PackageAuditRow[]): AuditSummary {
  const byRom: AuditSummary['byRom'] = {}
  let readyEnabled = 0
  let disabled = 0
  for (const r of rows) {
    byRom[r.romId] ??= { total: 0, enabled: 0, disabled: 0 }
    byRom[r.romId].total++
    if (r.generateBinEnabled) {
      readyEnabled++
      byRom[r.romId].enabled++
    } else {
      disabled++
      byRom[r.romId].disabled++
    }
  }
  return { total: rows.length, readyEnabled, disabled, byRom }
}

/** Human-readable audit table for console / CI output. */
export function formatAuditTable(rows: PackageAuditRow[]): string {
  const lines: string[] = []
  lines.push(
    [
      'ROM'.padEnd(6),
      'STAGE'.padEnd(11),
      'FUEL'.padEnd(5),
      'TURBO'.padEnd(20),
      'STATUS'.padEnd(11),
      'PATCH'.padEnd(6),
      'HASH'.padEnd(5),
      'VALID'.padEnd(6),
      'GEN'.padEnd(4),
      'REASON',
    ].join(' '),
  )
  for (const r of rows) {
    lines.push(
      [
        r.romId.padEnd(6),
        r.stage.padEnd(11),
        r.fuel.padEnd(5),
        r.turboType.padEnd(20),
        r.manifestStatus.padEnd(11),
        (r.patchFileFound ? 'yes' : 'NO').padEnd(6),
        (r.stockHashFound ? 'yes' : 'NO').padEnd(5),
        (r.validatorPass ? 'pass' : 'FAIL').padEnd(6),
        (r.generateBinEnabled ? 'ON' : 'off').padEnd(4),
        r.disabledReason ?? '',
      ].join(' '),
    )
  }
  return lines.join('\n')
}
