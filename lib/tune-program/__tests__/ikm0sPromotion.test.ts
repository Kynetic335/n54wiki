import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { patchPackageManifest } from '@/data/tune-program/patch-packages/manifest'
import { tuneFiles } from '@/data/tune-program/tuneFiles'
import { resolveGenerateBin } from '@/lib/tune-program/generateBinGate'
import { ROM_SIZE, validatePatchPackage } from '@/lib/tune-program/patchPackageValidator'
import type { AppSafePatchPackage } from '@/types/tune-program'

const ROOT = resolve(__dirname, '..', '..', '..')
const DATA_ROOT = join(ROOT, 'data', 'tune-program', 'patch-packages')
const PUBLIC_ROOT = join(ROOT, 'public', 'tune-program', 'patch-packages')
const UNKNOWN_EXCLUDE = 0x0470B2
const CALIBRATION_START = 0x040410

interface PublishedIkmPackage extends AppSafePatchPackage {
  sourceMapVersion: 'v90-source'
  ownerAccept: {
    xdfEvidencedRegions: number
    identChecksumExcluded: number
    unknownExcluded: number
    unknownExcludeOffsets: string[]
  }
}

function jsonFiles(dir: string): string[] {
  const files: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory() && name !== 'deprecated') files.push(...jsonFiles(full))
    else if (name.endsWith('.json') && name !== 'manifest.json') files.push(full)
  }
  return files
}

describe('IKM0S package promotion', () => {
  const entries = patchPackageManifest.filter((entry) => entry.romId === 'IKM0S')

  it('publishes exactly the 16 validated v90-source packages', () => {
    expect(entries).toHaveLength(16)
    expect(entries.every((entry) => entry.safeForApp)).toBe(true)
    expect(entries.every((entry) => entry.sourceMapVersion === 'v90-source')).toBe(true)
    expect(entries.reduce((sum, entry) => sum + entry.patchRegions, 0)).toBe(2227)

    for (const entry of entries) {
      const dataPath = join(DATA_ROOT, entry.filename)
      const publicPath = join(PUBLIC_ROOT, entry.filename)
      expect(existsSync(dataPath)).toBe(true)
      expect(existsSync(publicPath)).toBe(true)
      expect(readFileSync(publicPath, 'utf8')).toBe(readFileSync(dataPath, 'utf8'))
    }
  })

  it('keeps every published package app-safe and outside excluded ranges', () => {
    for (const entry of entries) {
      const text = readFileSync(join(PUBLIC_ROOT, entry.filename), 'utf8')
      const pkg = JSON.parse(text) as PublishedIkmPackage
      const validation = validatePatchPackage(pkg, {
        romId: entry.romId,
        stage: entry.stage,
        fuel: entry.fuel,
      })

      expect(validation).toEqual({ valid: true, errors: [] })
      expect(pkg.sourceMapVersion).toBe('v90-source')
      expect(pkg.outputMode).toBe('STANDARD_BIN_REVIEW_ONLY')
      expect(pkg.safeForAppPackage).toBe(true)
      expect(pkg.patchRegionCount).toBe(entry.patchRegions)
      expect(pkg.ownerAccept.xdfEvidencedRegions).toBe(pkg.patchRegionCount)
      expect(pkg.ownerAccept.identChecksumExcluded).toBe(0)
      expect(pkg.ownerAccept.unknownExcluded).toBe(1)
      expect(pkg.ownerAccept.unknownExcludeOffsets).toEqual(['0x0470B2'])
      expect(text).not.toMatch(/_private_tuning_sources|protected-tune-files|[A-Z]:\\Users\\/i)
      expect(text).not.toMatch(/\.bin\b|\.xdf\b/i)

      for (const region of pkg.patchRegions) {
        const end = region.offset + region.byteCount
        expect(region.offset).toBeGreaterThanOrEqual(CALIBRATION_START)
        expect(end).toBeLessThanOrEqual(ROM_SIZE)
        expect(region.offset <= UNKNOWN_EXCLUDE && UNKNOWN_EXCLUDE < end).toBe(false)
      }
    }
  })

  it('enables all published combinations and leaves the eight missing selections disabled', () => {
    for (const entry of entries) {
      const decision = resolveGenerateBin({
        romId: 'IKM0S',
        stage: entry.stage,
        fuel: entry.fuel,
        packageType: 'standard-ots',
      })
      expect(decision.enabled).toBe(true)
    }

    for (const stage of ['stage1', 'stage1+', 'stage2', 'stage3']) {
      for (const fuel of ['95', 'acn91']) {
        const decision = resolveGenerateBin({
          romId: 'IKM0S',
          stage,
          fuel,
          packageType: 'standard-ots',
        })
        expect(decision.enabled).toBe(false)
        if (!decision.enabled) expect(decision.reason).toBe('No matching package')
      }
    }
  })

  it('keeps manifest files and the tune registry aligned with published files', () => {
    const dataManifest = JSON.parse(
      readFileSync(join(DATA_ROOT, 'manifest.json'), 'utf8'),
    ) as { packages: Array<{ romId: string; sourceMapVersion: string }> }
    const publicManifest = JSON.parse(
      readFileSync(join(PUBLIC_ROOT, 'manifest.json'), 'utf8'),
    ) as { packages: Array<{ romId: string; sourceMapVersion: string }> }

    expect(publicManifest).toEqual(dataManifest)
    expect(dataManifest.packages).toHaveLength(jsonFiles(DATA_ROOT).length)
    expect(publicManifest.packages).toHaveLength(jsonFiles(PUBLIC_ROOT).length)
    expect(dataManifest.packages.filter((entry) => entry.romId === 'IKM0S')).toHaveLength(16)
    expect(
      dataManifest.packages
        .filter((entry) => entry.romId === 'IKM0S')
        .every((entry) => entry.sourceMapVersion === 'v90-source'),
    ).toBe(true)

    const ikmTuneFiles = tuneFiles.filter((file) => file.romVersion === 'IKM0S')
    expect(ikmTuneFiles).toHaveLength(16)
    expect(ikmTuneFiles.some((file) => file.stage === 'stage3' && file.fuel === '91')).toBe(true)
  })
})
