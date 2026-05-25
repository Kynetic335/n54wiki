// ─── N54 BIN Verifier — Client-Side Only ─────────────────────────────────────
//
// IMPORTANT: This module uses browser Web Crypto API (crypto.subtle).
// DO NOT import this file in server components or server-side code.
// It is safe to import in 'use client' components only.
//
// What this does (v1):
//   1. Checks file extension (.bin preferred, .ori/.org allowed with warning)
//   2. Validates exact file size = 2,097,152 bytes (0x200000)
//   3. Reads ArrayBuffer and converts to Uint8Array
//   4. Computes SHA-256 hash via crypto.subtle.digest
//   5. Checks hash against knownStockHashes in binFingerprints registry
//   6. Detects ROM mismatches (hash matches a different ROM than selected)
//   7. Returns a structured BinVerificationResult
//
// What this does NOT do yet (v2+):
//   - Read byte offsets to verify ROM identifier bytes from XDF
//   - Validate calibration region checksums
//   - Apply patch packages
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  isKnownStockHash,
  findRomByHash,
  isFingerprintVerified,
} from '@/data/tune-program/binFingerprints'

/** Exact size of all N54 MSD80/MSD81 ROMs */
export const VALID_BIN_SIZE = 2_097_152 // 0x200000 = 2 MB

export type FingerprintStatus = 'pending' | 'pass' | 'fail' | 'unavailable'
export type ExtensionStatus = 'preferred' | 'allowed_with_warning' | 'rejected'

/**
 * Indicates how confident we are that this is a known-good stock BIN.
 * 'known-stock'    = SHA-256 matches a verified entry in knownStockHashes for selectedRom
 * 'unknown-2mb'    = size is valid, SHA-256 not in any known-stock list
 * 'rom-mismatch'   = SHA-256 matches a known-stock hash, but for a DIFFERENT ROM than selected
 * 'invalid'        = size or extension check failed
 */
export type HashMatchStatus = 'known-stock' | 'unknown-2mb' | 'rom-mismatch' | 'invalid'

export interface BinVerificationResult {
  /** Original file name as uploaded */
  fileName: string
  /** File size in bytes */
  fileSize: number
  /** Detected file extension (e.g. '.bin', '.ori') */
  extension: string
  /** Extension acceptability */
  extensionStatus: ExtensionStatus
  /** SHA-256 hex digest of the full ArrayBuffer content */
  sha256: string
  /** ROM family ID the user selected at time of verification */
  selectedRom: string
  /** true = file size === 2,097,152 */
  sizeValid: boolean
  /**
   * true = SHA-256 matches a knownStockHash entry for selectedRom.
   * false in most cases until the hash database grows.
   */
  hashKnown: boolean
  /**
   * Detailed hash match classification:
   * 'known-stock'   = hash in selectedRom's knownStockHashes ✓
   * 'unknown-2mb'   = valid size, hash not in any ROM's known list
   * 'rom-mismatch'  = hash matches a DIFFERENT ROM's known list (warning)
   * 'invalid'       = size or read error
   */
  hashMatchStatus: HashMatchStatus
  /**
   * If hashMatchStatus === 'rom-mismatch', this is the ROM the hash actually matches.
   * undefined otherwise.
   */
  hashMatchedRom?: string
  /**
   * 'pending'     = verification not yet run
   * 'pass'        = byte signature matched expected pattern for selectedRom (v2)
   * 'fail'        = byte signature did NOT match (v2)
   * 'unavailable' = fingerprint byte data not yet populated for this ROM (v1 state)
   */
  fingerprintStatus: FingerprintStatus
  /**
   * true when it is safe to proceed to Generate BIN:
   *   - sizeValid === true
   *   - ArrayBuffer.byteLength === VALID_BIN_SIZE
   *   - extensionStatus !== 'rejected'
   *   - no hard errors
   * Does NOT require hashKnown === true.
   * Does NOT require fingerprintStatus === 'pass'.
   */
  isSafeToContinue: boolean
  /** Advisory warnings — shown in UI but do not block Generate BIN */
  warnings: string[]
  /** Hard errors — block Generate BIN and shown prominently */
  errors: string[]
}

// ─── SHA-256 via Web Crypto API ────────────────────────────────────────────────

/**
 * Compute SHA-256 of an ArrayBuffer using the browser's built-in crypto.subtle.
 * Throws if called in a non-secure context where crypto.subtle is unavailable.
 */
export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error(
      'crypto.subtle is not available. Ensure the page is served over HTTPS or localhost.'
    )
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Extension check ──────────────────────────────────────────────────────────

function getExtension(fileName: string): string {
  const dotIdx = fileName.lastIndexOf('.')
  return dotIdx >= 0 ? fileName.slice(dotIdx).toLowerCase() : ''
}

function classifyExtension(ext: string): ExtensionStatus {
  if (ext === '.bin') return 'preferred'
  if (ext === '.ori' || ext === '.org') return 'allowed_with_warning'
  return 'rejected'
}

// ─── Main verifier ────────────────────────────────────────────────────────────

/**
 * Perform full client-side BIN verification.
 *
 * @param file         File object from the input or drag-drop
 * @param buffer       ArrayBuffer already read by FileReader
 * @param selectedRom  ROM family ID selected by the user (e.g. 'I8A0S')
 * @returns            BinVerificationResult with all check results and status flags
 */
export async function verifyBin(
  file: File,
  buffer: ArrayBuffer,
  selectedRom: string
): Promise<BinVerificationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // ── Extension ────────────────────────────────────────────────────────────────
  const extension = getExtension(file.name)
  const extensionStatus = classifyExtension(extension)

  if (extensionStatus === 'rejected') {
    errors.push(
      `Unsupported file extension "${extension || '(none)'}". ` +
        'Upload a .bin file exported from MHD or N54 Quickflash. ' +
        'Backup files (.ori, .org) are also accepted with a warning.'
    )
  } else if (extensionStatus === 'allowed_with_warning') {
    warnings.push(
      `File extension "${extension}" is accepted but not preferred. ` +
        'Ensure this is an unmodified stock BIN, not a backup of a modified calibration.'
    )
  }

  // ── Size check ───────────────────────────────────────────────────────────────
  const sizeValid = file.size === VALID_BIN_SIZE

  if (!sizeValid) {
    const diff = file.size - VALID_BIN_SIZE
    errors.push(
      `File size mismatch: got ${file.size.toLocaleString()} bytes, ` +
        `expected exactly ${VALID_BIN_SIZE.toLocaleString()} bytes (2 MB / 0x200000). ` +
        `Difference: ${diff > 0 ? '+' : ''}${diff.toLocaleString()} bytes. ` +
        'This file cannot be used.'
    )
  }

  // ArrayBuffer size sanity check
  if (buffer.byteLength !== file.size) {
    errors.push(
      `ArrayBuffer size (${buffer.byteLength.toLocaleString()} bytes) does not match ` +
        `reported file size (${file.size.toLocaleString()} bytes). File may be corrupt.`
    )
  }

  // ── SHA-256 hash ─────────────────────────────────────────────────────────────
  let sha256 = ''
  try {
    sha256 = await sha256Hex(buffer)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`SHA-256 computation failed: ${msg}`)
  }

  // ── Hash match check ─────────────────────────────────────────────────────────
  let hashKnown = false
  let hashMatchStatus: HashMatchStatus = 'invalid'
  let hashMatchedRom: string | undefined

  if (sha256 && sizeValid) {
    if (selectedRom && isKnownStockHash(sha256, selectedRom)) {
      // Hash matches the selected ROM's known-stock list ✓
      hashKnown = true
      hashMatchStatus = 'known-stock'
    } else {
      // Check if it matches any OTHER ROM's known-stock list
      const matchedRom = findRomByHash(sha256)
      if (matchedRom) {
        // Hash matched but for a different ROM — ROM mismatch warning
        hashMatchedRom = matchedRom
        hashMatchStatus = 'rom-mismatch'
        warnings.push(
          `ROM selection mismatch: this BIN's SHA-256 matches the known stock hash for ` +
            `${matchedRom}, but you have selected ${selectedRom || '(none)'}. ` +
            `Double-check your ROM selection in MHD before continuing.`
        )
      } else {
        // Unknown hash but valid size — not in any known-stock list
        hashMatchStatus = 'unknown-2mb'
      }
    }
  }

  // ── ROM fingerprint (v1: unavailable) ────────────────────────────────────────
  // Byte-level fingerprinting from XDF-mapped offsets is not yet implemented.
  // isFingerprintVerified() returns false for all ROMs in v1.
  const fingerprintStatus: FingerprintStatus = isFingerprintVerified(selectedRom)
    ? 'pending' // would start matching if offsets were populated
    : 'unavailable'

  // ── isSafeToContinue ─────────────────────────────────────────────────────────
  // Requires: valid size + no hard errors + extension not rejected.
  // Does NOT require: hashKnown, fingerprintStatus === 'pass'.
  // hashMatchStatus === 'rom-mismatch' does NOT block — it only warns.
  const isSafeToContinue =
    sizeValid &&
    buffer.byteLength === VALID_BIN_SIZE &&
    extensionStatus !== 'rejected' &&
    errors.length === 0

  return {
    fileName: file.name,
    fileSize: file.size,
    extension,
    extensionStatus,
    sha256,
    selectedRom,
    sizeValid,
    hashKnown,
    hashMatchStatus,
    hashMatchedRom,
    fingerprintStatus,
    isSafeToContinue,
    warnings,
    errors,
  }
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Returns first N + last M chars of hash for compact display */
export function truncateHash(hash: string, head = 12, tail = 8): string {
  if (!hash || hash.length <= head + tail + 3) return hash
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`
}

/** Format byte size as "2,097,152 bytes (2.00 MB / 0x200000)" */
export function formatBinSize(bytes: number): string {
  const mb = (bytes / 1_048_576).toFixed(2)
  const hex = `0x${bytes.toString(16).toUpperCase()}`
  return `${bytes.toLocaleString()} bytes (${mb} MB / ${hex})`
}
