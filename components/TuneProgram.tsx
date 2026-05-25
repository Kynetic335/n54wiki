'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  verifyBin,
  formatBinSize,
  VALID_BIN_SIZE,
} from '@/lib/tune-program/binVerifier'
import type { BinVerificationResult, HashMatchStatus } from '@/lib/tune-program/binVerifier'

// ─── N54 Tune Program v1 ───────────────────────────────────────────────────────
// This app is NOT a flashing tool.
// It does NOT connect to the car, flash the DME, or perform RSA bypass.
// It generates a BIN file that the customer flashes using MHD or N54 Quickflash.
//
// v1 output: uploaded BIN re-downloaded as-is with PLACEHOLDER_NOT_FLASHABLE label.
// No patch has been applied. Real calibration patching arrives in v3.
// ─────────────────────────────────────────────────────────────────────────────

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
  {
    id: 'INA0S',
    label: 'INA0S',
    desc: 'Later N54 revision — 2010+ 135i, 335i, some 535i. MSD80. Confirm in MHD first.',
    badge: 'Later Rev',
    badgeColor: '#7c3aed',
    stages: ['stage1', 'stage1plus', 'stage2', 'stage2plus', 'stage3', 'hybrid-base'],
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

// ─── Fuels ────────────────────────────────────────────────────────────────────
const ACTIVE_FUELS = [
  { value: '91',  label: '91 oct', color: '#f59e0b' },
  { value: '93',  label: '93 oct', color: '#10b981' },
  { value: 'E30', label: 'E30',    color: '#3b82f6' },
  { value: 'E40', label: 'E40',    color: '#8b5cf6' },
  { value: 'E50', label: 'E50',    color: '#ec4899' },
]

const FUTURE_FUELS = [
  { value: '95',    label: '95 oct', note: 'EU/intl markets — source files detected' },
  { value: 'ACN91', label: 'ACN91',  note: 'ACN-spec 91 — source files detected' },
  { value: 'CAD94', label: 'CAD94',  note: 'Canadian 94 oct — source files detected' },
]

// ─── Upload state ─────────────────────────────────────────────────────────────
type UploadState =
  | { status: 'none' }
  | { status: 'reading'; fileName: string }
  | { status: 'done'; result: BinVerificationResult; buffer: ArrayBuffer }

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
  const [romFamily, setRomFamily]     = useState('')
  const [stage, setStage]             = useState('')
  const [fuel, setFuel]               = useState('')
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'none' })
  const [dragOver, setDragOver]       = useState(false)
  const [generated, setGenerated]     = useState(false)
  const [hashCopied, setHashCopied]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── ROM family change → reset downstream ────────────────────────────
  function handleRomChange(val: string) {
    setRomFamily(val)
    const rom = ROM_FAMILIES.find((r) => r.id === val)
    if (stage && rom && !rom.stages.includes(stage)) {
      setStage('')
      setFuel('')
    }
    setGenerated(false)
    // Re-verify with new ROM if file already loaded
    if (uploadState.status === 'done') {
      setUploadState({ status: 'none' })
    }
  }

  // ── Stage change → reset fuel ────────────────────────────────────────
  function handleStageChange(val: string) {
    setStage(val)
    const s = STAGES.find((st) => st.value === val)
    if (fuel && s && !s.fuels.includes(fuel)) setFuel('')
    setGenerated(false)
  }

  // ── File handler — reads ArrayBuffer then runs async verifyBin ───────
  const handleFile = useCallback(async (file: File) => {
    setGenerated(false)
    setUploadState({ status: 'reading', fileName: file.name })

    const reader = new FileReader()
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer
      try {
        const result = await verifyBin(file, buffer, romFamily)
        setUploadState({ status: 'done', result, buffer })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown verification error'
        // Synthesise a failed result so UI still shows something useful
        setUploadState({
          status: 'done',
          result: {
            fileName: file.name,
            fileSize: file.size,
            extension: file.name.slice(file.name.lastIndexOf('.')).toLowerCase(),
            extensionStatus: 'rejected',
            sha256: '',
            selectedRom: romFamily,
            sizeValid: false,
            hashKnown: false,
            hashMatchStatus: 'invalid',
            fingerprintStatus: 'unavailable',
            isSafeToContinue: false,
            warnings: [],
            errors: [msg],
          },
          buffer,
        })
      }
    }
    reader.onerror = () => {
      setUploadState({
        status: 'done',
        result: {
          fileName: file.name,
          fileSize: file.size,
          extension: '',
          extensionStatus: 'rejected',
          sha256: '',
          selectedRom: romFamily,
          sizeValid: false,
          hashKnown: false,
          hashMatchStatus: 'invalid',
          fingerprintStatus: 'unavailable',
          isSafeToContinue: false,
          warnings: [],
          errors: ['FileReader failed — the file could not be read.'],
        },
        buffer: new ArrayBuffer(0),
      })
    }
    reader.readAsArrayBuffer(file)
  }, [romFamily])

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

  function handleCopyHash() {
    if (uploadState.status === 'done' && uploadState.result.sha256) {
      navigator.clipboard.writeText(uploadState.result.sha256).then(() => {
        setHashCopied(true)
        setTimeout(() => setHashCopied(false), 1800)
      })
    }
  }

  // ── Derived lists ────────────────────────────────────────────────────
  const selectedRom = ROM_FAMILIES.find((r) => r.id === romFamily)
  const availableStages = romFamily ? STAGES.filter((s) => selectedRom?.stages.includes(s.value)) : []
  const stageFuels = stage ? (STAGES.find((s) => s.value === stage)?.fuels ?? []) : []
  const availableActiveFuels = stage ? ACTIVE_FUELS.filter((f) => stageFuels.includes(f.value)) : []

  const verResult = uploadState.status === 'done' ? uploadState.result : null

  // ── isReady: all 4 selections + valid file ───────────────────────────
  const isReady =
    romFamily !== '' &&
    stage !== '' &&
    fuel !== '' &&
    uploadState.status === 'done' &&
    uploadState.result.isSafeToContinue

  // ── Generate BIN ─────────────────────────────────────────────────────
  function handleGenerateBIN() {
    if (uploadState.status !== 'done' || !isReady) return
    const buffer = uploadState.buffer

    const blob = new Blob([buffer], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const stageLabel = STAGES.find((s) => s.value === stage)?.label.replace(/\s+/g, '-') ?? stage
    const a = document.createElement('a')
    a.href = url
    a.download = `PLACEHOLDER_NOT_FLASHABLE_synergy-N54-${romFamily}-${stageLabel}-${fuel}.bin`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setGenerated(true)
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', textDecoration: 'none', color: '#f0f0f0' }}>
          N54 Wiki
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/wiki" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>Wiki</Link>
          <Link href="/tune-program" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Tune Program</Link>
          <a href="https://synergybmwtuning.com" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '0.4rem', background: '#2563eb', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Synergy Tuning
          </a>
        </div>
      </nav>

      {/* ── Page body ────────────────────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3.5rem 2rem 5rem' }}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', background: '#1a1a2e', border: '1px solid #2563eb44', borderRadius: '2rem', padding: '0.25rem 0.9rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#6699ff', fontWeight: 500 }}>
              Synergy BMW Tuning — Tune Program (v1 Beta)
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem', lineHeight: 1.1 }}>
            N54 BIN Generator
          </h1>
          <p style={{ color: '#888', lineHeight: 1.65, maxWidth: '600px', marginBottom: '0.75rem' }}>
            Select your ROM family, stage, and fuel — then upload and verify your stock BIN.
            The app checks file structure only. It does not yet confirm stock calibration bytes or apply tune patches.
          </p>
        </div>

        {/* ── Not-a-flasher notice ──────────────────────────── */}
        <div style={{ background: '#0d1525', border: '1px solid #1e3a8a55', borderRadius: '0.65rem', padding: '0.9rem 1.1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: '0.05rem', flexShrink: 0 }}>ℹ️</span>
          <div>
            <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.85rem', color: '#93c5fd' }}>
              This is a BIN generator — not a flashing tool
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6699ff', lineHeight: 1.55 }}>
              This app does not connect to your car, flash the DME, or perform RSA unlock.
              The generated BIN must be flashed externally using{' '}
              <strong style={{ color: '#93c5fd' }}>MHD Flasher</strong> or{' '}
              <strong style={{ color: '#93c5fd' }}>N54 Quickflash</strong>.
            </p>
          </div>
        </div>

        {/* ── Safety warning ────────────────────────────────── */}
        <div style={{ background: '#1a0f00', border: '1px solid #854d0e66', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.2rem', lineHeight: 1, marginTop: '0.05rem' }}>⚠️</span>
          <div>
            <p style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>
              Safety Warning — Read Before Flashing
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#d97706', lineHeight: 1.6 }}>
              Flashing an incorrect calibration can damage your engine, injectors, or fuel pump.
              Confirm your ROM version in MHD before selecting it here.{' '}
              <strong style={{ color: '#fbbf24' }}>Do not flash on a depleted battery — use a battery maintainer.</strong>{' '}
              This program generates a base calibration file. Final calibration depends on your
              logs, fuel quality, hardware, and tuner review.
            </p>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────
            Step 1 — ROM Family
        ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <p style={sectionTitle}>Step 1 — Select ROM Family</p>
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ROM_FAMILIES.map((rom) => {
              const active = romFamily === rom.id
              return (
                <button key={rom.id} onClick={() => handleRomChange(rom.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.8rem 0.9rem', background: active ? '#0d1f3a' : '#0d0d0d', border: `1px solid ${active ? '#2563eb' : '#1e1e1e'}`, borderRadius: '0.55rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${active ? '#2563eb' : '#333'}`, background: active ? '#2563eb' : 'transparent', flexShrink: 0, marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {active && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: active ? '#93c5fd' : '#ccc', fontFamily: 'monospace' }}>
                        {rom.label}
                      </p>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '0.3rem', background: `${rom.badgeColor}22`, border: `1px solid ${rom.badgeColor}55`, color: rom.badgeColor, fontFamily: 'system-ui, sans-serif' }}>
                        {rom.badge}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>{rom.desc}</p>
                  </div>
                </button>
              )
            })}
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#333', fontStyle: 'italic' }}>
              Not sure? Check MHD Flasher → Vehicle Info screen before selecting.
            </p>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────
            Step 2 — Stage
        ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: romFamily ? 1 : 0.35 }}>
          <p style={sectionTitle}>Step 2 — Select Stage</p>
          <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {romFamily ? (
              availableStages.map((s) => {
                const active = stage === s.value
                const isHybrid = s.value === 'hybrid-base'
                return (
                  <button key={s.value} onClick={() => handleStageChange(s.value)}
                    style={{ ...pillBase, background: active ? (isHybrid ? '#3b1a6e' : '#1d3a6e') : '#1a1a1a', borderColor: active ? (isHybrid ? '#7c3aed' : '#2563eb') : '#222', color: active ? (isHybrid ? '#c4b5fd' : '#fff') : '#bbb' }}>
                    {s.label}
                  </button>
                )
              })
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#444' }}>Select a ROM family first.</p>
            )}
            {romFamily === 'IKM0S' && (
              <p style={{ width: '100%', margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#555', fontStyle: 'italic' }}>
                IKM0S: Stage 3 and Hybrid Base not yet available — no source files confirmed for those stages.
              </p>
            )}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────
            Step 3 — Fuel
        ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: stage ? 1 : 0.35 }}>
          <p style={sectionTitle}>Step 3 — Select Fuel</p>
          <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {stage ? (
              <>
                {availableActiveFuels.map((f) => {
                  const active = fuel === f.value
                  return (
                    <button key={f.value} onClick={() => setFuel(f.value)}
                      style={{ ...pillBase, background: active ? `${f.color}22` : '#1a1a1a', borderColor: active ? f.color : '#222', color: active ? f.color : '#bbb' }}>
                      {f.label}
                    </button>
                  )
                })}
                <div style={{ width: '100%', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #1e1e1e', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Coming soon:</span>
                  {FUTURE_FUELS.map((f) => (
                    <button key={f.value} disabled title={f.note}
                      style={{ ...pillBase, background: '#141414', borderColor: '#222', color: '#383838', cursor: 'not-allowed', fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}>
                      {f.label}
                    </button>
                  ))}
                  <span style={{ fontSize: '0.72rem', color: '#3a3a3a', fontStyle: 'italic' }}>Source files detected — future update</span>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#444' }}>Select a stage first.</p>
            )}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────
            Step 4 — Upload & Verify BIN
        ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: fuel ? 1 : 0.35 }}>
          <p style={sectionTitle}>
            Step 4 — Upload &amp; Verify{romFamily ? ` ${romFamily}` : ' N54'} Stock BIN
          </p>

          {/* Drop zone */}
          <div
            role="button" tabIndex={0}
            aria-label="Click or drag a BIN file to upload"
            onClick={() => fuel && fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fuel && fileInputRef.current?.click()}
            onDragOver={(e) => { if (fuel) { e.preventDefault(); setDragOver(true) } }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              ...card,
              borderStyle: 'dashed',
              borderColor: dragOver ? '#2563eb'
                : uploadState.status === 'reading' ? '#444'
                : verResult?.isSafeToContinue ? '#16a34a'
                : verResult && !verResult.isSafeToContinue ? '#dc2626'
                : '#333',
              background: dragOver ? '#0d1a3a' : '#111',
              cursor: fuel ? 'pointer' : 'default',
              textAlign: 'center',
              padding: '2.5rem 2rem',
              transition: 'border-color 0.15s, background 0.15s',
              outline: 'none',
            }}
          >
            <input ref={fileInputRef} type="file" accept=".bin,.ori,.org" style={{ display: 'none' }} onChange={handleInputChange} disabled={!fuel} />

            {uploadState.status === 'none' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>📂</div>
                <p style={{ fontWeight: 600, color: fuel ? '#ccc' : '#444', margin: '0 0 0.3rem' }}>
                  {fuel ? 'Click to browse or drag & drop your BIN file' : 'Select a fuel first'}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#555', margin: 0 }}>
                  {romFamily
                    ? `${romFamily} stock BIN — exactly ${VALID_BIN_SIZE.toLocaleString()} bytes (0x200000)`
                    : `Stock N54 BIN — exactly ${VALID_BIN_SIZE.toLocaleString()} bytes (0x200000)`}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#3a3a3a', margin: '0.4rem 0 0' }}>
                  Accepts: .bin (preferred) · .ori · .org
                </p>
              </>
            )}

            {uploadState.status === 'reading' && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>⏳</div>
                <p style={{ fontWeight: 600, color: '#888', margin: '0 0 0.3rem' }}>Reading file…</p>
                <p style={{ fontSize: '0.82rem', color: '#555', margin: 0 }}>
                  Computing SHA-256 and verifying file structure
                </p>
              </>
            )}

            {uploadState.status === 'done' && verResult && (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>
                  {verResult.isSafeToContinue ? '✅' : '❌'}
                </div>
                <p style={{ fontWeight: 700, color: verResult.isSafeToContinue ? '#86efac' : '#fca5a5', margin: '0 0 0.25rem' }}>
                  {verResult.fileName}
                </p>
                <p style={{ fontSize: '0.82rem', color: verResult.isSafeToContinue ? '#4ade80' : '#f87171', margin: 0 }}>
                  {verResult.isSafeToContinue ? 'File verified — safe to continue' : 'Verification failed — see details below'}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#555', margin: '0.35rem 0 0' }}>
                  Click to replace with a different file
                </p>
              </>
            )}
          </div>

          {/* ── Verification result card ──────────────────────── */}
          {uploadState.status === 'done' && verResult && (
            <div style={{ marginTop: '0.75rem', background: '#0d0d0d', border: `1px solid ${verResult.isSafeToContinue ? '#16a34a33' : '#dc262633'}`, borderRadius: '0.65rem', overflow: 'hidden' }}>

              {/* Header row */}
              <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#444' }}>
                  BIN Verification Report
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '0.3rem', background: verResult.isSafeToContinue ? '#14532d' : '#450a0a', border: `1px solid ${verResult.isSafeToContinue ? '#16a34a' : '#dc2626'}`, color: verResult.isSafeToContinue ? '#4ade80' : '#f87171' }}>
                  {verResult.isSafeToContinue ? '✓ Safe to continue' : '✗ Cannot continue'}
                </span>
              </div>

              {/* Check rows */}
              <div style={{ display: 'grid', gap: 0 }}>
                {/* File name */}
                <VerifyRow
                  label="File name"
                  value={verResult.fileName}
                  mono
                  badge={
                    verResult.extensionStatus === 'preferred' ? { text: verResult.extension, color: '#4ade80' } :
                    verResult.extensionStatus === 'allowed_with_warning' ? { text: `${verResult.extension} (warning)`, color: '#fbbf24' } :
                    { text: `${verResult.extension || 'no extension'} (rejected)`, color: '#f87171' }
                  }
                />

                {/* File size */}
                <VerifyRow
                  label="File size"
                  value={formatBinSize(verResult.fileSize)}
                  mono
                  status={verResult.sizeValid ? 'pass' : 'fail'}
                />

                {/* SHA-256 */}
                <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #161616', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', fontWeight: 600 }}>
                      SHA-256
                    </p>
                    {verResult.sha256 ? (
                      <p style={{ margin: 0, fontSize: '0.76rem', fontFamily: 'monospace', color: '#93c5fd', wordBreak: 'break-all', lineHeight: 1.5 }}>
                        {verResult.sha256}
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#f87171' }}>Hash computation failed</p>
                    )}
                  </div>
                  {verResult.sha256 && (
                    <button onClick={handleCopyHash}
                      style={{ flexShrink: 0, padding: '0.25rem 0.6rem', background: hashCopied ? '#14532d' : '#1a1a1a', border: `1px solid ${hashCopied ? '#16a34a' : '#2a2a2a'}`, borderRadius: '0.35rem', cursor: 'pointer', fontSize: '0.72rem', color: hashCopied ? '#4ade80' : '#666', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                      {hashCopied ? '✓ Copied' : 'Copy'}
                    </button>
                  )}
                </div>

                {/* ROM selection */}
                <VerifyRow
                  label="ROM selection"
                  value={verResult.selectedRom || '(none selected)'}
                  mono={!!verResult.selectedRom}
                />

                {/* Size check */}
                <VerifyRow
                  label="Size check"
                  value={verResult.sizeValid
                    ? `${VALID_BIN_SIZE.toLocaleString()} bytes — ✓ valid MSD80/MSD81 BIN size`
                    : `${verResult.fileSize.toLocaleString()} bytes — ✗ expected ${VALID_BIN_SIZE.toLocaleString()} bytes`}
                  status={verResult.sizeValid ? 'pass' : 'fail'}
                />

                {/* Fingerprint status */}
                <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #161616', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.15rem', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', fontWeight: 600 }}>
                      ROM Fingerprint
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', lineHeight: 1.5 }}>
                      {verResult.fingerprintStatus === 'unavailable' &&
                        'Not available in v1 — byte offset signatures not yet mapped from XDF. Will verify ROM identifier bytes in v2.'}
                      {verResult.fingerprintStatus === 'pass' && 'ROM byte signature matched ✓'}
                      {verResult.fingerprintStatus === 'fail' && 'ROM byte signature did NOT match — wrong ROM or modified file'}
                      {verResult.fingerprintStatus === 'pending' && 'Checking…'}
                    </p>
                  </div>
                  <FingerprintBadge status={verResult.fingerprintStatus} />
                </div>

                {/* Hash match status */}
                <div style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 0.15rem', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', fontWeight: 600 }}>
                      Stock BIN match
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', lineHeight: 1.5 }}>
                      {verResult.hashMatchStatus === 'known-stock' &&
                        `SHA-256 matches verified stock hash for ${verResult.selectedRom}. Confirmed: unmodified original BIN.`}
                      {verResult.hashMatchStatus === 'unknown-2mb' &&
                        'File size is valid (2 MB) but SHA-256 is not in the known-stock database. This may be a modified, tuned, or unlisted stock BIN. Hash database is still being built — proceed with care.'}
                      {verResult.hashMatchStatus === 'rom-mismatch' &&
                        `SHA-256 matches the known stock hash for ${verResult.hashMatchedRom ?? 'a different ROM'}, not ${verResult.selectedRom}. Verify your ROM selection in MHD.`}
                      {verResult.hashMatchStatus === 'invalid' &&
                        'Hash check skipped — file did not pass size or extension validation.'}
                    </p>
                  </div>
                  <HashMatchBadge status={verResult.hashMatchStatus} />
                </div>
              </div>

              {/* Warnings */}
              {verResult.warnings.length > 0 && (
                <div style={{ padding: '0.75rem 1rem', background: '#1a1200', borderTop: '1px solid #713f1266' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#854d0e', fontWeight: 600 }}>
                    ⚠️ Warnings
                  </p>
                  {verResult.warnings.map((w, i) => (
                    <p key={i} style={{ margin: i < verResult.warnings.length - 1 ? '0 0 0.35rem' : 0, fontSize: '0.8rem', color: '#d97706', lineHeight: 1.55 }}>
                      {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Errors */}
              {verResult.errors.length > 0 && (
                <div style={{ padding: '0.75rem 1rem', background: '#1a0000', borderTop: '1px solid #dc262633' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7f1d1d', fontWeight: 600 }}>
                    ✗ Errors — file cannot be used
                  </p>
                  {verResult.errors.map((err, i) => (
                    <p key={i} style={{ margin: i < verResult.errors.length - 1 ? '0 0 0.35rem' : 0, fontSize: '0.8rem', color: '#f87171', lineHeight: 1.55 }}>
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Verification scope note */}
              <div style={{ padding: '0.6rem 1rem', background: '#0a0a0a', borderTop: '1px solid #161616' }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#333', lineHeight: 1.5, fontStyle: 'italic' }}>
                  This app verifies file structure only right now.
                  It does not yet confirm stock calibration bytes or apply tune patches.
                  ROM byte fingerprinting arrives in v2.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── Placeholder safety warning ─────────────────────── */}
        <div style={{ background: '#1a0000', border: '2px solid #dc2626', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1, marginTop: '0.05rem', flexShrink: 0 }}>🚫</span>
          <div>
            <p style={{ margin: '0 0 0.3rem', fontWeight: 800, fontSize: '0.95rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              v1 Placeholder — Do Not Flash
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.6 }}>
              No real tune patch has been applied yet. The file generated below is your{' '}
              <strong style={{ color: '#f87171' }}>uploaded stock BIN re-downloaded as-is</strong> — no calibration changes have been made.{' '}
              <strong style={{ color: '#fef2f2' }}>Do not flash this file. It is labeled PLACEHOLDER_NOT_FLASHABLE and is for verification purposes only.</strong>{' '}
              Real patch application arrives in v3.
            </p>
          </div>
        </div>

        {/* ── Generate BIN button ────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <button disabled={!isReady} onClick={handleGenerateBIN}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: generated ? '#3b0a0a' : isReady ? '#2563eb' : '#1a1a1a', color: generated ? '#fca5a5' : isReady ? '#fff' : '#555', fontWeight: 700, fontSize: '1rem', padding: '0.8rem 2rem', borderRadius: '0.5rem', border: `1px solid ${generated ? '#dc2626' : isReady ? '#2563eb' : '#2a2a2a'}`, cursor: isReady ? 'pointer' : 'not-allowed', transition: 'all 0.15s', width: '100%', justifyContent: 'center' }}>
            <span>{generated ? '⚠️' : isReady ? '⚙️' : '🔒'}</span>
            {generated ? 'PLACEHOLDER Downloaded — Do NOT Flash' : 'Generate BIN'}
            {isReady && !generated && (
              <span style={{ opacity: 0.75, fontSize: '0.85rem' }}>
                — {romFamily} / {STAGES.find((s) => s.value === stage)?.label} / {fuel}
              </span>
            )}
          </button>

          {!isReady && (
            <p style={{ fontSize: '0.8rem', color: '#444', marginTop: '0.5rem' }}>
              {!romFamily ? 'Select a ROM family to begin.'
                : !stage ? 'Select a stage to continue.'
                : !fuel ? 'Select a fuel type to continue.'
                : uploadState.status === 'none' ? `Upload your ${romFamily} stock BIN to continue.`
                : uploadState.status === 'reading' ? 'Verifying file…'
                : 'Fix verification errors before continuing.'}
            </p>
          )}
        </section>

        {/* ── Post-generate notice (after placeholder download) ── */}
        {generated && (
          <div style={{ borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '2rem', border: '1px solid #dc262655' }}>
            {/* DO NOT FLASH banner */}
            <div style={{ background: '#2d0000', padding: '0.9rem 1.25rem', borderBottom: '1px solid #dc262633', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1, marginTop: '0.05rem', flexShrink: 0 }}>🚫</span>
              <div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 800, fontSize: '0.9rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  DO NOT FLASH THIS FILE — v1 placeholder only
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.55 }}>
                  The downloaded file (<code style={{ fontFamily: 'monospace', color: '#f87171', fontSize: '0.78rem' }}>PLACEHOLDER_NOT_FLASHABLE_…</code>) is your own stock BIN
                  returned as-is. No calibration changes were applied. Flashing it would only restore your stock tune.{' '}
                  <strong>Wait for the real calibration package from Synergy before flashing anything.</strong>
                </p>
              </div>
            </div>
            {/* Flasher info — for reference only */}
            <div style={{ background: '#111', padding: '1rem 1.25rem' }}>
              <p style={{ margin: '0 0 0.65rem', fontWeight: 700, fontSize: '0.88rem', color: '#888' }}>
                🔌 External flasher reference (for when you receive the real file)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  ['MHD Flasher', 'Android / iOS — flash via OBD-II over USB', 'https://mhd-flasher.com'],
                  ['N54 Quickflash', 'Standalone flashing tool for MSD80/MSD81 DME', ''],
                ].map(([name, desc, link]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: '#0d0d0d', borderRadius: '0.5rem', border: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: '0.9rem' }}>🔧</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 0.1rem', fontWeight: 600, fontSize: '0.85rem', color: '#888' }}>{name}</p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#444' }}>{desc}</p>
                    </div>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.78rem', color: '#555', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Visit →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── v1 Scope & Roadmap ──────────────────────────────── */}
        <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#444', fontWeight: 600, marginBottom: '1rem' }}>
            v1 Scope & Roadmap
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { icon: '✅', title: 'v1 — ROM Selection + BIN Upload & Verification', body: 'Select ROM family (I8A0S/IJE0S/IKM0S/INA0S), stage, and fuel. Upload stock BIN — app checks extension, file size (2,097,152 bytes / 0x200000), reads ArrayBuffer, computes SHA-256, and compares against known stock hashes. "Known stock BIN" confirmed for all four ROM originals. Detects ROM mismatches (e.g. uploading I8A0S BIN while IJE0S is selected). Output is a placeholder — no calibration patching applied in v1.' },
              { icon: '🔜', title: 'v2 — XDF Byte Fingerprinting', body: 'Read XDF-mapped byte offsets from uploaded BIN and compare against expected ROM identifier patterns. Confirms the ROM family from actual calibration bytes — not just file size and known-hash match. Enables fingerprint of BINs not in the known-stock database.' },
              { icon: '🔜', title: 'v3 — Patch-Package Application', body: 'Apply Synergy calibration offset packages (JSON patches built from private XDF/BIN diff analysis) client-side. Private source files stay in _private_tuning_sources/ — never public or committed.' },
              { icon: '🔜', title: 'v4 — Checksum Recalculation', body: 'Recalculate DME checksum on patched BIN before export. A mismatch blocks delivery — no partial or corrupt BIN reaches the customer.' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: '0.85rem', padding: '0.9rem 1rem', background: '#111', border: '1px solid #1e1e1e', borderRadius: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: '0.1rem' }}>{item.icon}</span>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.88rem', color: '#ddd' }}>{item.title}</p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: 1.6 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#333', fontStyle: 'italic' }}>
            Private tune source files (BIN/XDF) stay in{' '}
            <code style={{ fontFamily: 'monospace', color: '#444' }}>_private_tuning_sources/</code> — gitignored, never served.
            95 oct, ACN91, and CAD94 source files detected — coming in future update.
          </p>
        </div>

        {/* ── Footer CTA ─────────────────────────────────────── */}
        <div style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, #0f1f4a 0%, #1a1a2e 100%)', border: '1px solid #2563eb44', borderRadius: '1rem', padding: '1.75rem 2rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', margin: '0 0 0.4rem' }}>
            Questions about your ROM, build, or stage selection?
          </p>
          <p style={{ fontSize: '0.9rem', color: '#c0cfff', lineHeight: 1.6, margin: '0 0 1.1rem' }}>
            The Synergy team reviews every calibration request before final delivery.{' '}
            <strong style={{ color: '#fff' }}>Reach out before you flash.</strong>
          </p>
          <Link href="/contact" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '0.6rem 1.4rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            Talk to Synergy →
          </Link>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: '#555', margin: 0 }}>
          © {new Date().getFullYear()} N54 Wiki — Powered by{' '}
          <a href="https://synergybmwtuning.com" target="_blank" rel="noopener noreferrer"
            style={{ color: '#6699ff', textDecoration: 'none', fontWeight: 600 }}>
            Synergy BMW Tuning
          </a>
          . For educational purposes — always consult a professional tuner.
        </p>
      </div>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function VerifyRow({ label, value, mono = false, muted = false, status, badge }: {
  label: string
  value: string
  mono?: boolean
  muted?: boolean
  status?: 'pass' | 'fail'
  badge?: { text: string; color: string }
}) {
  const valueColor = muted ? '#3a3a3a'
    : status === 'pass' ? '#4ade80'
    : status === 'fail' ? '#f87171'
    : '#aaa'

  return (
    <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #161616', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
      <p style={{ margin: 0, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', fontWeight: 600, flexShrink: 0, paddingTop: '0.1rem', minWidth: '100px' }}>
        {label}
      </p>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: valueColor, fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right', wordBreak: 'break-all' }}>
          {status === 'pass' ? '✓ ' : status === 'fail' ? '✗ ' : ''}{value}
        </p>
        {badge && (
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '0.3rem', background: `${badge.color}18`, border: `1px solid ${badge.color}44`, color: badge.color, whiteSpace: 'nowrap' }}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  )
}

function FingerprintBadge({ status }: { status: 'pending' | 'pass' | 'fail' | 'unavailable' }) {
  const map = {
    pending:     { label: 'Checking…', bg: '#1a1a1a', border: '#333',    text: '#777' },
    pass:        { label: '✓ Match',   bg: '#052e16', border: '#16a34a', text: '#4ade80' },
    fail:        { label: '✗ Mismatch',bg: '#450a0a', border: '#dc2626', text: '#f87171' },
    unavailable: { label: 'v2 — N/A',  bg: '#1a1a1a', border: '#2a2a2a', text: '#555' },
  }
  const s = map[status]
  return (
    <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.35rem', background: s.bg, border: `1px solid ${s.border}`, color: s.text, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
      {s.label}
    </span>
  )
}

function HashMatchBadge({ status }: { status: HashMatchStatus }) {
  const map: Record<HashMatchStatus, { label: string; bg: string; border: string; text: string }> = {
    'known-stock':  { label: '✓ Known stock BIN',  bg: '#052e16', border: '#16a34a', text: '#4ade80' },
    'unknown-2mb':  { label: '? Unknown 2MB BIN',  bg: '#1a1400', border: '#854d0e', text: '#d97706' },
    'rom-mismatch': { label: '⚠ ROM mismatch',     bg: '#1a0a00', border: '#c2410c', text: '#fb923c' },
    'invalid':      { label: '✗ Invalid',           bg: '#450a0a', border: '#dc2626', text: '#f87171' },
  }
  const s = map[status]
  return (
    <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.35rem', background: s.bg, border: `1px solid ${s.border}`, color: s.text, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
      {s.label}
    </span>
  )
}
