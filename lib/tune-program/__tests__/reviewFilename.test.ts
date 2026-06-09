// ─── Review Filename Tests ─────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  makeCustomerReviewFilename,
  formatStageToken,
  formatFuelToken,
  formatTurboToken,
} from '../reviewFilename'

describe('makeCustomerReviewFilename', () => {
  it('matches the documented example', () => {
    expect(
      makeCustomerReviewFilename({ romId: 'I8A0S', stage: 'stage2+', fuel: 'e50', turboType: 'stock' }),
    ).toBe('I8A0S_Stage2Plus_E50_StockTurbo_REVIEW.bin')
  })

  it('always ends with _REVIEW.bin (never flash-ready wording)', () => {
    const name = makeCustomerReviewFilename({ romId: 'ina0s', stage: 'stage3', fuel: '93', turboType: 'stock' })
    expect(name.endsWith('_REVIEW.bin')).toBe(true)
    expect(name.toLowerCase()).not.toContain('flash')
  })

  it('includes ROM, stage, fuel, and turbo tokens', () => {
    const name = makeCustomerReviewFilename({ romId: 'INA0S', stage: 'hybrid-base', fuel: 'pump', turboType: 'n20-map-hybrid-base' })
    expect(name).toContain('INA0S')
    expect(name).toContain('HybridBase')
    expect(name).toContain('Pump')
    expect(name).toContain('REVIEW')
  })

  it('uppercases ROM and maps the stage1plus UI form', () => {
    expect(
      makeCustomerReviewFilename({ romId: 'i8a0s', stage: 'stage1plus', fuel: '91', turboType: 'stock' }),
    ).toBe('I8A0S_Stage1Plus_91_StockTurbo_REVIEW.bin')
  })
})

describe('token formatters', () => {
  it('formatStageToken', () => {
    expect(formatStageToken('stage2+')).toBe('Stage2Plus')
    expect(formatStageToken('hybrid-base')).toBe('HybridBase')
  })
  it('formatFuelToken', () => {
    expect(formatFuelToken('91')).toBe('91')
    expect(formatFuelToken('e50')).toBe('E50')
    expect(formatFuelToken('pump')).toBe('Pump')
  })
  it('formatTurboToken', () => {
    expect(formatTurboToken('stock')).toBe('StockTurbo')
    expect(formatTurboToken('hybrid')).toBe('Hybrid')
    expect(formatTurboToken('n20-map-hybrid-base')).toBe('HybridBase')
  })
})
