import { mkdir, appendFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type LeadPayload = {
  name?: string
  email?: string
  vehicle?: string
  rom?: string
  stage?: string
  fuel?: string
  turboType?: string
  selectedAddons?: string[]
  message?: string
  source: string
}

const STRING_LIMITS = {
  name: 120,
  email: 254,
  vehicle: 160,
  rom: 40,
  stage: 80,
  fuel: 40,
  turboType: 80,
  message: 4000,
  source: 80,
}

function cleanString(value: unknown, limit: number) {
  if (typeof value !== 'string') {
    return undefined
  }

  const cleaned = value.trim().slice(0, limit)
  return cleaned.length > 0 ? cleaned : undefined
}

function cleanStringArray(value: unknown, limit: number, itemLimit: number) {
  if (!Array.isArray(value)) {
    return undefined
  }

  const cleaned = value
    .map((item) => cleanString(item, itemLimit))
    .filter((item): item is string => Boolean(item))
    .slice(0, limit)

  return cleaned.length > 0 ? cleaned : undefined
}

function parseLeadPayload(body: unknown): { lead: LeadPayload } | { error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Payload must be a JSON object.' }
  }

  const sourceObject = body as Record<string, unknown>
  const email = cleanString(sourceObject.email, STRING_LIMITS.email)
  const source = cleanString(sourceObject.source, STRING_LIMITS.source)

  if (!email && source !== 'tune-program-export') {
    return { error: 'Email is required.' }
  }

  if (!source) {
    return { error: 'Source is required.' }
  }

  return {
    lead: {
      name: cleanString(sourceObject.name, STRING_LIMITS.name),
      email,
      vehicle: cleanString(sourceObject.vehicle, STRING_LIMITS.vehicle),
      rom: cleanString(sourceObject.rom, STRING_LIMITS.rom),
      stage: cleanString(sourceObject.stage, STRING_LIMITS.stage),
      fuel: cleanString(sourceObject.fuel, STRING_LIMITS.fuel),
      turboType: cleanString(sourceObject.turboType, STRING_LIMITS.turboType),
      selectedAddons: cleanStringArray(sourceObject.selectedAddons, 12, 80),
      message: cleanString(sourceObject.message, STRING_LIMITS.message),
      source,
    },
  }
}

async function appendDevelopmentLead(lead: LeadPayload) {
  const leadsDir = path.join(process.cwd(), 'data', 'leads')
  const leadsFile = path.join(leadsDir, 'leads.jsonl')
  await mkdir(leadsDir, { recursive: true })
  await appendFile(leadsFile, `${JSON.stringify({ ...lead, createdAt: new Date().toISOString() })}\n`, 'utf8')
}

async function postProductionLead(lead: LeadPayload) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL

  if (!webhookUrl) {
    return
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...lead, createdAt: new Date().toISOString() }),
  })

  if (!response.ok) {
    throw new Error(`Lead webhook failed with status ${response.status}`)
  }
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const parsed = parseLeadPayload(body)

  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    if (process.env.NODE_ENV === 'production') {
      await postProductionLead(parsed.lead)
    } else {
      await appendDevelopmentLead(parsed.lead)
    }
  } catch {
    return NextResponse.json({ error: 'Lead capture failed.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
