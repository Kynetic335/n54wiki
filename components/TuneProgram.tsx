'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  verifyBin,
  formatBinSize,
  VALID_BIN_SIZE,
} from '@/lib/tune-program/binVerifier'
import type { BinVerificationResult, HashMatchStatus } from '@/lib/tune-program/binVerifier'
import { loadPackage, applyPatches } from '@/lib/tune-program/patchApplyEngine'
import { getPackageByFilter } from '@/data/tune-program/patch-packages/manifest'
import PatchReviewPanel from '@/components/tune-program/PatchReviewPanel'
import OwnerReviewDownload from '@/components/tune-program/OwnerReviewDownload'
import {
  runPreReviewGates,
  runPostReviewGates,
  stageToManifestId,
  fuelToManifestId,
} from '@/lib/tune-program/patchReviewGate'
import { resolveGenerateBin } from '@/lib/tune-program/generateBinGate'
import { getRomGateStatus, listReadyPackagesForRom } from '@/lib/tune-program/packageGates'
import type { AppSafePatchPackage, PatchApplyResult } from '@/types/tune-program'

// ─── N54 Tune Program — v3 Review Mode ────────────────────────────────────────
// This app is NOT a flashing tool.
// It does NOT connect to the car, flash the DME, or perform RSA bypass.
//
// v3 flow: ROM → Stage → Fuel → Upload BIN → Run Patch Review (in-memory).
//
// SAFETY CONTRACT (review mode):
//   outputMode:           'STANDARD_BIN_REVIEW_ONLY'
//   encryptionApproved:   false  — hard-coded, never changes
//   mhdEncryptionAllowed: false  — hard-coded, never changes
//   ownerReviewRequired:  true   — hard-coded
//
// The patched buffer is NEVER returned. No BIN download. No export.
// Real flashing requires MHD Flasher or N54 Quickflash (external tools).
// ─────────────────────────────────────────────────────────────────────────────

// ─── ROM Families ─────────────────────────────────────────────────────────────
// NOTE: the review-status badge is NOT hardcoded here. It is DERIVED from the
// real package manifest/gate data at render time via deriveRomStatus() so the
// label can never go stale relative to the published packages.
//
// heldVariantCount:    count of intentionally-unbuilt fuel variants (held/future)
//                      surfaced as the "/ N MISSING" part of a PARTIAL READY badge.
// statusNote:          accurate one-line availability note shown in Step 2.
// stages:              standard OTS stages with READY packages (N20 MAP stages auto-set by category)
// availableCategories: package categories with READY packages for this ROM
const ROM_FAMILIES = [
  {
    id: 'I8A0S',
    label: 'I8A0S',
    desc: 'Most common MSD80 — 135i, 335i, 535i, Z4 35i, 1M (2007–2010). Verify in MHD.',
    badge: 'Most Common',
    badgeColor: '#16a34a',
    heldVariantCount: 0,
    statusNote: '',
    // Standard OTS stages — hybrid-base is N20 MAP only (not a standard OTS stage)
    // Stage 1 (basic): no v12 source — starts at Stage 1+
    stages: ['stage1plus', 'stage2', 'stage3'],
    availableCategories: ['standard-ots', 'n20-map-stock-turbo', 'n20-map-hybrid-base'],
  },
  {
    id: 'IJE0S',
    label: 'IJE0S',
    desc: 'Common MSD81 — automatic (ZF 6HP) 135i, 335i, 535i (2007–2010). Verify in MHD.',
    badge: 'AT Cars',
    badgeColor: '#2563eb',
    heldVariantCount: 0,
    statusNote: 'READY — owner-accepted V90 packages. Review BIN only.',
    stages: ['stage1plus', 'stage2', 'stage3'],
    availableCategories: ['standard-ots', 'n20-map-stock-turbo', 'n20-map-hybrid-base'],
  },
  {
    id: 'IKM0S',
    label: 'IKM0S',
    desc: 'Less common MSD81 — select regional/late-production N54 cars. Confirm in MHD first.',
    badge: 'Verify First',
    badgeColor: '#d97706',
    // 95 + ACN91 across stage1/1+/2/3 = 8 intentionally-unbuilt fuel variants.
    heldVariantCount: 8,
    statusNote: 'PARTIAL READY — 16 v90-source packages available. Some 95/ACN91-CAD94 variants are unavailable.',
    // IKM0S has native Stage 1 packages (16 READY = stage1/1+/2/3 × 91/93/E30/E50).
    stages: ['stage1', 'stage1plus', 'stage2', 'stage3'],
    availableCategories: ['standard-ots'],
  },
  {
    id: 'INA0S',
    label: 'INA0S',
    desc: 'Later MSD81 — 2010+ 135i, 335i, some 535i. Verify in MHD.',
    badge: 'Later Rev',
    badgeColor: '#7c3aed',
    heldVariantCount: 0,
    statusNote: '',
    // v12: Standard OTS (stage1+/2/3 × 91/93/E50) + N20 MAP packages
    stages: ['stage1plus', 'stage2', 'stage3'],
    availableCategories: ['standard-ots', 'n20-map-stock-turbo', 'n20-map-hybrid-base'],
  },
]

// ─── Derived ROM review status (data-driven) ──────────────────────────────────
// Reads the real manifest/gate so the badge reflects published packages, not a
// stale hardcoded string. heldVariantCount turns a fully-READY ROM that still
// has intentionally-unbuilt fuel variants into a PARTIAL READY badge.
type RomReviewStatus = 'ready' | 'partial-ready' | 'needs-audit' | 'not-built'

function deriveRomStatus(
  romId: string,
  heldVariantCount = 0,
): { status: RomReviewStatus; label: string; readyCount: number } {
  const gate = getRomGateStatus(romId) // READY | NEEDS_AUDIT | NOT_BUILT
  const readyCount = listReadyPackagesForRom(romId).length
  if (gate === 'READY') {
    if (heldVariantCount > 0) {
      return {
        status: 'partial-ready',
        label: `${readyCount} READY / ${heldVariantCount} MISSING`,
        readyCount,
      }
    }
    return { status: 'ready', label: 'READY', readyCount }
  }
  if (gate === 'NEEDS_AUDIT') return { status: 'needs-audit', label: 'Needs Audit', readyCount }
  return { status: 'not-built', label: 'Not Built Yet', readyCount }
}

// Badge color tokens per derived status.
const ROM_STATUS_BADGE: Record<RomReviewStatus, { bg: string; border: string; color: string }> = {
  'ready':         { bg: '#052e16', border: '#16a34a55', color: '#4ade80' },
  'partial-ready': { bg: '#0a1f1a', border: '#0d948855', color: '#2dd4bf' },
  'needs-audit':   { bg: '#1a1200', border: '#854d0e55', color: '#d97706' },
  'not-built':     { bg: '#1a1a1a', border: '#333',      color: '#555'    },
}

// ─── Stages ───────────────────────────────────────────────────────────────────
// v12 OTS stage fuel matrix (standard-ots packages only):
//   Stage 1+  → 91, 93
//   Stage 2   → 91, 93, E50
//   Stage 3   → 91, 93, E50
//
// Stage 1 (basic): no v12 source — not available in current program.
// Hybrid-base: N20 MAP only — handled via N20_MAP_HYBRID_BASE_FUELS (pump/E50), not this list.
// E30: no v12 standard-ots packages — removed from all stage fuel lists.
// E40: not an OTS stage fuel — reserved for future Flex Fuel / RFP packages.
const STAGES = [
  { value: 'stage1plus', label: 'Stage 1+', fuels: ['91', '93'] },
  { value: 'stage2',     label: 'Stage 2',  fuels: ['91', '93', 'E50'] },
  { value: 'stage3',     label: 'Stage 3',  fuels: ['91', '93', 'E50'] },
]

// ─── Fuels ────────────────────────────────────────────────────────────────────
// Active fuels for OTS stage packages: 91, 93, E30, E50.
// E40 removed — not an OTS stage fuel. Reserved for Flex Fuel / RFP (future).
const ACTIVE_FUELS = [
  { value: '91',  label: '91 oct', color: '#f59e0b' },
  { value: '93',  label: '93 oct', color: '#10b981' },
  { value: 'E30', label: 'E30',    color: '#3b82f6' },
  { value: 'E50', label: 'E50',    color: '#ec4899' },
]

const FUTURE_FUELS = [
  { value: '95',    label: '95 oct', note: 'EU/intl markets — source files detected' },
  { value: 'ACN91', label: 'ACN91',  note: 'ACN-spec 91 — source files detected' },
  { value: 'CAD94', label: 'CAD94',  note: 'Canadian 94 oct — source files detected' },
]

// ─── N20 MAP Package Fuels ────────────────────────────────────────────────────
// N20 MAP packages use different fuel sets than Standard OTS.
//   Stock Turbo N20 MAP: 91, 93, E50 (no E30 — stock turbos at limit on E30)
//   Hybrid Base N20 MAP: Pump (91/93 pump gas, label 'Pump'), E50
const N20_MAP_STOCK_TURBO_FUELS = [
  { value: '91',  label: '91 oct', color: '#f59e0b' },
  { value: '93',  label: '93 oct', color: '#10b981' },
  { value: 'E50', label: 'E50',    color: '#ec4899' },
]

const N20_MAP_HYBRID_BASE_FUELS = [
  { value: 'pump', label: 'Pump',  color: '#64748b' },
  { value: 'E50',  label: 'E50',   color: '#ec4899' },
]

// ─── Package Categories ───────────────────────────────────────────────────────
// Distinguishes Standard OTS packages from N20 MAP sensor-scaled packages.
// Stage selector is shown for standard-ots; auto-set for N20 MAP categories.
type PackageCategory = 'standard-ots' | 'n20-map-stock-turbo' | 'n20-map-hybrid-base' | ''

const PACKAGE_CATEGORIES = [
  {
    value: 'standard-ots'        as PackageCategory,
    label: 'Standard OTS',
    desc:  'Stage 1+ (91/93) · Stage 2 (91/93/E50) · Stage 3 (91/93/E50)',
  },
  {
    value: 'n20-map-stock-turbo' as PackageCategory,
    label: 'Stock Turbo · N20 MAP Scaled',
    desc:  'Stage 3 · 91 / 93 / E50 · N20 MAP pressure sensor — not hybrid turbo',
  },
  {
    value: 'n20-map-hybrid-base' as PackageCategory,
    label: 'Hybrid Base · N20 MAP Scaled',
    desc:  'Hybrid turbo base tune · Pump / E50 · N20 MAP sensor scaled',
  },
]

// ─── Upload state ─────────────────────────────────────────────────────────────
type UploadState =
  | { status: 'none' }
  | { status: 'reading'; fileName: string }
  | { status: 'done'; result: BinVerificationResult; buffer: ArrayBuffer }

// ─── Patch review state machine ───────────────────────────────────────────────
type PatchState =
  | { phase: 'idle' }
  | { phase: 'loading' }                                               // fetching package JSON
  | { phase: 'running' }                                               // applying patches in-memory
  | { phase: 'done'; result: PatchApplyResult; pkg: AppSafePatchPackage } // review result ready + package
  | { phase: 'error'; message: string }                                // gate or engine error

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
  const [romFamily, setRomFamily]         = useState('')
  const [packageCategory, setPackageCategory] = useState<PackageCategory>('')
  const [stage, setStage]                 = useState('')
  const [fuel, setFuel]                   = useState('')
  const [uploadState, setUploadState]     = useState<UploadState>({ status: 'none' })
  const [dragOver, setDragOver]           = useState(false)
  const [patchState, setPatchState]       = useState<PatchState>({ phase: 'idle' })
  const [hashCopied, setHashCopied]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── ROM family change → reset all downstream ────────────────────────
  function handleRomChange(val: string) {
    setRomFamily(val)
    setPackageCategory('')
    setStage('')
    setFuel('')
    setPatchState({ phase: 'idle' })
    // Re-verify with new ROM if file already loaded
    if (uploadState.status === 'done') {
      setUploadState({ status: 'none' })
    }
  }

  // ── Package category change → auto-set stage for N20 MAP ────────────
  function handleCategoryChange(cat: PackageCategory) {
    setPackageCategory(cat)
    setFuel('')
    setPatchState({ phase: 'idle' })
    // N20 MAP categories have a single fixed stage — set it automatically
    if (cat === 'n20-map-stock-turbo') {
      setStage('stage3')
    } else if (cat === 'n20-map-hybrid-base') {
      setStage('hybrid-base')
    } else {
      setStage('')
    }
  }

  // ── Stage change → reset fuel + review (standard OTS only) ──────────
  function handleStageChange(val: string) {
    setStage(val)
    const s = STAGES.find((st) => st.value === val)
    if (fuel && s && !s.fuels.includes(fuel)) setFuel('')
    setPatchState({ phase: 'idle' })
  }

  // ── Fuel change → reset review ───────────────────────────────────────
  function handleFuelChange(val: string) {
    setFuel(val)
    setPatchState({ phase: 'idle' })
  }

  // ── File handler — reads ArrayBuffer then runs async verifyBin ───────
  const handleFile = useCallback(async (file: File) => {
    setPatchState({ phase: 'idle' })
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
  // Standard OTS stages for the selected ROM (N20 MAP stages are auto-set by category)
  const availableStages = (romFamily && packageCategory === 'standard-ots')
    ? STAGES.filter((s) => selectedRom?.stages.includes(s.value))
    : []
  const stageFuels = stage ? (STAGES.find((s) => s.value === stage)?.fuels ?? []) : []
  // Fuel list depends on package category
  const availableActiveFuels =
    packageCategory === 'standard-ots'     ? ACTIVE_FUELS.filter((f) => stageFuels.includes(f.value)) :
    packageCategory === 'n20-map-stock-turbo' ? N20_MAP_STOCK_TURBO_FUELS :
    packageCategory === 'n20-map-hybrid-base' ? N20_MAP_HYBRID_BASE_FUELS :
    []

  const verResult = uploadState.status === 'done' ? uploadState.result : null

  // ── Generate BIN decision — data-driven (manifest + validator) ──────
  // Decides if the selected ROM/Stage/Fuel/Turbo package is READY + valid.
  // Does NOT depend on the uploaded file — drives the "package status" label
  // and disables Generate BIN with a precise reason before any upload.
  const manifestPackageType: 'standard-ots' | 'n20-map' =
    packageCategory === 'standard-ots' ? 'standard-ots' : 'n20-map'
  const genDecision = resolveGenerateBin({
    romId:       romFamily,
    stage:       stage ? stageToManifestId(stage) : '',
    fuel:        fuel ? fuelToManifestId(fuel) : '',
    packageType: packageCategory ? manifestPackageType : ('' as 'standard-ots' | 'n20-map'),
  })
  const packageAvailable = genDecision.enabled

  // ── Hard BIN gate for Generate BIN ────────────────────────────────────
  // Three conditions must ALL be true before Generate BIN is enabled:
  //   1. Extension is exactly .bin (not .ori/.org)
  //   2. Size is exactly 2,097,152 bytes
  //   3. SHA-256 matches the known stock hash for the selected ROM
  // Unknown-2MB BINs (hashMatchStatus === 'unknown-2mb') are blocked.
  // ROM-mismatch BINs (wrong ROM selected) are blocked.
  // This is a hard pre-generate stop — the download gate is a second layer.
  const isStockBinVerified =
    uploadState.status === 'done' &&
    uploadState.result.extensionStatus === 'preferred' &&   // .bin only
    uploadState.result.sizeValid &&                         // exactly 2,097,152
    uploadState.result.hashMatchStatus === 'known-stock'    // exact SHA-256 match

  // ── isReady: package READY + stock BIN verified ─────────────────────
  const isReady = packageAvailable && isStockBinVerified

  // ── Generate BIN (review mode) ────────────────────────────────────────
  // Loads the app-safe package, applies patches in-memory, returns SHA-256 +
  // enables the Review BIN download. Gated data-driven by resolveGenerateBin:
  // package must be READY + valid, ROM must have a known stock hash, buffer 2MB.
  async function handleRunReview() {
    if (uploadState.status !== 'done' || !isReady) return

    const manifestEntry = getPackageByFilter({
      romId:       romFamily,
      stage:       stageToManifestId(stage),
      fuel:        fuelToManifestId(fuel),
      packageType: packageCategory === 'standard-ots' ? 'standard-ots' : 'n20-map',
    })

    // Pre-apply gate checks
    const preGate = runPreReviewGates(romFamily, manifestEntry, uploadState.buffer)
    if (!preGate.pass) {
      setPatchState({ phase: 'error', message: preGate.reason })
      return
    }

    // manifestEntry is confirmed non-null by gatePackageExists
    const entry = manifestEntry!

    setPatchState({ phase: 'loading' })
    try {
      const pkg = await loadPackage(entry.packageId, romFamily)
      setPatchState({ phase: 'running' })
      const result = await applyPatches(uploadState.buffer, pkg)

      // Post-apply safety gate — confirm safety fields on result
      const postGate = runPostReviewGates(result)
      if (!postGate.pass) {
        setPatchState({ phase: 'error', message: postGate.reason })
        return
      }

      setPatchState({ phase: 'done', result, pkg })
    } catch (err) {
      setPatchState({
        phase: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
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
          <Link href="/tune-app" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Tune App</Link>
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
              Synergy BMW Tuning — Tune App (Review Mode)
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem', lineHeight: 1.1 }}>
            N54 BIN Generator
          </h1>
          <p style={{ color: '#888', lineHeight: 1.65, maxWidth: '600px', marginBottom: '0.75rem' }}>
            Select your ROM, package category, and fuel — then upload your stock BIN.
            For <strong style={{ color: '#aaa' }}>I8A0S</strong> and{' '}
            <strong style={{ color: '#aaa' }}>INA0S</strong> (Standard OTS + N20 MAP), the app runs
            a full patch review in-memory: verifies stock SHA-256, applies all calibration regions,
            and returns a review result. No BIN is downloaded — owner-review mode only.
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
              const st = deriveRomStatus(rom.id, rom.heldVariantCount)
              const badgeStyle = ROM_STATUS_BADGE[st.status]
              return (
                <button key={rom.id} onClick={() => handleRomChange(rom.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.8rem 0.9rem', background: active ? '#0d1f3a' : '#0d0d0d', border: `1px solid ${active ? '#2563eb' : '#1e1e1e'}`, borderRadius: '0.55rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${active ? '#2563eb' : '#333'}`, background: active ? '#2563eb' : 'transparent', flexShrink: 0, marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {active && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: active ? '#93c5fd' : '#ccc', fontFamily: 'monospace' }}>
                        {rom.label}
                      </p>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '0.3rem', background: `${rom.badgeColor}22`, border: `1px solid ${rom.badgeColor}55`, color: rom.badgeColor, fontFamily: 'system-ui, sans-serif' }}>
                        {rom.badge}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '0.3rem',
                        background: badgeStyle.bg,
                        border: `1px solid ${badgeStyle.border}`,
                        color: badgeStyle.color,
                        fontFamily: 'system-ui, sans-serif' }}>
                        {st.label}
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
            Step 2 — Package Category
        ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: romFamily ? 1 : 0.35 }}>
          <p style={sectionTitle}>Step 2 — Select Package Category</p>
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {romFamily ? (() => {
              const rom = ROM_FAMILIES.find(r => r.id === romFamily)
              const availCats = rom?.availableCategories ?? []
              const st = deriveRomStatus(romFamily, rom?.heldVariantCount)
              if (availCats.length === 0) {
                return (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                    {st.status === 'needs-audit'
                      ? `${romFamily} packages are still being audited — not yet available for owner-review.`
                      : `${romFamily} packages are not available yet — check back for future updates.`}
                  </p>
                )
              }
              const note = rom?.statusNote
              return (
                <>
                  {note ? (
                    <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', fontWeight: 600,
                      color: ROM_STATUS_BADGE[st.status].color }}>
                      {note}
                    </p>
                  ) : null}
                  {PACKAGE_CATEGORIES
                    .filter(cat => availCats.includes(cat.value))
                    .map(cat => {
                  const active = packageCategory === cat.value
                  const isN20 = cat.value !== 'standard-ots'
                  return (
                    <button key={cat.value} onClick={() => handleCategoryChange(cat.value)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.8rem 0.9rem', background: active ? (isN20 ? '#0f1a2e' : '#0d1f3a') : '#0d0d0d', border: `1px solid ${active ? (isN20 ? '#7c3aed' : '#2563eb') : '#1e1e1e'}`, borderRadius: '0.55rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${active ? (isN20 ? '#7c3aed' : '#2563eb') : '#333'}`, background: active ? (isN20 ? '#7c3aed' : '#2563eb') : 'transparent', flexShrink: 0, marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.1rem', fontWeight: 700, fontSize: '0.92rem', color: active ? (isN20 ? '#c4b5fd' : '#93c5fd') : '#ccc' }}>
                          {cat.label}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>{cat.desc}</p>
                      </div>
                    </button>
                  )
                })}
                </>
              )
            })() : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#444' }}>Select a ROM family first.</p>
            )}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────
            Step 3 — Stage
        ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: packageCategory ? 1 : 0.35 }}>
          <p style={sectionTitle}>Step 3 — Stage</p>
          <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {packageCategory === 'standard-ots' ? (
              availableStages.length > 0 ? (
                availableStages.map((s) => {
                  const active = stage === s.value
                  return (
                    <button key={s.value} onClick={() => handleStageChange(s.value)}
                      style={{ ...pillBase, background: active ? '#1d3a6e' : '#1a1a1a', borderColor: active ? '#2563eb' : '#222', color: active ? '#fff' : '#bbb' }}>
                      {s.label}
                    </button>
                  )
                })
              ) : (
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#444' }}>
                  {'Select a ROM family and package category first.'}
                </p>
              )
            ) : packageCategory === 'n20-map-stock-turbo' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ ...pillBase, background: '#1d3a6e', borderColor: '#2563eb', color: '#fff', cursor: 'default' }}>
                  Stage 3
                </span>
                <span style={{ fontSize: '0.78rem', color: '#555' }}>Fixed — Stage 3 N20 MAP scaled (stock turbo)</span>
              </div>
            ) : packageCategory === 'n20-map-hybrid-base' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ ...pillBase, background: '#3b1a6e', borderColor: '#7c3aed', color: '#c4b5fd', cursor: 'default' }}>
                  Hybrid Base
                </span>
                <span style={{ fontSize: '0.78rem', color: '#555' }}>Fixed — Hybrid turbo base N20 MAP scaled</span>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#444' }}>Select a package category first.</p>
            )}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────
            Step 4 — Fuel
        ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: (packageCategory === 'standard-ots' ? !!stage : !!packageCategory) ? 1 : 0.35 }}>
          <p style={sectionTitle}>Step 4 — Select Fuel</p>
          <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {availableActiveFuels.length > 0 ? (
              <>
                {availableActiveFuels.map((f) => {
                  const active = fuel === f.value
                  return (
                    <button key={f.value} onClick={() => handleFuelChange(f.value)}
                      style={{ ...pillBase, background: active ? `${f.color}22` : '#1a1a1a', borderColor: active ? f.color : '#222', color: active ? f.color : '#bbb' }}>
                      {f.label}
                    </button>
                  )
                })}
                {/* Coming-soon fuels: standard OTS only */}
                {packageCategory === 'standard-ots' && (
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
                )}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#444' }}>
                {!packageCategory ? 'Select a package category first.'
                  : packageCategory === 'standard-ots' && !stage ? 'Select a stage first.'
                  : 'No packages available for this selection.'}
              </p>
            )}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────
            Step 4 — Upload & Verify BIN
        ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '1.75rem', opacity: fuel ? 1 : 0.35 }}>
          <p style={sectionTitle}>
            Step 5 — Upload &amp; Verify{romFamily ? ` ${romFamily}` : ' N54'} Stock BIN
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

        {/* ═══════════════════════════════════════════════════
            Step 5 — Patch Review (Review Mode)
            REVIEW ONLY — no BIN download, no export,
            no MHD encryption. Patched buffer never returned.
        ════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: '2rem' }}>

          {/* ── Run Review button ──────────────────────────── */}
          <button
            disabled={
              !isReady ||
              patchState.phase === 'loading' ||
              patchState.phase === 'running'
            }
            onClick={handleRunReview}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background:
                patchState.phase === 'done'    ? '#0d2a1a'
                : patchState.phase === 'error'   ? '#1a0d00'
                : patchState.phase === 'loading' || patchState.phase === 'running'
                                                 ? '#0d1a2e'
                : isReady                        ? '#14532d'
                : '#1a1a1a',
              color:
                patchState.phase === 'done'    ? '#4ade80'
                : patchState.phase === 'error'   ? '#fbbf24'
                : patchState.phase === 'loading' || patchState.phase === 'running'
                                                 ? '#93c5fd'
                : isReady                        ? '#86efac'
                : '#555',
              fontWeight: 700, fontSize: '1rem',
              padding: '0.8rem 2rem',
              borderRadius: '0.5rem',
              border: `1px solid ${
                patchState.phase === 'done'    ? '#16a34a'
                : patchState.phase === 'error'   ? '#854d0e'
                : patchState.phase === 'loading' || patchState.phase === 'running'
                                                 ? '#1d4ed8'
                : isReady                        ? '#16a34a33'
                : '#2a2a2a'
              }`,
              cursor: isReady && patchState.phase !== 'loading' && patchState.phase !== 'running'
                ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              width: '100%', justifyContent: 'center',
            }}
          >
            <span>
              {patchState.phase === 'loading' || patchState.phase === 'running' ? '⏳'
                : patchState.phase === 'done'  ? '✅'
                : patchState.phase === 'error' ? '⚠️'
                : isReady                      ? '🔬'
                : '🔒'}
            </span>
            {patchState.phase === 'loading' ? 'Loading patch package…'
              : patchState.phase === 'running' ? 'Applying patches in-memory…'
              : patchState.phase === 'done'    ? 'BIN generated — review below'
              : patchState.phase === 'error'   ? 'Generate failed — see error below'
              : 'Generate BIN'}
            {isReady && patchState.phase === 'idle' && (
              <span style={{ opacity: 0.65, fontSize: '0.82rem' }}>
                — {romFamily} / {
                  packageCategory === 'n20-map-stock-turbo' ? 'Stock Turbo N20 MAP' :
                  packageCategory === 'n20-map-hybrid-base' ? 'Hybrid Base N20 MAP' :
                  STAGES.find((s) => s.value === stage)?.label
                } / {fuel === 'pump' ? 'Pump' : fuel}
              </span>
            )}
          </button>

          {/* Not-ready hint — exact reason for each blocked state */}
          {!isReady && (
            <p style={{ fontSize: '0.8rem', color: '#444', marginTop: '0.5rem' }}>
              {!romFamily          ? 'Select a ROM family to begin.'
                : !packageCategory ? 'Select a package category to continue.'
                : !stage           ? 'Select a stage to continue.'
                : !fuel            ? 'Select a fuel to continue.'
                : !packageAvailable && !genDecision.enabled
                                   ? `Generate BIN unavailable — ${genDecision.reason}: ${genDecision.detail}`
                : uploadState.status === 'none'    ? `Upload your ${romFamily} stock BIN (.bin, exactly 2,097,152 bytes).`
                : uploadState.status === 'reading' ? 'Verifying file…'
                // Hard SHA gate messages — explain exactly which check failed
                : uploadState.status === 'done' && uploadState.result.extensionStatus !== 'preferred'
                                   ? `File must be a .bin file — ${uploadState.result.extension || 'no extension'} not accepted for Generate BIN.`
                : uploadState.status === 'done' && !uploadState.result.sizeValid
                                   ? `File is ${uploadState.result.fileSize.toLocaleString()} bytes — must be exactly 2,097,152 bytes.`
                : uploadState.status === 'done' && uploadState.result.hashMatchStatus === 'rom-mismatch'
                                   ? `SHA-256 matches ${uploadState.result.hashMatchedRom ?? 'a different ROM'}, not ${romFamily}. Select the correct ROM in MHD and re-upload.`
                : uploadState.status === 'done' && uploadState.result.hashMatchStatus !== 'known-stock'
                                   ? `SHA-256 does not match the known stock hash for ${romFamily}. Upload the unmodified original stock BIN.`
                : 'Fix verification errors before continuing.'}
            </p>
          )}

          {/* Package status chip + BIN verification status */}
          {romFamily && packageCategory && stage && fuel && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
              {/* Package gate status */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.3rem 0.7rem', borderRadius: '0.4rem',
                background: packageAvailable ? '#052e16' : '#1a1200',
                border: `1px solid ${packageAvailable ? '#16a34a55' : '#854d0e55'}`,
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: packageAvailable ? '#4ade80' : '#d97706' }}>
                  {packageAvailable ? '✓ Package READY' : `✗ ${genDecision.enabled ? '' : genDecision.reason}`}
                </span>
              </div>
              {/* BIN verification gate status */}
              {uploadState.status === 'done' && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.3rem 0.7rem', borderRadius: '0.4rem',
                  background: isStockBinVerified ? '#052e16' : '#1a0000',
                  border: `1px solid ${isStockBinVerified ? '#16a34a55' : '#dc262644'}`,
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isStockBinVerified ? '#4ade80' : '#f87171' }}>
                    {isStockBinVerified
                      ? `✓ Stock BIN verified (${romFamily})`
                      : uploadState.result.hashMatchStatus === 'unknown-2mb'
                        ? '✗ SHA-256 not in known-stock DB'
                        : uploadState.result.hashMatchStatus === 'rom-mismatch'
                          ? `✗ SHA matches ${uploadState.result.hashMatchedRom ?? 'different ROM'}`
                          : uploadState.result.extensionStatus !== 'preferred'
                            ? `✗ Must be .bin (got ${uploadState.result.extension || 'none'})`
                            : '✗ BIN not verified'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Loading / running indicator ─────────────────── */}
          {(patchState.phase === 'loading' || patchState.phase === 'running') && (
            <div style={{
              marginTop: '1rem', padding: '1rem 1.25rem',
              background: '#0d1525', border: '1px solid #1e3a8a44',
              borderRadius: '0.65rem', display: 'flex', gap: '0.75rem', alignItems: 'center',
            }}>
              <span style={{ fontSize: '1.2rem' }}>⏳</span>
              <div>
                <p style={{ margin: '0 0 0.15rem', fontWeight: 700, fontSize: '0.85rem', color: '#93c5fd' }}>
                  {patchState.phase === 'loading' ? 'Loading patch package…' : 'Applying patch regions in-memory…'}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#4b6ea8' }}>
                  {patchState.phase === 'loading'
                    ? 'Fetching app-safe JSON package from /tune-program/patch-packages/'
                    : 'Computing SHA-256, checking stock bytes, writing replacements — patched buffer will not be returned'}
                </p>
              </div>
            </div>
          )}

          {/* ── Error state ────────────────────────────────── */}
          {patchState.phase === 'error' && (
            <div style={{
              marginTop: '1rem', padding: '1rem 1.25rem',
              background: '#1a0f00', border: '1px solid #854d0e55',
              borderRadius: '0.65rem',
            }}>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '0.82rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚠ Review Blocked
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#d97706', lineHeight: 1.6 }}>
                {patchState.message}
              </p>
              <button
                onClick={() => setPatchState({ phase: 'idle' })}
                style={{ marginTop: '0.75rem', padding: '0.3rem 0.75rem', background: 'transparent', border: '1px solid #444', borderRadius: '0.35rem', color: '#666', cursor: 'pointer', fontSize: '0.78rem' }}
              >
                ↺ Dismiss
              </button>
            </div>
          )}

          {/* ── Review result + locked output section ──────── */}
          {patchState.phase === 'done' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <PatchReviewPanel result={patchState.result} showRegionDetail={false} />

              {/* ── Download Review BIN (only after clean review) ─── */}
              {uploadState.status === 'done' && (
                <OwnerReviewDownload
                  result={patchState.result}
                  stockBuffer={uploadState.buffer}
                  pkg={patchState.pkg}
                  selection={{
                    romId:      romFamily,
                    stage,
                    fuel,
                    turboType:  packageCategory === 'standard-ots' ? 'stock' : packageCategory,
                    stageLabel:
                      packageCategory === 'n20-map-stock-turbo' ? 'Stock Turbo N20 MAP (Stage 3)' :
                      packageCategory === 'n20-map-hybrid-base'  ? 'Hybrid Base N20 MAP' :
                      (STAGES.find((s) => s.value === stage)?.label ?? stage),
                    turboLabel:
                      packageCategory === 'n20-map-stock-turbo' ? 'Stock Turbo (N20 MAP scaled)' :
                      packageCategory === 'n20-map-hybrid-base'  ? 'Hybrid Turbo (base)' :
                      'Stock Turbo',
                    fuelLabel:  fuel === 'pump' ? 'Pump' : fuel,
                  }}
                />
              )}

              {/* ── Locked output section ─────────────────── */}
              <div style={{
                background: '#0a0f1a',
                border: '1px solid #1e3a8a44',
                borderRadius: '0.75rem',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '0.85rem 1.1rem', background: '#0d1525', borderBottom: '1px solid #1e3a8a33', display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem' }}>🔒</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: '#93c5fd' }}>
                      FLASH-READY / MHD-ENCRYPTED EXPORT DISABLED — REVIEW MODE ONLY
                    </p>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#1d4ed8', background: '#0a0f1a', border: '1px solid #1e3a8a', padding: '0.15rem 0.45rem', borderRadius: '0.3rem' }}>
                    outputMode: STANDARD_BIN_REVIEW_ONLY
                  </span>
                </div>
                <div style={{ padding: '1rem 1.1rem' }}>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#475569', lineHeight: 1.65 }}>
                    The Review BIN above is a review-mode artifact for verification in TunerPro/WinOLS — not a
                    flash-ready, customer-ready, or MHD-encrypted file. VIN locking and MHD encryption are
                    intentionally disabled in this build and require a separate owner-approved step.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {[
                      'This is not a flashing tool. It does not connect to your car or DME.',
                      'The Review BIN is for inspection only — confirm checksums before any flash.',
                      'Flashing requires MHD Flasher or N54 Quickflash (external) — the app does not flash.',
                      'MHD-locked (.mhd) packages require owner approval and are produced separately, outside this app.',
                      'Review-mode output is not customer-ready. Final delivery requires owner export + VIN locking.',
                    ].map((w, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#1e40af', fontSize: '0.7rem', marginTop: '0.2rem', flexShrink: 0 }}>⚠</span>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#374151', lineHeight: 1.55 }}>{w}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1e2a3a', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: '0 0 0.1rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', fontWeight: 600 }}>encryptionApproved</p>
                      <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#ef4444' }}>false</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.1rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', fontWeight: 600 }}>mhdEncryptionAllowed</p>
                      <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#ef4444' }}>false</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.1rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', fontWeight: 600 }}>ownerReviewRequired</p>
                      <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#f59e0b' }}>true</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Reset for another run ─────────────────── */}
              <button
                onClick={() => setPatchState({ phase: 'idle' })}
                style={{ padding: '0.45rem 1rem', background: 'transparent', border: '1px solid #1e2a3a', borderRadius: '0.4rem', color: '#374151', cursor: 'pointer', fontSize: '0.8rem', alignSelf: 'flex-start' }}
              >
                ↺ Run again with different BIN or package
              </button>
            </div>
          )}
        </section>

        {/* ── Scope & Roadmap ──────────────────────────────────── */}
        <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#444', fontWeight: 600, marginBottom: '1rem' }}>
            Scope & Roadmap
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { icon: '✅', title: 'v1 — ROM Selection + BIN Upload & Verification', body: 'Select ROM family (I8A0S/IJE0S/IKM0S/INA0S), stage, and fuel. Upload stock BIN — app checks extension, file size (2,097,152 bytes / 0x200000), reads ArrayBuffer, computes SHA-256, and compares against known stock hashes. "Known stock BIN" confirmed for all four ROM originals. Detects ROM mismatches (e.g. uploading I8A0S BIN while IJE0S is selected). Output is a placeholder — no calibration patching applied in v1.' },
              { icon: '🔜', title: 'v2 — XDF Byte Fingerprinting', body: 'Read XDF-mapped byte offsets from uploaded BIN and compare against expected ROM identifier patterns. Confirms the ROM family from actual calibration bytes — not just file size and known-hash match. Enables fingerprint of BINs not in the known-stock database.' },
              { icon: '✅', title: 'v3 — Patch-Package Review Mode (active)', body: 'App-safe patch packages (JSON, stripped of private paths) are fetched client-side. Stock SHA-256 is verified, regions applied in-memory, patched SHA-256 returned for owner review. The patched buffer is never returned — discarded after hashing. I8A0S Standard OTS: Stage 1/1+/2 × 91/93, Stage 3 × E30/E50 (8 packages, 141–144 regions). I8A0S + INA0S N20 MAP: Stock Turbo Stage 3 × 91/93/E50, Hybrid Base × Pump/E50 (10 packages, 111–138 regions). Review mode only — no download, no encryption.' },
              { icon: '✅', title: 'v3.1 — Owner Review Download (active)', body: 'After a clean patch review (0 mismatches), owner can download the review BIN for TunerPro inspection and a JSON sidecar manifest. Download is browser-only — no server, no upload. Buffer is created inside the click handler and discarded immediately after. Labelled TUNERPRO_REVIEW_ONLY. Not customer-ready. MHD encryption and VIN locking require a separate step.' },
              { icon: '🔜', title: 'v4 — Owner Export + VIN Locking', body: 'Owner-only local export command (scripts/private/export-review-bin.mjs) creates a review BIN outside the public app (inside _private_tuning_sources/ only), after manual approval. MHD encryption pipeline stages workspace for drag-and-drop with TuningMapBuilder — produces VIN-locked .mhd package. Output classification: LOCKED_MHD_PACKAGE.' },
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
            Patch packages are app-safe JSON (private paths stripped). 95 oct, ACN91, and CAD94 source files detected — coming in future update.
            <strong style={{ color: '#444' }}> I8A0S:</strong> Standard OTS + N20 MAP packages READY.{' '}
            <strong style={{ color: '#444' }}>INA0S:</strong> N20 MAP packages READY (no Standard OTS).{' '}
            <strong style={{ color: '#444' }}>IJE0S:</strong> needs audit (150 unmatched offsets per package).{' '}
            <strong style={{ color: '#444' }}>IKM0S:</strong> 16 validated v90-source packages are ready; 95 and ACN91 selections remain unavailable.
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
