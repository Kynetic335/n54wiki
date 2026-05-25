import { tuneFiles } from '@/data/tune-program/tuneFiles'
import type { TuneFile, FuelType, StageId, TurboTypeId, RomVersion } from '@/types/tune-program'

/**
 * Registry accessor — single source of truth for all tune file lookups.
 * Wraps the static data file with filtering and validation utilities.
 */

export const registry = {
  /** All registered tune files */
  all(): TuneFile[] {
    return tuneFiles
  },

  /** Find by exact ID */
  byId(id: string): TuneFile | undefined {
    return tuneFiles.find((f) => f.id === id)
  },

  /** Find exact match for a complete selection */
  exactMatch(params: {
    romVersion: RomVersion
    fuel: FuelType
    stage: StageId
    turboType: TurboTypeId
  }): TuneFile | undefined {
    return tuneFiles.find(
      (f) =>
        f.romVersion === params.romVersion &&
        f.fuel === params.fuel &&
        f.stage === params.stage &&
        f.turboType === params.turboType
    )
  },

  /** Find all files matching a partial filter */
  filter(params: {
    romVersion?: RomVersion
    fuel?: FuelType
    stage?: StageId
    turboType?: TurboTypeId
    exportable?: boolean
    fileExists?: boolean
  }): TuneFile[] {
    return tuneFiles.filter((f) => {
      if (params.romVersion !== undefined && f.romVersion !== params.romVersion) return false
      if (params.fuel !== undefined && f.fuel !== params.fuel) return false
      if (params.stage !== undefined && f.stage !== params.stage) return false
      if (params.turboType !== undefined && f.turboType !== params.turboType) return false
      if (params.exportable !== undefined && f.exportable !== params.exportable) return false
      if (params.fileExists !== undefined && f.fileExists !== params.fileExists) return false
      return true
    })
  },

  /** All available ROM versions in the registry */
  availableRoms(): RomVersion[] {
    return [...new Set(tuneFiles.map((f) => f.romVersion))]
  },

  /** Available turbo types for a given ROM */
  availableTurboTypes(romVersion?: RomVersion): TurboTypeId[] {
    const filtered = romVersion ? tuneFiles.filter((f) => f.romVersion === romVersion) : tuneFiles
    return [...new Set(filtered.map((f) => f.turboType))]
  },

  /** Available fuels for a ROM + turbo combination */
  availableFuels(romVersion?: RomVersion, turboType?: TurboTypeId): FuelType[] {
    let filtered = tuneFiles
    if (romVersion) filtered = filtered.filter((f) => f.romVersion === romVersion)
    if (turboType) filtered = filtered.filter((f) => f.turboType === turboType)
    return [...new Set(filtered.map((f) => f.fuel))]
  },

  /** Available stages for a ROM + turbo + fuel combination */
  availableStages(
    romVersion?: RomVersion,
    turboType?: TurboTypeId,
    fuel?: FuelType
  ): StageId[] {
    let filtered = tuneFiles
    if (romVersion) filtered = filtered.filter((f) => f.romVersion === romVersion)
    if (turboType) filtered = filtered.filter((f) => f.turboType === turboType)
    if (fuel) filtered = filtered.filter((f) => f.fuel === fuel)
    return [...new Set(filtered.map((f) => f.stage))]
  },

  /** Count of files that are exportable (fileExists: true) */
  exportableCount(): number {
    return tuneFiles.filter((f) => f.exportable && f.fileExists).length
  },

  /** Count of placeholder files needing to be mapped */
  placeholderCount(): number {
    return tuneFiles.filter((f) => !f.fileExists).length
  },
}
