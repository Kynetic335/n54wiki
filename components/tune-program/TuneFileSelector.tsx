'use client'

import { useState } from 'react'
import { RomSelector } from './RomSelector'
import { TurboTypeSelector } from './TurboTypeSelector'
import { FuelSelector } from './FuelSelector'
import { StageSelector } from './StageSelector'
import { PackageCard } from './PackageCard'
import { registry } from '@/lib/tune-program/tuneFileRegistry'
import type { RomVersion, TurboTypeId, FuelType, StageId } from '@/types/tune-program'

const SECTION_TITLE: React.CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#555',
  fontWeight: 600,
  marginBottom: '0.75rem',
}

const CARD: React.CSSProperties = {
  background: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '0.75rem',
  padding: '1.25rem',
  marginBottom: '1.25rem',
}

export function TuneFileSelector() {
  const [rom, setRom] = useState<RomVersion | ''>('')
  const [turbo, setTurbo] = useState<TurboTypeId | ''>('')
  const [fuel, setFuel] = useState<FuelType | ''>('')
  const [stage, setStage] = useState<StageId | ''>('')

  const matches = rom || turbo || fuel || stage
    ? registry.filter({
        romVersion: rom as RomVersion || undefined,
        turboType: turbo as TurboTypeId || undefined,
        fuel: fuel as FuelType || undefined,
        stage: stage as StageId || undefined,
      })
    : []

  const availableTurbo = rom
    ? registry.availableTurboTypes(rom as RomVersion)
    : registry.availableTurboTypes()

  const availableFuels = fuel
    ? [fuel as FuelType]
    : registry.availableFuels(
        rom as RomVersion || undefined,
        turbo as TurboTypeId || undefined
      )

  const availableStages = registry.availableStages(
    rom as RomVersion || undefined,
    turbo as TurboTypeId || undefined,
    fuel as FuelType || undefined
  )

  const selectionComplete = rom && turbo && fuel && stage

  return (
    <div>
      {/* Step 1 — ROM */}
      <div style={CARD}>
        <p style={SECTION_TITLE}>Step 1 — Select ROM / Software Version</p>
        <RomSelector value={rom} onChange={setRom} />
      </div>

      {/* Step 2 — Turbo Type */}
      {rom && (
        <div style={CARD}>
          <p style={SECTION_TITLE}>Step 2 — Select Turbo Type</p>
          <TurboTypeSelector
            value={turbo}
            onChange={setTurbo}
            availableIds={availableTurbo}
          />
        </div>
      )}

      {/* Step 3 — Fuel */}
      {rom && turbo && (
        <div style={CARD}>
          <p style={SECTION_TITLE}>Step 3 — Select Fuel</p>
          <FuelSelector value={fuel} onChange={setFuel} availableIds={availableFuels} />
        </div>
      )}

      {/* Step 4 — Stage */}
      {rom && turbo && fuel && (
        <div style={CARD}>
          <p style={SECTION_TITLE}>Step 4 — Select Tune Stage</p>
          <StageSelector value={stage} onChange={setStage} availableIds={availableStages} />
        </div>
      )}

      {/* Results */}
      {selectionComplete && (
        <div>
          {matches.length === 0 ? (
            <div
              style={{
                padding: '1.5rem',
                background: '#1f0000',
                border: '1px solid #7f1d1d',
                borderRadius: '0.75rem',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#f87171', fontWeight: 600, margin: '0 0 0.5rem' }}>
                No matching tune file found
              </p>
              <p style={{ color: '#fca5a5', fontSize: '0.84rem', margin: 0 }}>
                The combination of {rom} / {turbo} / {fuel} / {stage} is not currently registered.
                Contact Synergy for availability.
              </p>
            </div>
          ) : (
            <div>
              <p style={SECTION_TITLE}>
                {matches.length} matching package{matches.length !== 1 ? 's' : ''} found
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {matches.map((f) => (
                  <PackageCard key={f.id} tuneFile={f} showSelectLink />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reset */}
      {(rom || turbo || fuel || stage) && (
        <button
          onClick={() => { setRom(''); setTurbo(''); setFuel(''); setStage('') }}
          style={{
            marginTop: '1.25rem',
            padding: '0.4rem 0.9rem',
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '0.4rem',
            color: '#555',
            cursor: 'pointer',
            fontSize: '0.82rem',
          }}
        >
          ↺ Reset Selection
        </button>
      )}
    </div>
  )
}
