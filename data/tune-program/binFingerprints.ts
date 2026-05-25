// ─── N54 ROM Fingerprint Registry ─────────────────────────────────────────────
//
// PURPOSE:
//   Holds the structure for identifying ROM families from uploaded BIN files.
//   In v2, this will contain offset ranges and expected byte patterns derived
//   from XDF calibration definition analysis.
//
// CURRENT STATUS (v1):
//   All fingerprints are UNVERIFIED placeholders.
//   signatureOffsets[].expectedHex is intentionally empty — no real byte
//   signatures are hard-coded without XDF-backed verification.
//   fingerprintStatus will return 'unavailable' for all ROMs until v2.
//
// HOW THIS WILL WORK IN v2:
//   1. Open _private_tuning_sources/N54/I8A0S.xdf in TunerPro
//   2. Locate the ROM identifier / software version string region
//   3. Note the byte offset and expected hex pattern
//   4. Add that to signatureOffsets for the matching romId
//   5. Set verified: true
//   6. Run bin-diff.mjs against known-stock and known-tuned BINs to confirm
//
// IMPORTANT:
//   Never set expectedHex to a guessed or untested value.
//   Only fill it after cross-referencing with real XDF + known stock BIN bytes.
//
// ─────────────────────────────────────────────────────────────────────────────

export interface RomSignatureOffset {
  /** Decimal byte offset from file start */
  offset: number
  /** Same offset in hex (e.g., '0x1A000') — for readability/XDF cross-reference */
  offsetHex: string
  /** Number of consecutive bytes to check */
  length: number
  /** Human-readable label for this region (what it represents in the ROM) */
  description: string
  /**
   * Expected bytes as a lowercase hex string (no spaces, no 0x prefix).
   * Empty string = not yet mapped. Only fill after XDF analysis confirms value.
   * Example: 'i8a0s' in ASCII = '4938413053' but DO NOT put this here without verification.
   */
  expectedHex: string
}

export interface RomFingerprint {
  /** ROM identifier matching RomFamilyId */
  romId: string
  displayName: string
  /**
   * Signature byte offset regions that identify this ROM.
   * Empty array = fingerprint not yet mapped.
   */
  signatureOffsets: RomSignatureOffset[]
  /**
   * SHA-256 hashes of confirmed unmodified stock BINs for this ROM family.
   * Empty array = no verified stock hashes on record yet.
   * Will be populated from trusted physical flash reads of stock vehicles.
   */
  knownStockHashes: string[]
  /**
   * true = signatureOffsets and/or knownStockHashes have been verified against
   * real XDF + stock BIN data. false = placeholder only, do not use for matching.
   */
  verified: boolean
  /** XDF files available for this ROM in _private_tuning_sources/ */
  xdfAvailable: boolean
  /** Stock original BIN available in _private_tuning_sources/ */
  stockBinAvailable: boolean
  /** Source notes for the tuner/developer — never shown to customers */
  notes: string
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const binFingerprints: RomFingerprint[] = [
  {
    romId: 'I8A0S',
    displayName: 'I8A0S (MSD80)',
    signatureOffsets: [
      // PLACEHOLDER — offsets not yet mapped from XDF
      // To populate: open I8A0S.xdf in TunerPro, find the ROM version string region,
      // then verify against I8A0S_original.bin bytes at that offset.
      //
      // {
      //   offset: ?,         // fill from XDF
      //   offsetHex: '0x?',
      //   length: ?,
      //   description: 'ROM software version identifier',
      //   expectedHex: '',   // fill after verification
      // },
    ],
    knownStockHashes: [
      // Will be populated after running bin-diff.mjs on confirmed stock BINs.
      // Example entry (DO NOT add without real verification):
      // 'e3b0c44298fc1c149afb...' // I8A0S_original.bin SHA-256 from trusted source
    ],
    verified: false,
    xdfAvailable: true,   // I8A0S.xdf + I8A0S_Legacy.xdf confirmed in private inventory
    stockBinAvailable: true, // I8A0S_original.bin confirmed in private inventory
    notes:
      'Private inventory (2026-05-24): I8A0S.xdf (1,107,427 bytes) + Legacy + small variant. ' +
      'Stock original: I8A0S_original.bin (2,097,152 bytes). ' +
      'OTS v90 BINs available for diff baseline. ' +
      'Next step: extract software version string offset from I8A0S.xdf, verify against original.bin.',
  },
  {
    romId: 'IJE0S',
    displayName: 'IJE0S (MSD80)',
    signatureOffsets: [],
    knownStockHashes: [],
    verified: false,
    xdfAvailable: true,
    stockBinAvailable: true,
    notes:
      'Private inventory (2026-05-24): IJE0S.xdf (1,118,894 bytes) + Legacy + small variant. ' +
      'Stock original: IJE0S_original.bin (2,097,152 bytes). ' +
      'AT (ZF 6HP) ROM. XHP TCU tune compatibility notes will be relevant for fingerprint validation.',
  },
  {
    romId: 'IKM0S',
    displayName: 'IKM0S (MSD80)',
    signatureOffsets: [],
    knownStockHashes: [],
    verified: false,
    xdfAvailable: true,
    stockBinAvailable: true,
    notes:
      'Private inventory (2026-05-24): IKM0S.xdf (1,088,161 bytes) + Legacy + small variant. ' +
      'Stock original: IKM0S_original.bin + ikm0s_original.bin (both 2,097,152 bytes). ' +
      'Regional/late-production ROM. No Flex Fuel or Hybrid Twins source variants found.',
  },
]

// ─── Accessors ─────────────────────────────────────────────────────────────────

export const getFingerprintByRomId = (romId: string): RomFingerprint | undefined =>
  binFingerprints.find((f) => f.romId === romId)

/**
 * Check whether a fingerprint is ready for matching.
 * Returns false for all ROMs in v1 (all placeholders).
 */
export const isFingerprintVerified = (romId: string): boolean => {
  const fp = getFingerprintByRomId(romId)
  return fp?.verified === true && fp.signatureOffsets.length > 0
}
