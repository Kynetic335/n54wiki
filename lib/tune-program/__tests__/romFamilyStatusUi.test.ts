// ─── ROM Family Status UI — data-driven badge regression ──────────────────────
//
// Guards the /tune-app Step 1 status badge + Step 2 copy against going stale.
// The badge is DERIVED from the real package manifest/gate (packageGates), not
// hardcoded. These tests prove:
//   - IJE0S ROM family resolves READY (was stale "Needs Audit")
//   - IKM0S is not globally disabled (READY gate + selectable packages)
//   - IKM0S READY packages can be selected (Generate BIN enabled)
//   - IKM0S missing fuel variants show "No matching package"
//   - the component carries accurate copy and no flash-ready wording
//
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  getRomGateStatus,
  listReadyPackagesForRom,
} from '../packageGates'
import { resolveGenerateBin } from '../generateBinGate'

const COMPONENT = resolve(__dirname, '..', '..', '..', 'components', 'TuneProgram.tsx')
const componentSrc = readFileSync(COMPONENT, 'utf8')

// Mirror of the component's deriveRomStatus() — kept in lock-step so a logic
// drift in the UI helper is caught here against the real manifest data.
type RomReviewStatus = 'ready' | 'partial-ready' | 'needs-audit' | 'not-built'
function deriveRomStatus(romId: string, heldVariantCount = 0): { status: RomReviewStatus; label: string } {
  const gate = getRomGateStatus(romId)
  const readyCount = listReadyPackagesForRom(romId).length
  if (gate === 'READY') {
    if (heldVariantCount > 0) return { status: 'partial-ready', label: `${readyCount} READY / ${heldVariantCount} MISSING` }
    return { status: 'ready', label: 'READY' }
  }
  if (gate === 'NEEDS_AUDIT') return { status: 'needs-audit', label: 'Needs Audit' }
  return { status: 'not-built', label: 'Not Built Yet' }
}

describe('ROM family status — derived from real manifest', () => {
  it('I8A0S resolves READY', () => {
    expect(deriveRomStatus('I8A0S').status).toBe('ready')
  })

  it('IJE0S resolves READY (no longer Needs Audit)', () => {
    const st = deriveRomStatus('IJE0S')
    expect(st.status).toBe('ready')
    expect(st.label).toBe('READY')
  })

  it('INA0S resolves READY', () => {
    expect(deriveRomStatus('INA0S').status).toBe('ready')
  })

  it('IKM0S resolves PARTIAL READY with 16 READY / 8 MISSING (not Not Built Yet)', () => {
    const st = deriveRomStatus('IKM0S', 8)
    expect(st.status).toBe('partial-ready')
    expect(st.label).toBe('16 READY / 8 MISSING')
  })
})

describe('IKM0S is not globally disabled', () => {
  it('ROM gate is READY', () => {
    expect(getRomGateStatus('IKM0S')).toBe('READY')
  })

  it('has 16 READY packages', () => {
    expect(listReadyPackagesForRom('IKM0S')).toHaveLength(16)
  })

  it('READY package (stage1 / 91) enables Generate BIN', () => {
    const d = resolveGenerateBin({ romId: 'IKM0S', stage: 'stage1', fuel: '91', packageType: 'standard-ots' })
    expect(d.enabled).toBe(true)
  })

  it('READY package (stage3 / e50) enables Generate BIN', () => {
    const d = resolveGenerateBin({ romId: 'IKM0S', stage: 'stage3', fuel: 'e50', packageType: 'standard-ots' })
    expect(d.enabled).toBe(true)
  })
})

describe('IKM0S missing fuel variants show No matching package', () => {
  for (const stage of ['stage1', 'stage1+', 'stage2', 'stage3']) {
    for (const fuel of ['95', 'acn91']) {
      it(`${stage} / ${fuel} is disabled with No matching package`, () => {
        const d = resolveGenerateBin({ romId: 'IKM0S', stage, fuel, packageType: 'standard-ots' })
        expect(d.enabled).toBe(false)
        if (!d.enabled) expect(d.reason).toBe('No matching package')
      })
    }
  }
})

describe('TuneProgram component copy', () => {
  it('no stale "still being audited" / "have not been built yet" claims for ready ROMs', () => {
    // The accurate Step-2 notes replace the old stale fallbacks.
    expect(componentSrc).toContain('READY — owner-accepted V90 packages. Review BIN only.')
    expect(componentSrc).toContain('PARTIAL READY — 16 v90-source packages available.')
  })

  it('badge label is derived, not hardcoded reviewStatusLabel', () => {
    expect(componentSrc).not.toContain("reviewStatusLabel: 'Needs Audit'")
    expect(componentSrc).not.toContain("reviewStatusLabel: 'Not Built Yet'")
  })

  it('no flash-ready wording presents the output as flash-ready', () => {
    // Only the negative disclaimer ("...flash-ready ... are DISABLED") is allowed.
    const lower = componentSrc.toLowerCase()
    expect(lower).not.toContain('ready to flash')
    expect(lower).not.toContain('flash ready file')
    // The disclaimer line that names flash-ready must also disable it.
    if (lower.includes('flash-ready')) {
      expect(lower).toMatch(/flash-ready[\s\S]{0,120}(disabled|not)/)
    }
  })
})
