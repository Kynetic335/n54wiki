import { registry } from './tuneFileRegistry'
import type {
  TuneFile,
  FuelType,
  StageId,
  TurboTypeId,
  RomVersion,
  PackageMatch,
} from '@/types/tune-program'

export interface MatchQuery {
  romVersion?: RomVersion
  fuel?: FuelType
  stage?: StageId
  turboType?: TurboTypeId
}

/**
 * Find the best tune file for a given selection.
 * Returns exact match if available, otherwise near-matches with field diff.
 */
export function matchPackage(query: MatchQuery): PackageMatch[] {
  const results: PackageMatch[] = []

  // Try exact match first
  if (query.romVersion && query.fuel && query.stage && query.turboType) {
    const exact = registry.exactMatch({
      romVersion: query.romVersion,
      fuel: query.fuel,
      stage: query.stage,
      turboType: query.turboType,
    })
    if (exact) {
      return [{ tuneFile: exact, isExact: true, missingFields: [] }]
    }
  }

  // Partial match — find files that match the provided fields
  const candidates = registry.filter({
    romVersion: query.romVersion,
    turboType: query.turboType,
    fuel: query.fuel,
    stage: query.stage,
  })

  for (const file of candidates) {
    const missingFields: string[] = []
    if (!query.romVersion) missingFields.push('ROM version')
    if (!query.fuel) missingFields.push('Fuel type')
    if (!query.stage) missingFields.push('Stage')
    if (!query.turboType) missingFields.push('Turbo type')
    results.push({ tuneFile: file, isExact: false, missingFields })
  }

  return results
}

/**
 * Check if a specific file is compatible with the customer's stated setup.
 * Returns an array of compatibility warnings (empty = all good).
 */
export function checkCompatibility(
  file: TuneFile,
  customerRom: RomVersion | '',
  customerTransmission: string
): string[] {
  const warnings: string[] = []

  if (customerRom && customerRom !== 'UNKNOWN' && file.romVersion !== customerRom) {
    warnings.push(
      `ROM mismatch: you reported ${customerRom} but this file targets ${file.romVersion}. Confirm your ROM version in ISTA or MHD before flashing.`
    )
  }

  if (
    customerTransmission === 'AT' &&
    file.transmissionCompatibility === 'MT'
  ) {
    warnings.push(
      `This file is intended for manual transmission (MT) vehicles. Your transmission is AT. Using an MT file on an AT car may cause torque limit issues.`
    )
  }

  if (
    customerTransmission === 'MT' &&
    file.transmissionCompatibility === 'AT'
  ) {
    warnings.push(
      `This file is tuned for automatic transmission (AT). Confirm this matches your gearbox.`
    )
  }

  if (!file.exportable) {
    warnings.push('This file is marked as not exportable. Contact Synergy before proceeding.')
  }

  if (!file.fileExists) {
    warnings.push(
      'This tune file is a placeholder — the actual BIN has not been mapped to the server yet. Export is not available until the file is registered.'
    )
  }

  return warnings
}

/**
 * Returns all exportable (fileExists: true) files for a selection.
 * Used to confirm what can actually be exported vs. placeholder entries.
 */
export function getExportableFiles(query: MatchQuery): TuneFile[] {
  return registry
    .filter({
      romVersion: query.romVersion,
      fuel: query.fuel,
      stage: query.stage,
      turboType: query.turboType,
      fileExists: true,
      exportable: true,
    })
}
