// ─── BIN File Validator ────────────────────────────────────────────────────────
//
// Validates an uploaded customer/owner stock BIN file before patching.
//
// Checks (in order):
//   1. Extension must be .bin (case-insensitive)
//   2. Size must be exactly 2,097,152 bytes (2 MiB — N54 MSD80/MSD81 ROM size)
//   3. SHA-256 computed via Web Crypto API (browser) or Node crypto (tests)
//   4. Hash must match a known stock hash for the SELECTED ROM
//   5. If hash doesn't match selected ROM, scan all ROMs — detect mismatches
//
// Notes:
//   - SHA-256 hashes are one-way digests — no BIN content is exposed
//   - A HASH_MISMATCH (unknown BIN) does NOT auto-block in all cases; the caller
//     decides the UX. The result is always explicit.
//   - ROM_MISMATCH (hash matches a different ROM) is always a hard block.
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  isKnownStockHash,
  findRomByHash,
} from '@/data/tune-program/binFingerprints'

export type BinValidationError =
  | 'WRONG_EXTENSION'   // file does not end with .bin
  | 'WRONG_SIZE'        // file is not exactly 2,097,152 bytes
  | 'ROM_MISMATCH'      // SHA-256 matches a different ROM than selected
  | 'HASH_MISMATCH'     // valid 2MB BIN but SHA-256 not in any known-stock list

export interface BinValidationResult {
  /** true only when the file passes all checks for the selected ROM */
  valid: boolean
  error?: BinValidationError
  message: string
  /** SHA-256 hex string (computed if size check passes) */
  sha256?: string
  /**
   * Populated when error === 'ROM_MISMATCH'.
   * The ROM ID whose stock hash matched the uploaded file.
   */
  detectedRomId?: string
}

/** Expected byte length of a valid N54 MSD80/MSD81 ROM file */
export const EXPECTED_BIN_SIZE = 2_097_152 // 2 MiB

/**
 * Compute SHA-256 of an ArrayBuffer and return lowercase hex.
 * Uses the Web Crypto API (browser) or globalThis.crypto (Node 19+ / vitest).
 */
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate an uploaded stock BIN file against the expected ROM.
 *
 * @param file          - The File object from the browser file input
 * @param expectedRomId - ROM ID the user selected (e.g. 'I8A0S')
 */
export async function validateBinFile(
  file: File,
  expectedRomId: string,
): Promise<BinValidationResult> {
  // ── 1. Extension check ──────────────────────────────────────────────────────
  if (!file.name.toLowerCase().endsWith('.bin')) {
    return {
      valid: false,
      error: 'WRONG_EXTENSION',
      message: `File must have a .bin extension. Got: "${file.name}"`,
    }
  }

  // ── 2. Size check ───────────────────────────────────────────────────────────
  if (file.size !== EXPECTED_BIN_SIZE) {
    const kb = (file.size / 1024).toFixed(1)
    return {
      valid: false,
      error: 'WRONG_SIZE',
      message: `File must be exactly 2,097,152 bytes (2 MiB). Got: ${file.size.toLocaleString()} bytes (${kb} KB).`,
    }
  }

  // ── 3. SHA-256 computation ──────────────────────────────────────────────────
  const buffer = await file.arrayBuffer()
  const sha256 = await sha256Hex(buffer)

  // ── 4. Hash match for selected ROM ─────────────────────────────────────────
  if (isKnownStockHash(sha256, expectedRomId)) {
    return {
      valid: true,
      message: `Stock BIN verified — SHA-256 matches known ${expectedRomId} stock hash.`,
      sha256,
    }
  }

  // ── 5. Cross-ROM mismatch check ─────────────────────────────────────────────
  const detectedRomId = findRomByHash(sha256)
  if (detectedRomId) {
    return {
      valid: false,
      error: 'ROM_MISMATCH',
      message:
        `ROM mismatch: uploaded BIN matches the ${detectedRomId} stock hash, ` +
        `but you selected ${expectedRomId}. Select the correct ROM and re-upload.`,
      sha256,
      detectedRomId,
    }
  }

  // ── Unknown 2MB BIN ─────────────────────────────────────────────────────────
  return {
    valid: false,
    error: 'HASH_MISMATCH',
    message:
      `SHA-256 does not match any known stock hash for ${expectedRomId} ` +
      `(or any other supported ROM). Upload the unmodified stock BIN read ` +
      `directly from the vehicle via MHD.`,
    sha256,
  }
}
