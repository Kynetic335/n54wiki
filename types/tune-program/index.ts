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
  | 'stage3'
  | 'hybrid-base'

export type TurboTypeId = 'stock' | 'upgraded-stock-frame' | 'hybrid'

export type RomVersion = 'I8A0S' | 'IJE0S' | 'IKM0S' | 'INA0S' | 'UNKNOWN'

/** ROM families supported in the Tune Program selector */
export type RomFamilyId = 'I8A0S' | 'IJE0S' | 'IKM0S' | 'INA0S'

export type TransmissionType = 'MT' | 'AT' | 'Both'

export type RequestStatus =
  | 'New'
  | 'Waiting on BIN'
  | 'Waiting on Logs'
  | 'In Review'
  | 'Approved for Owner Review'
  | 'Exported'
  | 'Complete'
  | 'Blocked'

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

// ═══════════════════════════════════════════════════════════════════════════════
// Patch Package Types — App-Safe V1
// Source: data/tune-program/patch-packages/ (public, generated by exporter)
// Origin: _private_tuning_sources/reports/validated-packages/ (private)
// ═══════════════════════════════════════════════════════════════════════════════

/** Output mode — all exported packages are review-only until owner approves */
export type PatchOutputMode = 'STANDARD_BIN_REVIEW_ONLY'

/** One patch region in an app-safe package */
export interface AppSafePatchRegion {
  /** Byte offset in the 2MB ROM (0–2,097,151) */
  offset: number
  /** Number of bytes in this region */
  byteCount: number
  /** Space-separated hex — bytes expected in the stock BIN at this offset */
  expectedStockHex: string
  /** Space-separated hex — bytes to write at this offset when patching */
  replacementHex: string
  /** XDF map name (null when unmatched-but-audited region) */
  mapName: string | null
  /** XDF map category (null when unmatched-but-audited region) */
  category: string | null
}

/** App-safe patch package as exported by export-app-safe-packages.mjs */
export interface AppSafePatchPackage {
  packageId:      string
  packageVersion: number
  romId:          string
  stage:          string
  fuel:           string

  /** SHA-256 of the verified stock BIN this package was built from */
  stockSha256: string
  /**
   * SHA-256 of the fully-tuned BIN (from the private tuner file).
   * Applying patchRegions alone will NOT produce this hash — the ROM CRC byte
   * at 0x041366 is always excluded. External flasher recalculates CRC on flash.
   */
  tunedSha256: string

  // ── Safety gate fields ──────────────────────────────────────────────────────
  outputMode:             PatchOutputMode
  ownerReviewRequired:    boolean
  encryptionApproved:     boolean   // always false in exported packages
  mhdEncryptionAllowed:   boolean   // always false in exported packages
  safeForAppPackage:      boolean   // true = 0 stock-byte mismatches in dry-run

  // ── Flasher requirements ────────────────────────────────────────────────────
  externalFlasherRequired:         boolean
  requiresExternalFlasherChecksum: boolean
  supportedFlashers:               string[]

  patchRegionCount: number
  patchRegions:     AppSafePatchRegion[]
}

// ─── Patch Apply Engine Types ─────────────────────────────────────────────────

/** Per-region result produced by the apply engine */
export interface RegionApplyResult {
  regionIndex:    number
  offset:         number
  byteCount:      number
  mapName:        string | null
  category:       string | null
  /** true = replacement bytes were written */
  applied:        boolean
  /** true = actual stock bytes at this offset didn't match expectedStockHex */
  stockMismatch:  boolean
  expectedHex:    string
  actualStockHex: string
  replacementHex: string
}

export type PatchApplyStatus =
  | 'stock_verified'   // inputSha256 matches pkg.stockSha256 exactly
  | 'unknown_stock'    // valid 2MB BIN, SHA-256 not in known-stock list for this ROM
  | 'stock_sha_mismatch' // inputSha256 doesn't match pkg.stockSha256 (wrong ROM or already modified)
  | 'region_errors'    // stock_sha_mismatch at individual region level
  | 'success'          // all regions applied, 0 stock-byte mismatches

/** Full result object returned by applyPatches() — review-only, no download */
export interface PatchApplyResult {
  // ── Hard-coded safety gate — never changes ──────────────────────────────────
  readonly outputMode:           'STANDARD_BIN_REVIEW_ONLY'
  readonly ownerReviewRequired:  true
  readonly encryptionApproved:   false
  readonly mhdEncryptionAllowed: false

  // ── Input info ──────────────────────────────────────────────────────────────
  packageId: string
  romId:     string
  stage:     string
  fuel:      string

  // ── Stock verification ──────────────────────────────────────────────────────
  inputSha256:        string
  stockSha256Expected: string
  stockSha256Match:   boolean

  // ── Apply results ───────────────────────────────────────────────────────────
  status:              PatchApplyStatus
  totalRegions:        number
  appliedCount:        number
  stockMismatchCount:  number

  // ── Output hash (review only — no buffer is returned) ───────────────────────
  patchedSha256:         string
  tunedSha256Expected:   string
  /**
   * Likely false — the excluded ROM CRC byte at 0x041366 means the patched
   * BIN hash will never exactly match tunedSha256 until the external flasher
   * recalculates the CRC.
   */
  patchedMatchesTuned:   boolean

  // ── Per-region detail ───────────────────────────────────────────────────────
  regionResults: RegionApplyResult[]

  // ── Notes and errors ────────────────────────────────────────────────────────
  errors: string[]
  notes:  string[]
}
