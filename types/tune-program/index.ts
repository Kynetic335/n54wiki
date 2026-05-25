// ─── N54 Tune Program — Core Type Definitions ─────────────────────────────────
// Platform: BMW N54 (Twin Turbo)
// Supported: Stock turbo, Upgraded stock-frame, Hybrid turbo base tunes
// NOT SUPPORTED: Port injection, Single turbo, Custom revisions, Auto calibration

export type FuelType = '91' | '93' | '95' | 'ACN91' | 'CAD94' | 'E30' | 'E40' | 'E50'

/** 'active' = selectable in UI now. 'future' = source files detected, not yet available. */
export type FuelStatus = 'active' | 'future'

export type StageId =
  | 'stage1'
  | 'stage1plus'
  | 'stage2'
  | 'stage2plus'
  | 'stage3'
  | 'hybrid-base'

export type TurboTypeId = 'stock' | 'upgraded-stock-frame' | 'hybrid'

export type RomVersion = 'I8A0S' | 'IJE0S' | 'IKM0S' | 'INA0S' | 'UNKNOWN'

/** ROM families supported in the Tune Program selector */
export type RomFamilyId = 'I8A0S' | 'IJE0S' | 'IKM0S'

export type TransmissionType = 'MT' | 'AT' | 'Both'

export type RequestStatus =
  | 'New'
  | 'Waiting on Logs'
  | 'In Review'
  | 'Approved for Export'
  | 'Exported'
  | 'Complete'

export type AddonId = 'xhp-tcu' | 'flex-fuel' | 'upgraded-map-sensor' | 'hybrid-turbo-setup'

// ─── ROM Family Registry Entry ─────────────────────────────────────────────────
export interface RomFamily {
  /** ROM identifier — matches DME software version (e.g. I8A0S) */
  romId: RomFamilyId
  displayName: string
  description: string
  /** Common vehicles this ROM appears on */
  vehicleApplications: string[]
  /** Stages that have (or will have) source files for this ROM */
  supportedStages: StageId[]
  /**
   * Active fuels with confirmed source coverage for this ROM.
   * Does NOT include future fuels (95/ACN91/CAD94) — those are displayed separately.
   */
  supportedFuels: FuelType[]
  /**
   * true = stock originals, OTS BINs, and/or XDFs found in _private_tuning_sources/
   * for this ROM family during private inventory (2026-05-24).
   */
  hasPrivateSources: boolean
  /** Inventory/compatibility notes */
  notes: string
}

// ─── Tune File Registry Entry ──────────────────────────────────────────────────
export interface TuneFile {
  id: string
  displayName: string
  platform: 'N54'
  romVersion: RomVersion
  fuel: FuelType
  stage: StageId
  turboType: TurboTypeId
  transmissionCompatibility: TransmissionType
  /** Path relative to project root — NOT in public/ */
  protectedFilePath: string
  requiredMods: string[]
  recommendedMods: string[]
  maintenanceChecklist: string[]
  safetyNotes: string[]
  datalogRequirements: string[]
  locked: boolean
  exportable: boolean
  /** false = placeholder, file path must be mapped manually before export */
  fileExists: boolean
  notes?: string
}

// ─── Fuel Option ──────────────────────────────────────────────────────────────
export interface Fuel {
  id: FuelType
  label: string
  description: string
  color: string
  minOctane?: number
  ethanolPercent?: number
  /** 'active' = available now. 'future' = source files detected, coming soon. */
  status: FuelStatus
  /** Shown as a note under future fuels in the selector UI */
  statusNote?: string
}

// ─── Tune Stage ───────────────────────────────────────────────────────────────
export interface Stage {
  id: StageId
  label: string
  description: string
  turboCompatibility: TurboTypeId[]
  fuelCompatibility: FuelType[]
  requiredMods: string[]
  recommendedMods: string[]
}

// ─── Turbo Type ───────────────────────────────────────────────────────────────
export interface TurboType {
  id: TurboTypeId
  label: string
  description: string
  stageCompatibility: StageId[]
}

// ─── Add-on / Display Option ──────────────────────────────────────────────────
export interface Addon {
  id: AddonId
  label: string
  description: string
  /** true = info display only, not a tune file selector */
  displayOnly: boolean
}

// ─── Customer Request ─────────────────────────────────────────────────────────
export interface CustomerRequest {
  id: string
  createdAt: string
  status: RequestStatus
  // Customer info
  name: string
  email: string
  vehicleYear: string
  vehicleModel: string
  transmission: TransmissionType | ''
  romVersion: RomVersion | ''
  currentTune: string
  // Hardware setup
  turboSetup: string
  fuelSystem: string
  selectedFuel: FuelType | ''
  selectedStage: StageId | ''
  selectedTurboType: TurboTypeId | ''
  currentMods: string
  // Maintenance
  maintenanceCompleted: string[]
  sparkPlugType: string
  sparkPlugGap: string
  coilCondition: string
  hpfpDetails: string
  lpfpDetails: string
  injectorIndex: string
  // Goals & known issues
  goals: string
  knownIssues: string
  // Selected tune package
  selectedTuneFileId: string
  // Add-ons
  selectedAddons: AddonId[]
  // Admin fields
  tunerNotes: string
  exportedAt?: string
  packageHash?: string
}

// ─── Exported Package Format ──────────────────────────────────────────────────
// Format: .synergytune (JSON wrapper with AES-256-GCM encrypted content)
// WARNING: Client-side-only locking is not secure.
// Real protection requires server-side export/encryption.
export interface ExportPackage {
  format: 'synergytune-v1'
  timestamp: string
  customerEmail: string
  selection: {
    tuneFileId: string
    displayName: string
    rom: RomVersion
    fuel: FuelType
    stage: StageId
    turboType: TurboTypeId
  }
  customer: {
    name: string
    email: string
    vehicleYear: string
    vehicleModel: string
    transmission: TransmissionType | ''
  }
  metadata: {
    tuner: 'Synergy BMW Tuning'
    platform: 'N54'
    version: string
    exportedBy: string
    note: string
  }
  /** SHA-256 hex of the original file content before encryption */
  contentHash: string
  /** base64: salt(16) + authTag(16) + encryptedContent */
  encryptedContent: string
  /** base64: AES-GCM IV (12 bytes) */
  iv: string
}

// ─── Package Match Result ─────────────────────────────────────────────────────
export interface PackageMatch {
  tuneFile: TuneFile
  isExact: boolean
  missingFields: string[]
}

// ─── Validation Result ────────────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
