// ─── Protected Tune Export API Route ──────────────────────────────────────────
// POST /api/tune-program/export
//
// Accepts: { requestId, tuneFileId, adminPin }
// Returns: .synergytune file as a binary download
//
// Security notes:
// - Raw tune files are NEVER served through public/ URLs
// - Encryption uses AES-256-GCM with PBKDF2 key derivation
// - The SYNERGY_EXPORT_SECRET env var must be set before this route works
// - Admin PIN check uses SYNERGY_ADMIN_PIN env var
// - This does NOT store state — integrate a real DB for production
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createExportPackage } from '@/lib/tune-program/exportPackage'
import { registry } from '@/lib/tune-program/tuneFileRegistry'
import { validateRequest } from '@/lib/tune-program/validation'
import type { CustomerRequest } from '@/types/tune-program'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      tuneFileId?: string
      request?: CustomerRequest
      adminPin?: string
      exportedBy?: string
    }

    // ── Admin authentication ──────────────────────────────────────────────────
    const adminPin = process.env.SYNERGY_ADMIN_PIN ?? 'synergy2026'
    if (body.adminPin !== adminPin) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid admin PIN.' },
        { status: 401 }
      )
    }

    // ── Validate inputs ───────────────────────────────────────────────────────
    const { tuneFileId, request, exportedBy = 'Synergy Tuner' } = body

    if (!tuneFileId) {
      return NextResponse.json({ error: 'tuneFileId is required.' }, { status: 400 })
    }
    if (!request) {
      return NextResponse.json({ error: 'request data is required.' }, { status: 400 })
    }

    const tuneFile = registry.byId(tuneFileId)
    if (!tuneFile) {
      return NextResponse.json(
        { error: `Tune file "${tuneFileId}" not found in registry.` },
        { status: 404 }
      )
    }

    if (!tuneFile.exportable) {
      return NextResponse.json(
        { error: `Tune file "${tuneFile.displayName}" is not marked as exportable.` },
        { status: 403 }
      )
    }

    // ── Validate request completeness ─────────────────────────────────────────
    const validation = validateRequest(request)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Customer request failed validation.',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 422 }
      )
    }

    // ── Create encrypted package ──────────────────────────────────────────────
    const result = await createExportPackage(tuneFile, request, exportedBy)

    // ── Return as downloadable file ───────────────────────────────────────────
    const fileBuffer = Buffer.from(result.packageJson, 'utf8')

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'X-Package-Hash': result.contentHash,
        'X-Package-Id': result.packageId,
        'Cache-Control': 'no-store, no-cache',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during export.'
    console.error('[tune-program/export] Error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// Only POST is supported
export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
