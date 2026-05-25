'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

// ─── N54 Tune Program v1 ───────────────────────────────────────────────────────
// This app is NOT a flashing tool.
// It does NOT connect to the car, flash the DME, or perform RSA bypass.
// It generates a BIN file that the customer flashes using MHD or N54 Quickflash.
// Real patch application is not implemented yet — v1 is frontend scaffolding only.
// ─────────────────────────────────────────────────────────────────────────────

const VALID_FILE_SIZE = 2_097_152 // All N54 ROMs = exactly 2 MB (MSD80/MSD81)

// ─── ROM Families ─────────────────────────────────────────────────────────────
const ROM_FAMILIES = [
  {
    id: 'I8A0S',
    label: 'I8A0S',
    desc: 'Most common — 6-speed MT 135i, 335i, Z4 35i, 1M (2007–2010). MSD80.',
    badge: 'Most Common',
    badgeColor: '#16a34a',
    stages: ['stage1', 'stage1plus', 'stage2', 'stage2plus', 'stage3', 'hybrid-base'],
  },
  {
    id: 'IJE0S',
    label: 'IJE0S',
    desc: 'Automatic transmission (ZF 6HP) — 135i, 335i, 535i AT (2007–2010). MSD80.',
    badge: 'AT Cars',
    badgeColor: '#2563eb',
    stages: ['stage1', 'stage1plus', 'stage2', 'stage2plus', 'stage3', 'hybrid-base'],
  },
  {
    id: 'IKM0S',
    label: 'IKM0S',
    desc: 'Less common ROM — select regional/late-production N54 cars. Confirm in MHD first.',
    badge: 'Verify First',
    badgeColor: '#d97706',
    stages: ['stage1', 'stage1plus', 'stage2', 'stage2plus'],
  },
]

// ─── Stages ───────────────────────────────────────────────────────────────────
const STAGES = [
  { value: 'stage1',      label: 'Stage 1',                fuels: ['91', '93', 'E30'] },
  { value: 'stage1plus',  label: 'Stage 1+',               fuels: ['91', '93', 'E30', 'E40'] },
  { value: 'stage2',      label: 'Stage 2',                fuels: ['91', '93', 'E30', 'E40'] },
  { value: 'stage2plus',  label: 'Stage 2+',               fuels: ['91', '93', 'E30', 'E40', 'E50'] },
  { value: 'stage3',      label: 'Stage 3',                fuels: ['91', '93', 'E30', 'E40', 'E50'] },
  { value: 'hybrid-base', label: 'Hybrid Turbo Base Tune', fuels: ['E30', 'E40', 'E50'] },
]

// ─── Fuels — Active ────────────────────────────────────────────────────────────
const ACTIVE_FUELS = [
  { value: '91',  label: '91 oct', color: '#f59e0b' },
  { value: '93',  label: '93 oct', color: '#10b981' },
  { value: 'E30', label: 'E30',    color: '#3b82f6' },
  { value: 'E40', label: 'E40',    color: '#8b5cf6' },
  { value: 'E50', label: 'E50',    color: '#ec4899' },
]

// ─── Fuels — Future (source files detected, not yet selectable) ───────────────
const FUTURE_FUELS = [
  { value: '95',    label: '95 oct', note: 'EU/intl markets — source files detected' },
  { value: 'ACN91', label: 'ACN91',  note: 'ACN-spec 91 — source files detected' },
  { value: 'CAD94', label: 'CAD94',  note: 'Canadian 94 oct — source files detected' },
]

type FileState =
  | { status: 'none' }
  | { status: 'valid'; name: string; size: number; buffer: ArrayBuffer }
  | { status: 'invalid'; name: string; size: number; reason: string }

function formatBytes(n: number) {
  return n.toLocaleString() + ' bytes'
}

/* ── Style tokens ─────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '0.75rem',
  padding: '1.5rem',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#555',
  fontWeight: 600,
  marginBottom: '0.75rem',
}

const pillBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem 1.1rem',
  borderRadius: '0.5rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'background 0.12s, border-color 0.12s, color 0.12s',
  userSelect: 'none',
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function TuneProgram() {
  const [romFamily, setRomFamily]   = useState('')
  const [stage, setStage]           = useState('')
  const [fuel, setFuel]             = useState('')
  const [fileState, setFileState]   = useState<FileState>({ status: 'none' })
  const [dragOver, setDragOver]     = useState(false)
  const [generated, setGenerated]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── ROM family change → reset downstream ────────────────────────────
  function handleRomChange(val: string) {
    setRomFamily(val)
    const rom = ROM_FAMILIES.find((r) => r.id === val)
    // If current stage isn't supported by this ROM, reset stage and fuel
    if (stage && rom && !rom.stages.includes(stage)) {
      setStage('')
      setFuel('')
    }
    setGenerated(false)
  }

  // ── Stage change → reset fuel if no longer in stage's fuel list ──────
  function handleStageChange(val: string) {
    setStage(val)
    const s = STAGES.find((st) => st.value === val)
    if (fuel && s && !s.fuels.includes(fuel)) {
      setFuel('')
    }
    setGenerated(false)
  }

  // ── File upload ──────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      if (file.size === VALID_FILE_SIZE) {
        setFileState({ status: 'valid', name: file.name, size: file.size, buffer })
      } else {
        setFileState({
          status: 'invalid',
          name: file.name,
          size: file.size,
          reason: `Expected exactly ${VALID_FILE_SIZE.toLocaleString()} bytes. Got ${formatBytes(file.size)}.`,
        })
      }
    }
    reader.readAsArrayBuffer(file)
    setGenerated(false)
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── Derived lists ────────────────────────────────────────────────────
  const selectedRom = ROM_FAMILIES.find((r) => r.id === romFamily)

  const availableStages = romFamily
    ? STAGES.filter((s) => selectedRom?.stages.includes(s.value))
    : []

  const stageFuels = stage
    ? (STAGES.find((s) => s.value === stage)?.fuels ?? [])
    : []

  const availableActiveFuels = stage
    ? ACTIVE_FUELS.filter((f) => stageFuels.includes(f.value))
    : []

  const isReady =
    romFamily !== '' && stage !== '' && fuel !== '' && fileState.status === 'valid'

  // ── Generate BIN ─────────────────────────────────────────────────────
  // v1: downloads the uploaded BIN as-is with a descriptive filename.
  // Real patch application (XDF/offset calibration from private sources)
  // will be implemented in v2 using patch-package JSON.
  // Private tune files stay in _private_tuning_sources/ (gitignored) —
  // NEVER served from public/ or committed to the repo.
  function handleGenerateBIN() {
    if (fileState.status !== 'valid') return

    const blob = new Blob([fileState.buffer], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const stageLabel = STAGES.find((s) => s.value === stage)?.label.replace(/\s+/g, '-') ?? stage
    const a = document.createElement('a')
    a.href = url
    a.download = `synergy-N54-${romFamily}-${stageLabel}-${fuel}.bin`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setGenerated(true)
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f0f0f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: '1.1rem',
            letterSpacing: '-0.02em',
            textDecoration: 'none',
            color: '#f0f0f0',
          }}
        >
          N54 Wiki
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/wiki" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>
            Wiki
          </Link>
          <Link
            href="/tune-program"
            style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}
          >
            Tune Program
          </Link>
          <a
            href="https://synergybmwtuning.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '0.3rem 0.75rem',
              borderRadius: '0.4rem',
              background: '#2563eb',
              color: '#fff',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Synergy Tuning
          </a>
        </div>
      </nav>

      {/* ── Page body ────────────────────────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3.5rem 2rem 5rem' }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#1a1a2e',
              border: '1px solid #2563eb44',
              borderRadius: '2rem',
              padding: '0.25rem 0.9rem',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#6699ff', fontWeight: 500 }}>
              Synergy BMW Tuning — Tune Program (v1 Beta)
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '0.75rem',
              lineHeight: 1.1,
            }}
          >
            N54 BIN Generator
          </h1>
          <p style={{ color: '#888', lineHeight: 1.65, maxWidth: '600px', marginBottom: '0.75rem' }}>
            Select your ROM family, stage, and fuel — then upload your stock BIN and download a
            correctly-named output file. Flash the generated BIN using MHD or N54 Quickflash.
          </p>
        </div>

        {/* ── Not-a-flasher notice ─────────────────────────────── */}
        <div
          style={{
            background: '#0d1525',
            border: '1px solid #1e3a8a55',
            borderRadius: '0.65rem',
            padding: '0.9rem 1.1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.65rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: '0.05rem', flexShrink: 0 }}>ℹ️</span>
          <div>
            <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.85rem', color: '#93c5fd' }}>
              This is a BIN generator — not a flashing tool
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6699ff', lineHeight: 1.55 }}>
              This app does not connect to your car, flash the DME, or perform RSA unlock or DME communication.
              It generates a BIN file that you flash externally using{' '}
              <strong style={{ color: '#93c5fd' }}>MHD Flasher</strong> or{' '}
              <strong style={{ color: '#93c5fd' }}>N54 Quickflash</strong>.
            </p>
          </div>
        </div>

        {/* ── Safety warning ───────────────────────────────────── */}
        <div
          style={{
            background: '#1a0f00',
            border: '1px solid #854d0e66',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1, marginTop: '0.05rem' }}>⚠️</span>
          <div>
            <p style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>
              Safety Warning — Read Before Flashing
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#d97706', lineHeight: 1.6 }}>
              Flashing an incorrect calibration can damage your engine, injectors, or fuel pump.
              Confirm your ROM version in MHD before selecting it here.{' '}
              <strong style={{ color: '#fbbf24' }}>
                Do not flash on a depleted battery — use a battery maintainer.
              </strong>{' '}
              This program generates a base calibration file for review by Synergy BMW Tuning.
              Final calibration depends on your logs, fuel quality, hardware, and tuner review.
            </p>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────
            Step 1 — ROM Family
        ──────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <p style={sectionTitle}>Step 1 — Select ROM Family</p>
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ROM_FAMILIES.map((rom) => {
              const active = romFamily === rom.id
              return (
                <button
                  key={rom.id}
                  onClick={() => handleRomChange(rom.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.8rem 0.9rem',
                    background: active ? '#0d1f3a' : '#0d0d0d',
                    border: `1px solid ${active ? '#2563eb' : '#1e1e1e'}`,
                    borderRadius: '0.55rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {/* Radio dot */}
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${active ? '#2563eb' : '#333'}`,
                      background: active ? '#2563eb' : 'transparent',
                      flexShrink: 0,
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {active && (
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: active ? '#93c5fd' : '#ccc', fontFamily: 'monospace' }}>
                        {rom.label}
                      </p>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '0.3rem',
                          background: `${rom.badgeColor}22`,
                          border: `1px solid ${rom.badgeColor}55`,
                          color: rom.badgeColor,
                          fontFamily: 'system-ui, sans-serif',
                        }}
                      >
                        {rom.badge}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>{rom.desc}</p>
                  </div>
                </button>
              )
            })}
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#333', fontStyle: 'italic' }}>
              Not sure which ROM you have? Check your MHD Flasher → Vehicle Info screen before selecting.
            </p>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────
            Step 2 — Stage
        ──────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: romFamily ? 1 : 0.35 }}>
          <p style={sectionTitle}>Step 2 — Select Stage</p>
          <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {romFamily ? (
              availableStages.map((s) => {
                const active = stage === s.value
                const isHybrid = s.value === 'hybrid-base'
                return (
                  <button
                    key={s.value}
                    onClick={() => handleStageChange(s.value)}
                    style={{
                      ...pillBase,
                      background: active
                        ? isHybrid ? '#3b1a6e' : '#1d3a6e'
                        : '#1a1a1a',
                      borderColor: active
                        ? isHybrid ? '#7c3aed' : '#2563eb'
                        : '#222',
                      color: active
                        ? isHybrid ? '#c4b5fd' : '#fff'
                        : '#bbb',
                    }}
                  >
                    {s.label}
                  </button>
                )
              })
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#444' }}>Select a ROM family first.</p>
            )}
            {romFamily && romFamily === 'IKM0S' && (
              <p style={{ width: '100%', margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#555', fontStyle: 'italic' }}>
                IKM0S: Stage 3 and Hybrid Base not yet available — no source files confirmed for those stages.
              </p>
            )}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────
            Step 3 — Fuel
        ──────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: stage ? 1 : 0.35 }}>
          <p style={sectionTitle}>Step 3 — Select Fuel</p>
          <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {/* Active fuels */}
            {stage ? (
              <>
                {availableActiveFuels.map((f) => {
                  const active = fuel === f.value
                  return (
                    <button
                      key={f.value}
                      onClick={() => setFuel(f.value)}
                      style={{
                        ...pillBase,
                        background: active ? `${f.color}22` : '#1a1a1a',
                        borderColor: active ? f.color : '#222',
                        color: active ? f.color : '#bbb',
                      }}
                    >
                      {f.label}
                    </button>
                  )
                })}

                {/* Future fuels — informational only, not selectable */}
                {FUTURE_FUELS.length > 0 && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #1e1e1e',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                      Coming soon:
                    </span>
                    {FUTURE_FUELS.map((f) => (
                      <div key={f.value} style={{ position: 'relative' }}>
                        <button
                          disabled
                          title={f.note}
                          style={{
                            ...pillBase,
                            background: '#141414',
                            borderColor: '#222',
                            color: '#383838',
                            cursor: 'not-allowed',
                            fontSize: '0.82rem',
                            padding: '0.35rem 0.8rem',
                          }}
                        >
                          {f.label}
                        </button>
                      </div>
                    ))}
                    <span style={{ fontSize: '0.72rem', color: '#3a3a3a', fontStyle: 'italic' }}>
                      Source files detected — will be enabled in a future update
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#444' }}>Select a stage first.</p>
            )}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────
            Step 4 — Upload Stock BIN
        ──────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: fuel ? 1 : 0.35 }}>
          <p style={sectionTitle}>
            Step 4 — Upload Stock{romFamily ? ` ${romFamily}` : ' N54'} BIN
          </p>
          <div
            role="button"
            tabIndex={0}
            aria-label="Click or drag a BIN file to upload"
            onClick={() => fuel && fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fuel && fileInputRef.current?.click()}
            onDragOver={(e) => { if (fuel) { e.preventDefault(); setDragOver(true) } }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              ...card,
              borderStyle: 'dashed',
              borderColor: dragOver
                ? '#2563eb'
                : fileState.status === 'valid'
                ? '#16a34a'
                : fileState.status === 'invalid'
                ? '#dc2626'
                : '#333',
              background: dragOver ? '#0d1a3a' : '#111',
              cursor: fuel ? 'pointer' : 'default',
              textAlign: 'center',
              padding: '2.5rem 2rem',
              transition: 'border-color 0.15s, background 0.15s',
              outline: 'none',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".bin"
              style={{ display: 'none' }}
              onChange={handleInputChange}
              disabled={!fuel}
            />
            {fileState.status === 'none' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>📂</div>
                <p style={{ fontWeight: 600, color: fuel ? '#ccc' : '#444', margin: '0 0 0.3rem' }}>
                  {fuel ? 'Click to browse or drag & drop your BIN file' : 'Select a fuel first'}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#555', margin: 0 }}>
                  {romFamily
                    ? `${romFamily} stock BIN — must be exactly 2,097,152 bytes (2 MB)`
                    : 'Stock N54 BIN — must be exactly 2,097,152 bytes (2 MB)'}
                </p>
              </>
            )}
            {fileState.status === 'valid' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>✅</div>
                <p style={{ fontWeight: 700, color: '#86efac', margin: '0 0 0.3rem' }}>{fileState.name}</p>
                <p style={{ fontSize: '0.82rem', color: '#4ade80', margin: 0 }}>
                  {formatBytes(fileState.size)} — valid N54 BIN size ✓
                </p>
              </>
            )}
            {fileState.status === 'invalid' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>❌</div>
                <p style={{ fontWeight: 700, color: '#fca5a5', margin: '0 0 0.3rem' }}>{fileState.name}</p>
                <p style={{ fontSize: '0.82rem', color: '#f87171', margin: '0 0 0.5rem' }}>
                  {fileState.reason}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>Click to try a different file</p>
              </>
            )}
          </div>

          {/* File metadata strip */}
          {fileState.status !== 'none' && (
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '0.75rem',
                padding: '0.6rem 1rem',
                background: '#0d0d0d',
                borderRadius: '0.5rem',
                border: '1px solid #1a1a1a',
                fontSize: '0.82rem',
                color: '#777',
                flexWrap: 'wrap',
              }}
            >
              <span>
                <span style={{ color: '#444' }}>File: </span>
                <span style={{ color: '#ddd', fontWeight: 500 }}>{fileState.name}</span>
              </span>
              <span>
                <span style={{ color: '#444' }}>Size: </span>
                <span style={{ color: fileState.status === 'valid' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                  {formatBytes(fileState.size)}
                </span>
              </span>
              <span>
                <span style={{ color: '#444' }}>ROM: </span>
                <span style={{ color: fileState.status === 'valid' ? '#93c5fd' : '#f87171', fontWeight: 600, fontFamily: 'monospace' }}>
                  {fileState.status === 'valid'
                    ? romFamily
                      ? `${romFamily} (size confirmed)`
                      : 'Size confirmed'
                    : 'Invalid'}
                </span>
              </span>
            </div>
          )}
        </section>

        {/* ── Generate BIN button ───────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <button
            disabled={!isReady}
            onClick={handleGenerateBIN}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: generated ? '#14532d' : isReady ? '#2563eb' : '#1a1a1a',
              color: generated ? '#4ade80' : isReady ? '#fff' : '#555',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0.8rem 2rem',
              borderRadius: '0.5rem',
              border: `1px solid ${generated ? '#16a34a' : isReady ? '#2563eb' : '#2a2a2a'}`,
              cursor: isReady ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <span>{generated ? '✅' : isReady ? '⚙️' : '🔒'}</span>
            {generated
              ? 'BIN Downloaded — Flash with MHD or Quickflash'
              : 'Generate BIN'}
            {isReady && !generated && (
              <span style={{ opacity: 0.75, fontSize: '0.85rem' }}>
                — {romFamily} / {STAGES.find((s) => s.value === stage)?.label} / {fuel}
              </span>
            )}
          </button>

          {!isReady && (
            <p style={{ fontSize: '0.8rem', color: '#444', marginTop: '0.5rem' }}>
              {!romFamily
                ? 'Select a ROM family to begin.'
                : !stage
                ? 'Select a stage to continue.'
                : !fuel
                ? 'Select a fuel type to continue.'
                : fileState.status === 'none'
                ? `Upload your ${romFamily} stock BIN to continue.`
                : 'Replace with a valid N54 BIN (exactly 2,097,152 bytes).'}
            </p>
          )}
        </section>

        {/* ── External flasher warning ─────────────────────────── */}
        {generated && (
          <div
            style={{
              background: '#0f1f0f',
              border: '1px solid #16a34a55',
              borderRadius: '0.75rem',
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
            }}
          >
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.95rem', color: '#4ade80' }}>
              🔌 Flash with Your External Tool
            </p>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: '#86efac', lineHeight: 1.65 }}>
              Generated file must be flashed with MHD, Quickflash, or another supported MSD80/MSD81 flashing tool.
              This app does not flash your car — it only prepared the BIN file.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                ['MHD Flasher', 'Android / iOS app — flash via OBD-II cable over USB', 'https://mhd-flasher.com'],
                ['N54 Quickflash', 'Standalone flashing tool for MSD80/MSD81 DME', ''],
              ].map(([name, desc, link]) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.8rem',
                    background: '#111',
                    borderRadius: '0.5rem',
                    border: '1px solid #1e1e1e',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>🔧</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.1rem', fontWeight: 600, fontSize: '0.85rem', color: '#e0e0e0' }}>{name}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>{desc}</p>
                  </div>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.78rem', color: '#2563eb', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      Visit →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── v1 Scope & Roadmap ────────────────────────────────── */}
        <div
          style={{
            background: '#0d1117',
            border: '1px solid #21262d',
            borderRadius: '0.75rem',
            padding: '1.5rem',
          }}
        >
          <p
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#444',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            v1 Scope & Roadmap
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              {
                icon: '✅',
                title: 'v1 — ROM Family + BIN Upload & Validation',
                body: 'Select your ROM family (I8A0S / IJE0S / IKM0S), stage, and fuel. Upload your stock BIN (2,097,152 bytes), and download a correctly named output file for flashing with MHD or Quickflash.',
              },
              {
                icon: '🔜',
                title: 'v2 — ROM Fingerprint Verification',
                body: 'Read the first 512 bytes of the uploaded BIN to verify the ROM signature matches the selected family (I8A0S, IJE0S, IKM0S). Blocks wrong-ROM uploads before any processing.',
              },
              {
                icon: '🔜',
                title: 'v3 — Patch-Package Application',
                body: 'Apply Synergy calibration offset packages (stage + fuel-specific JSON patches built from private XDF/BIN sources) to the uploaded BIN client-side. Private source files stay in _private_tuning_sources/ — never public.',
              },
              {
                icon: '🔜',
                title: 'v4 — Checksum Recalculation',
                body: 'Recalculate the DME checksum on the patched BIN before export. A mismatch blocks delivery — no corrupted or partial BIN reaches the customer.',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  padding: '0.9rem 1rem',
                  background: '#111',
                  border: '1px solid #1e1e1e',
                  borderRadius: '0.6rem',
                }}
              >
                <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: '0.1rem' }}>{item.icon}</span>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.88rem', color: '#ddd' }}>
                    {item.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: 1.6 }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#333', fontStyle: 'italic' }}>
            Private tune source files (BIN/XDF) stay in{' '}
            <code style={{ fontFamily: 'monospace', color: '#444' }}>_private_tuning_sources/</code> —
            gitignored, never served from public/. 95 oct, ACN91, and CAD94 source files detected — coming in future update.
          </p>
        </div>

        {/* ── Footer CTA ───────────────────────────────────────── */}
        <div
          style={{
            marginTop: '2.5rem',
            background: 'linear-gradient(135deg, #0f1f4a 0%, #1a1a2e 100%)',
            border: '1px solid #2563eb44',
            borderRadius: '1rem',
            padding: '1.75rem 2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', margin: '0 0 0.4rem' }}>
            Questions about your ROM, build, or stage selection?
          </p>
          <p style={{ fontSize: '0.9rem', color: '#c0cfff', lineHeight: 1.6, margin: '0 0 1.1rem' }}>
            The Synergy team reviews every calibration request before final delivery.{' '}
            <strong style={{ color: '#fff' }}>Reach out before you flash.</strong>
          </p>
          <Link
            href="/contact"
            style={{
              display: 'inline-block',
              background: '#2563eb',
              color: '#fff',
              textDecoration: 'none',
              padding: '0.6rem 1.4rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Talk to Synergy →
          </Link>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: '#555', margin: 0 }}>
          © {new Date().getFullYear()} N54 Wiki — Powered by{' '}
          <a
            href="https://synergybmwtuning.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#6699ff', textDecoration: 'none', fontWeight: 600 }}
          >
            Synergy BMW Tuning
          </a>
          . For educational purposes — always consult a professional tuner.
        </p>
      </div>
    </div>
  )
}
