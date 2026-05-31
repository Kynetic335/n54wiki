import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const fsMocks = vi.hoisted(() => ({
  appendFile: vi.fn(),
  mkdir: vi.fn(),
}))

vi.mock('node:fs/promises', () => fsMocks)

function requestFor(payload: unknown) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    fsMocks.appendFile.mockResolvedValue(undefined)
    fsMocks.mkdir.mockResolvedValue(undefined)
    vi.stubGlobal('fetch', vi.fn())
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LEAD_WEBHOOK_URL', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('accepts a valid lead payload and appends it in development', async () => {
    const response = await POST(requestFor({
      name: 'Alex',
      email: 'alex@example.com',
      vehicle: '2008 335i',
      rom: 'I8A0S',
      message: 'Stage 1 consult',
      source: 'contact-form',
      binContents: 'ignored',
    }))

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(response.status).toBe(200)
    expect(fsMocks.mkdir).toHaveBeenCalledOnce()
    expect(fsMocks.appendFile).toHaveBeenCalledOnce()

    const writtenLine = fsMocks.appendFile.mock.calls[0][1] as string
    const writtenLead = JSON.parse(writtenLine)
    expect(writtenLead).toMatchObject({
      name: 'Alex',
      email: 'alex@example.com',
      vehicle: '2008 335i',
      rom: 'I8A0S',
      message: 'Stage 1 consult',
      source: 'contact-form',
    })
    expect(writtenLead.binContents).toBeUndefined()
  })

  it('rejects a payload with missing email', async () => {
    const response = await POST(requestFor({
      source: 'contact-form',
    }))

    await expect(response.json()).resolves.toEqual({ error: 'Email is required.' })
    expect(response.status).toBe(400)
    expect(fsMocks.appendFile).not.toHaveBeenCalled()
  })

  it('rejects a payload with missing source', async () => {
    const response = await POST(requestFor({
      email: 'alex@example.com',
    }))

    await expect(response.json()).resolves.toEqual({ error: 'Source is required.' })
    expect(response.status).toBe(400)
    expect(fsMocks.appendFile).not.toHaveBeenCalled()
  })

  it('does not throw in production when webhook env is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('LEAD_WEBHOOK_URL', '')

    const response = await POST(requestFor({
      email: 'alex@example.com',
      source: 'contact-form',
    }))

    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(response.status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
    expect(fsMocks.appendFile).not.toHaveBeenCalled()
  })
})
