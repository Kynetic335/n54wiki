'use client'

import { useState, useMemo } from 'react'

const BLEND_PRESETS = [
  { label: 'E30', value: 30 },
  { label: 'E50', value: 50 },
  { label: 'E85', value: 85 },
]

function calcToAdd(
  currentFuel: number,
  currentEthPct: number,
  targetEthPct: number,
  e85Pct: number,
): number {
  // x = currentFuel * (targetEth - currentEth) / (e85Eth - targetEth)
  return (currentFuel * (targetEthPct - currentEthPct)) / (e85Pct - targetEthPct)
}

export default function BlendCalculator() {
  const [tankCap, setTankCap] = useState(15.9)
  const [currentFuel, setCurrentFuel] = useState(7.0)
  const [currentEth, setCurrentEth] = useState(10)
  const [e85Source, setE85Source] = useState(75)
  const [targetEth, setTargetEth] = useState(30)
  const [customTarget, setCustomTarget] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const effectiveTarget = useCustom ? Number(customTarget) || 0 : targetEth

  const result = useMemo(() => {
    if (currentFuel <= 0 || tankCap <= 0) return { kind: 'invalid' as const }
    if (currentFuel > tankCap) return { kind: 'invalid' as const }
    if (effectiveTarget <= 0 || effectiveTarget >= 100) return { kind: 'invalid' as const }

    const space = tankCap - currentFuel

    if (e85Source <= effectiveTarget) {
      return {
        kind: 'error' as const,
        msg: `Your E85 source (${e85Source}%) is not strong enough to reach E${effectiveTarget}. Use a higher-ethanol source.`,
      }
    }
    if (effectiveTarget <= currentEth) {
      return {
        kind: 'dilute' as const,
        msg: `Your tank is already at ${currentEth}% — above the E${effectiveTarget} target. Fill with 93 octane to dilute.`,
      }
    }

    const toAdd = calcToAdd(currentFuel, currentEth, effectiveTarget, e85Source)
    const finalEth = ((currentFuel * (currentEth / 100) + toAdd * (e85Source / 100)) / (currentFuel + toAdd)) * 100

    if (toAdd > space + 0.01) {
      // How much fuel must be burned to create enough room?
      // fuel_needed * (target - current) / (e85 - target) <= space
      // fuel_needed <= space * (e85 - target) / (target - current)
      const maxFuel = (space * (e85Source - effectiveTarget)) / (effectiveTarget - currentEth)
      const burnOff = currentFuel - maxFuel
      return { kind: 'tight' as const, toAdd, space, burnOff: Math.max(0, burnOff), finalEth }
    }

    return { kind: 'ok' as const, toAdd, finalEth }
  }, [tankCap, currentFuel, currentEth, e85Source, effectiveTarget])

  function selectPreset(val: number) {
    setTargetEth(val)
    setUseCustom(false)
    setCustomTarget('')
  }

  return (
    <div
      style={{
        border: '1px solid #2563eb',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        margin: '2rem 0',
        color: '#1e3a8a',
      }}
    >
      <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: '0 0 1.25rem', color: '#1e3a8a' }}>
        Flex Fuel Blend Calculator
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <CalcField label="Tank capacity (gal)" hint="135i / 335i = 15.9 gal">
          <input
            type="number"
            value={tankCap}
            min={5}
            max={40}
            step={0.1}
            onChange={(e) => setTankCap(Number(e.target.value))}
            style={inputCss}
          />
        </CalcField>

        <CalcField label={`Current fuel (gal)`} hint={`of ${tankCap} gal total`}>
          <input
            type="number"
            value={currentFuel}
            min={0}
            max={tankCap}
            step={0.1}
            onChange={(e) => setCurrentFuel(Number(e.target.value))}
            style={inputCss}
          />
        </CalcField>

        <CalcField label="Current ethanol %" hint="E10 pump gas = 10%">
          <input
            type="number"
            value={currentEth}
            min={0}
            max={99}
            step={1}
            onChange={(e) => setCurrentEth(Number(e.target.value))}
            style={inputCss}
          />
        </CalcField>

        <CalcField label="E85 pump ethanol %" hint="Varies 51–83%; check your pump">
          <input
            type="number"
            value={e85Source}
            min={50}
            max={99}
            step={1}
            onChange={(e) => setE85Source(Number(e.target.value))}
            style={inputCss}
          />
        </CalcField>
      </div>

      {/* Target blend selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e40af', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Target blend
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {BLEND_PRESETS.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => selectPreset(b.value)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '0.4rem',
                border: '1.5px solid #2563eb',
                background: !useCustom && targetEth === b.value ? '#2563eb' : 'transparent',
                color: !useCustom && targetEth === b.value ? '#fff' : '#2563eb',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {b.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUseCustom(true)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '0.4rem',
              border: '1.5px solid #2563eb',
              background: useCustom ? '#2563eb' : 'transparent',
              color: useCustom ? '#fff' : '#2563eb',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Custom
          </button>
          {useCustom && (
            <>
              <input
                type="number"
                value={customTarget}
                min={1}
                max={99}
                placeholder="e.g. 40"
                onChange={(e) => setCustomTarget(e.target.value)}
                style={{ ...inputCss, width: '80px' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>%</span>
            </>
          )}
        </div>
      </div>

      {/* Result */}
      {result.kind === 'invalid' && (
        <div style={alertBox('#fef9c3', '#854d0e')}>Enter valid tank values above to calculate.</div>
      )}
      {result.kind === 'error' && (
        <div style={alertBox('#fee2e2', '#991b1b')}>{result.msg}</div>
      )}
      {result.kind === 'dilute' && (
        <div style={alertBox('#fef9c3', '#854d0e')}>{result.msg}</div>
      )}
      {result.kind === 'tight' && (
        <div style={alertBox('#fef9c3', '#854d0e')}>
          <strong>Not enough room.</strong> You need {result.toAdd.toFixed(2)} gal but only{' '}
          {result.space.toFixed(2)} gal of space remains.
          <br />
          Drive off ~{result.burnOff.toFixed(1)} gallons of fuel first, then recalculate.
        </div>
      )}
      {result.kind === 'ok' && (
        <div
          style={{
            background: '#dbeafe',
            border: '1px solid #3b82f6',
            borderRadius: '0.5rem',
            padding: '1rem 1.25rem',
          }}
        >
          <p style={{ margin: '0 0 0.2rem', fontWeight: 800, fontSize: '1.4rem', color: '#1e3a8a' }}>
            Add {result.toAdd.toFixed(2)} gallons of E85
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af' }}>
            Final blend: E{result.finalEth.toFixed(1)} ({result.finalEth.toFixed(1)}% ethanol) —{' '}
            {(tankCap - currentFuel - result.toAdd).toFixed(2)} gal of space left after fill
          </p>
        </div>
      )}
    </div>
  )
}

function CalcField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </span>
      {children}
      {hint && <span style={{ fontSize: '0.72rem', color: '#3b82f6' }}>{hint}</span>}
    </label>
  )
}

function alertBox(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${color}55`,
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    color,
    fontSize: '0.9rem',
    lineHeight: 1.5,
  }
}

const inputCss: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #93c5fd',
  borderRadius: '0.4rem',
  padding: '0.45rem 0.7rem',
  color: '#1e3a8a',
  fontSize: '0.95rem',
  width: '100%',
  boxSizing: 'border-box',
}
