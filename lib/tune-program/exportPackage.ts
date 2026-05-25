// ─── Protected Export Package Builder ─────────────────────────────────────────
// SERVER-SIDE ONLY — uses Node.js crypto and fs
// Do NOT import this in 'use client' components.
//
// WARNING: Client-side-only locking is not secure.
// Real tune file protection requires server-side export/encryption.
// This implementation uses AES-256-GCM with a key derived from SYNERGY_EXPORT_SECRET.
// The resulting .synergytune package is:
//   - not directly readable without the Synergy decryption tool
//   - not a guarantee of total security (encrypted packages can be brute-forced)
//   - intended to prevent casual copying/reading, not nation-state attacks
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { ExportPackage, CustomerRequest, TuneFile } from '@/types/tune-program'
import { sha256Hex, randomToken } from './hashFile'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // bytes — AES-256
const IV_LENGTH = 12  // bytes — GCM standard
const SALT_LENGTH = 16
const TAG_LENGTH = 16
const ITERATIONS = 100_000
const DIGEST = 'sha256'

function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, DIGEST)
}

export interface ExportResult {
  packageJson: string
  fileName: string
  contentHash: string
  packageId: string
}

/**
 * Build a locked .synergytune export package.
 *
 * Reads the tune file from protected-tune-files/ on the server,
 * encrypts it with AES-256-GCM using a key derived from SYNERGY_EXPORT_SECRET,
 * and returns the serialized package JSON plus a suggested filename.
 *
 * The package includes:
 *   - Customer info (name, email, vehicle)
 *   - Selection metadata (ROM, fuel, stage, turbo type)
 *   - SHA-256 hash of original content
 *   - AES-256-GCM encrypted tune content
 *   - Synergy BMW Tuning metadata
 *
 * @throws if SYNERGY_EXPORT_SECRET is not set
 * @throws if the tune file is not found (production only)
 */
export async function createExportPackage(
  tuneFile: TuneFile,
  request: CustomerRequest,
  exportedBy: string
): Promise<ExportResult> {
  const secret = process.env.SYNERGY_EXPORT_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'SYNERGY_EXPORT_SECRET environment variable is not set or is too short (minimum 16 chars). ' +
        'Set this variable in .env.local before generating export packages.'
    )
  }

  // ── Read tune file ──────────────────────────────────────────────────────────
  const filePath = path.join(process.cwd(), tuneFile.protectedFilePath)
  let tuneContent: Buffer

  try {
    tuneContent = await fs.readFile(filePath)
  } catch {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Tune file not found on server: ${tuneFile.protectedFilePath}. ` +
          'Place the actual BIN file at this path before exporting.'
      )
    }
    // Development: use a clearly-labeled placeholder
    tuneContent = Buffer.from(
      JSON.stringify(
        {
          placeholder: true,
          warning:
            'This is a DEVELOPMENT PLACEHOLDER — not a real tune file. ' +
            'In production, the actual BIN must be placed at the protectedFilePath.',
          tuneFileId: tuneFile.id,
          displayName: tuneFile.displayName,
          expectedPath: tuneFile.protectedFilePath,
        },
        null,
        2
      ),
      'utf8'
    )
  }

  // ── Hash the content ────────────────────────────────────────────────────────
  const contentHash = sha256Hex(tuneContent)

  // ── Encrypt ─────────────────────────────────────────────────────────────────
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey(secret, salt)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM
  const encrypted = Buffer.concat([cipher.update(tuneContent), cipher.final()])
  const authTag = cipher.getAuthTag() // 16 bytes

  // Pack: salt(16) + authTag(16) + encrypted
  const encryptedContent = Buffer.concat([salt, authTag, encrypted]).toString('base64')

  // ── Build package ───────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString()
  const packageId = randomToken(8)

  const pkg: ExportPackage = {
    format: 'synergytune-v1',
    timestamp,
    customerEmail: request.email,
    selection: {
      tuneFileId: tuneFile.id,
      displayName: tuneFile.displayName,
      rom: tuneFile.romVersion,
      fuel: tuneFile.fuel,
      stage: tuneFile.stage,
      turboType: tuneFile.turboType,
    },
    customer: {
      name: request.name,
      email: request.email,
      vehicleYear: request.vehicleYear,
      vehicleModel: request.vehicleModel,
      transmission: request.transmission,
    },
    metadata: {
      tuner: 'Synergy BMW Tuning',
      platform: 'N54',
      version: '1.0.0',
      exportedBy,
      note:
        'This is a protected export package. It is not directly readable without the Synergy decryption tool. ' +
        'This package prevents casual copying and reading of the tune file. ' +
        'For support, contact Synergy BMW Tuning.',
    },
    contentHash,
    encryptedContent,
    iv: iv.toString('base64'),
  }

  const safeEmail = request.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-')
  const fileName = `synergy-${tuneFile.romVersion}-${tuneFile.stage}-${tuneFile.fuel}-${safeEmail}-${packageId}.synergytune`

  return {
    packageJson: JSON.stringify(pkg, null, 2),
    fileName,
    contentHash,
    packageId,
  }
}

/**
 * Verify a .synergytune package by decrypting and comparing the content hash.
 * Returns true if the package is valid and untampered.
 */
export async function verifyExportPackage(packageJson: string): Promise<boolean> {
  const secret = process.env.SYNERGY_EXPORT_SECRET
  if (!secret) return false

  try {
    const pkg = JSON.parse(packageJson) as ExportPackage

    const encryptedBuffer = Buffer.from(pkg.encryptedContent, 'base64')
    const iv = Buffer.from(pkg.iv, 'base64')

    // Unpack: salt(16) + authTag(16) + encrypted
    const salt = encryptedBuffer.subarray(0, SALT_LENGTH)
    const authTag = encryptedBuffer.subarray(SALT_LENGTH, SALT_LENGTH + TAG_LENGTH)
    const encrypted = encryptedBuffer.subarray(SALT_LENGTH + TAG_LENGTH)

    const key = deriveKey(secret, salt)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    const hash = sha256Hex(decrypted)

    return hash === pkg.contentHash
  } catch {
    return false
  }
}
