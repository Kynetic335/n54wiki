// ─── File Hashing Utilities ────────────────────────────────────────────────────
// Server-side only — uses Node.js crypto
// Do NOT import this in client components

import crypto from 'node:crypto'

/**
 * Compute SHA-256 hex hash of a Buffer.
 */
export function sha256Hex(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Compute SHA-256 hex hash of a string.
 */
export function sha256String(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex')
}

/**
 * Generate a short fingerprint for display (first 16 chars of SHA-256).
 */
export function fingerprint(data: Buffer | string): string {
  const input = typeof data === 'string' ? Buffer.from(data, 'utf8') : data
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16).toUpperCase()
}

/**
 * Generate a random hex token for package IDs.
 */
export function randomToken(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex')
}
