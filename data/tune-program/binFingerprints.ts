// ─── N54 ROM Fingerprint Registry ─────────────────────────────────────────────
//
// PURPOSE:
//   Holds the structure for identifying ROM families from uploaded BIN files.
//
// CURRENT STATUS (v1):
//   knownStockHashes are populated from filename-identified, size-verified
//   original BIN files in _private_tuning_sources/.
//   Confidence level: filename-and-size (see PRIVATE_STOCK_BIN_FINGERPRINTS.md).
//
//   signatureOffsets are NOT yet populated — no byte patterns hard-coded
//   without XDF-backed verification. fingerprintStatus returns 'unavailable'.
//
// HASH VERIFICATION LOGIC:
//   - SHA-256 match against knownStockHashes → hashKnown: true, "Known stock BIN"
//   - Hash matches a DIFFERENT ROM's hashes → warn "possible ROM mismatch"
//   - Valid 2MB but no hash match → hashKnown: false, "Unknown 2MB BIN"
//   - Generate BIN does NOT require hashKnown: true — size check is sufficient
//
// HOW signatureOffsets WILL BE POPULATED IN v2:
//   1. Open _private_tuning_sources/N54/I8A0S.xdf in TunerPro
//   2. Locate software version string / ROM identifier region
//   3. Record exact byte offset and expected hex pattern
//   4. Verify against I8A0S_original.bin at that offset
//   5. Add to signatureOffsets[], set verified: true
//   6. Repeat for IJE0S, IKM0S
//
// SAFETY:
//   - No raw byte patterns from BIN files are included here
//   - SHA-256 hashes are one-way digests; they do not expose BIN content
//   - This file is committed to the repo (hashes are safe public data)
//
// ─────────────────────────────────────────────────────────────────────────────

export interface RomSignatureOffset {
  /** Decimal byte offset from file start */
  offset: number
  /** Same offset in hex (e.g. '0x1A000') for XDF cross-reference */
  offsetHex: string
  /** Number of consecutive bytes to check */
  length: number
  /** Human-readable label — what this region represents in the ROM */
  description: string
  /**
   * Expected bytes as a lowercase hex string (no spaces, no 0x prefix).
   * Empty string = not yet mapped. Fill only after XDF analysis confirms value.
   */
  expectedHex: string
}

export interface RomFingerprint {
  /** ROM identifier matching RomFamilyId */
  romId: string
  displayName: string
  /**
   * SHA-256 hashes (lowercase hex, 64 chars) of confirmed stock/original BINs.
   * Source: filename-identified *_original.bin files, size-verified at 2,097,152 bytes.
   * Cross-confirmed: uppercase (N54/) and lowercase (E Series/) copies have identical hashes.
   * Confidence: filename-and-size. Byte-level ROM identifier verification pending (v2).
   */
  knownStockHashes: string[]
  /**
   * Byte offset regions that identify this ROM (v2+).
   * Empty array = not yet mapped from XDF.
   */
  signatureOffsets: RomSignatureOffset[]
  /**
   * true = signatureOffsets have been verified against real XDF + stock BIN data.
   * false = placeholder, do not use for byte matching.
   */
  verified: boolean
  /** XDF files available for this ROM in _private_tuning_sources/ */
  xdfAvailable: boolean
  /** Stock original BIN available in _private_tuning_sources/ */
  stockBinAvailable: boolean
  /** Source/developer notes — never shown to customers */
  notes: string
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const binFingerprints: RomFingerprint[] = [
  {
    romId: 'I8A0S',
    displayName: 'I8A0S (MSD80)',
    knownStockHashes: [
      // Source: N54/I8A0S_original.bin + E Series N54.../i8a0s_original.bin
      // Both files: 2,097,152 bytes, identical hash (confirmed same source)
      // Confidence: filename-and-size | Byte-verified: NO (v2)
      'c53ff0d4da3aafb0aee93b2a4df165b4f98229752b2bc2ea694a2699bc396b38',
    ],
    signatureOffsets: [
      // PLACEHOLDER — offsets not yet mapped from XDF analysis
      // To populate in v2:
      //   1. Open _private_tuning_sources/N54/I8A0S.xdf in TunerPro
      //   2. Find software version string / ROM identifier region
      //   3. Record offset + expected hex bytes
      //   4. Verify against I8A0S_original.bin at that offset
      //   5. Fill in offset, offsetHex, length, description, expectedHex
      //   6. Set verified: true
    ],
    verified: false,
    xdfAvailable: true,      // I8A0S.xdf (1,107,427 B), I8A0S_Legacy.xdf confirmed
    stockBinAvailable: true, // I8A0S_original.bin (2,097,152 B) confirmed
    notes:
      'Hash added 2026-05-24 from private inventory. ' +
      'Most common N54 ROM — 6-speed MT 135i/335i/Z4 35i/1M (2007-2010). ' +
      'OTS v90 BINs available for diff baseline (stage 1/1+/2/2+ × 6 fuels).',
  },
  {
    romId: 'IJE0S',
    displayName: 'IJE0S (MSD80)',
    knownStockHashes: [
      // Source: N54/IJE0S_original.bin + E Series N54.../ije0s_original.bin
      // Both files: 2,097,152 bytes, identical hash
      // Confidence: filename-and-size | Byte-verified: NO (v2)
      '25adcdcc54f698154315f50731db033c5aa48136e93b20a4de8e9e87cba59c18',
    ],
    signatureOffsets: [],
    verified: false,
    xdfAvailable: true,
    stockBinAvailable: true,
    notes:
      'Hash added 2026-05-24. AT (ZF 6HP) ROM — 135i/335i/535i automatic variants. ' +
      'XHP TCU tune compatibility relevant for fingerprint validation notes.',
  },
  {
    romId: 'IKM0S',
    displayName: 'IKM0S (MSD80)',
    knownStockHashes: [
      // Source: N54/IKM0S_original.bin + E Series N54.../ikm0s_original.bin
      // Both files: 2,097,152 bytes, identical hash
      // Confidence: filename-and-size | Byte-verified: NO (v2)
      '6e1e4d70166dfe7a6608b8c63101153c8e1b163a2acc5e9ffd49bf0a49e9a4df',
    ],
    signatureOffsets: [],
    verified: false,
    xdfAvailable: true,
    stockBinAvailable: true,
    notes:
      'Hash added 2026-05-24. Less common ROM — regional/late-production N54. ' +
      'No Flex Fuel or Hybrid Twins source variants found for IKM0S.',
  },
  {
    romId: 'INA0S',
    displayName: 'INA0S (MSD80)',
    knownStockHashes: [
      // Source: N54/INA0S_original.bin + E Series N54.../ina0s_original.bin
      // Both files: 2,097,152 bytes, identical hash
      // Confidence: filename-and-size | Byte-verified: NO (v2)
      // Note: INA0S is in the tune file registry but not exposed as a ROM selector in v1 UI
      '66296babb3f4060ecc9cb8f40faa982651a790c255361a39cd653f448db3f8e0',
    ],
    signatureOffsets: [],
    verified: false,
    xdfAvailable: true,
    stockBinAvailable: true,
    notes:
      'Hash added 2026-05-24. Later N54 revision — 2010+ models, some 535i. ' +
      'Retained for registry completeness. Not exposed as a selectable ROM in v1 Tune Program UI.',
  },
]

// ─── Accessors ─────────────────────────────────────────────────────────────────

export const getFingerprintByRomId = (romId: string): RomFingerprint | undefined =>
  binFingerprints.find((f) => f.romId === romId)

/**
 * Check if a SHA-256 hash matches any known stock hash for the given ROM.
 * Returns false for all ROMs in v1 if the hash is not in knownStockHashes.
 */
export const isKnownStockHash = (sha256: string, romId: string): boolean => {
  const fp = getFingerprintByRomId(romId)
  return fp?.knownStockHashes.includes(sha256.toLowerCase()) ?? false
}

/**
 * Search ALL ROM fingerprints for a matching hash.
 * Used to detect ROM mismatches (e.g. user uploads I8A0S BIN but selects IJE0S).
 * Returns the matching ROM ID if found, undefined otherwise.
 */
export const findRomByHash = (sha256: string): string | undefined => {
  const lower = sha256.toLowerCase()
  return binFingerprints.find((fp) =>
    fp.knownStockHashes.includes(lower)
  )?.romId
}

/**
 * Check whether a fingerprint has byte-level signature data ready for matching.
 * Returns false for all ROMs in v1 (all placeholders until XDF analysis complete).
 */
export const isFingerprintVerified = (romId: string): boolean => {
  const fp = getFingerprintByRomId(romId)
  return fp?.verified === true && fp.signatureOffsets.some((s) => s.expectedHex !== '')
}
