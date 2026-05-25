import type { CustomerRequest, ValidationResult } from '@/types/tune-program'
import { registry } from './tuneFileRegistry'

/**
 * Validate a customer request before allowing export approval.
 * Returns errors (blocking) and warnings (advisory).
 */
export function validateRequest(request: Partial<CustomerRequest>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // ── Required fields ─────────────────────────────────────────────────────────
  if (!request.name?.trim()) errors.push('Customer name is required.')
  if (!request.email?.trim()) errors.push('Customer email is required.')
  if (!request.vehicleYear?.trim()) errors.push('Vehicle year is required.')
  if (!request.vehicleModel?.trim()) errors.push('Vehicle model is required.')
  if (!request.transmission) errors.push('Transmission type is required.')
  if (!request.selectedFuel) errors.push('Fuel type must be selected.')
  if (!request.selectedStage) errors.push('Tune stage must be selected.')
  if (!request.selectedTurboType) errors.push('Turbo type must be selected.')
  if (!request.selectedTuneFileId?.trim()) errors.push('A tune file must be selected.')

  // ── Email format ────────────────────────────────────────────────────────────
  if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
    errors.push('Email address format is invalid.')
  }

  // ── Tune file exists in registry ────────────────────────────────────────────
  if (request.selectedTuneFileId) {
    const file = registry.byId(request.selectedTuneFileId)
    if (!file) {
      errors.push(`Tune file "${request.selectedTuneFileId}" is not in the registry.`)
    } else {
      if (!file.exportable) {
        errors.push(`Tune file "${file.displayName}" is not marked as exportable.`)
      }
      if (!file.fileExists) {
        warnings.push(
          `Tune file "${file.displayName}" is a placeholder — the actual BIN must be placed on the server before export.`
        )
      }
    }
  }

  // ── Safety blockers ─────────────────────────────────────────────────────────
  const knownIssues = request.knownIssues?.toLowerCase() ?? ''
  const blockingKeywords = [
    'misfire',
    'lean',
    'knock',
    'overheating',
    'overheated',
    'overheat',
    'slipping',
    'fault code',
    'active code',
    'p0300',
    'p0171',
    'p0172',
    '30ff',
    '2a82',
    '2a87',
  ]
  for (const keyword of blockingKeywords) {
    if (knownIssues.includes(keyword)) {
      warnings.push(
        `Customer reported "${keyword}" in known issues. Tuner review required before approving export.`
      )
    }
  }

  // ── Maintenance warnings ────────────────────────────────────────────────────
  if (!request.maintenanceCompleted?.includes('Spark plugs replaced')) {
    warnings.push('Spark plugs not confirmed replaced. Verify condition before high-power tune.')
  }
  if (!request.maintenanceCompleted?.includes('Boost leak test passed')) {
    warnings.push('Boost leak test not confirmed. Recommend passing test before flashing.')
  }
  if (!request.maintenanceCompleted?.includes('HPFP cam follower replaced') &&
      !request.maintenanceCompleted?.includes('HPFP cam follower inspected')) {
    warnings.push('HPFP cam follower status not confirmed. High-risk item — verify before Stage 2+.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate that a tune file selection is internally consistent.
 * (ROM + turbo type + fuel + stage must match a real registered file)
 */
export function validateSelection(params: {
  romVersion?: string
  turboType?: string
  fuel?: string
  stage?: string
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const { romVersion, turboType, fuel, stage } = params

  // Check that the combination exists
  const match = registry.filter({
    romVersion: romVersion as never,
    turboType: turboType as never,
    fuel: fuel as never,
    stage: stage as never,
  })

  if (romVersion && turboType && fuel && stage && match.length === 0) {
    errors.push(
      `No registered tune file found for: ROM=${romVersion}, Turbo=${turboType}, Fuel=${fuel}, Stage=${stage}. ` +
        'This combination may not be supported yet. Contact Synergy for availability.'
    )
  }

  // Hybrid turbo + non-hybrid-base stage
  if (turboType === 'hybrid' && stage !== 'hybrid-base') {
    errors.push(
      'Hybrid turbo setups must use the "Hybrid Turbo Base Tune" stage. Other stages are not supported for hybrid configurations.'
    )
  }

  // Single turbo check (not supported)
  const singleTurboKeywords = ['single turbo', 'single-turbo', 's55', 'garrett gt45']
  if (singleTurboKeywords.some((k) => (turboType ?? '').toLowerCase().includes(k))) {
    errors.push('Single turbo setups are not supported in this version of the Tune Program.')
  }

  // Port injection check
  if (fuel === 'port-injection' as never) {
    errors.push('Port injection tuning is not supported in this version.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
