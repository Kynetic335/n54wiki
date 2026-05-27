'use client'

// ─── N54 Patch Review Panel ───────────────────────────────────────────────────
//
// REVIEW MODE ONLY — this component displays patch apply results.
// It does NOT expose the patched BIN, does NOT provide a download button,
// and does NOT connect to the MHD encryption pipeline.
//
// Displays:
//   - Stock SHA-256 verification result
//   - Regions applied / stock-mismatch count
//   - Patched SHA-256 (for owner review — not shown to customers)
//   - Per-region detail (collapsible, owner-only intent)
//   - Hard REVIEW ONLY banner — always visible
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { PatchApplyResult, RegionApplyResult } from '@/types/tune-program'
import { toHexOffset, statusLabel, statusColor } from '@/lib/tune-program/patchApplyEngine'

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '0.75rem',
  padding: '1.5rem',
}

const mono: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.8rem',
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#555',
  fontWeight: 600,
  marginBottom: '0.5rem',
}

const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '0.2rem 0.65rem',
  borderRadius: '0.35rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  background: `${color}20`,
  color,
  border: `1px solid ${color}40`,
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function HashRow({ label, value, match }: { label: string; value: string; match?: boolean }) {
  const color = match === undefined ? '#888' : match ? '#10b981' : '#f59e0b'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.75rem' }}>
      <div style={{ ...sectionLabel, marginBottom: 0 }}>{label}</div>
      <div style={{ ...mono, color, wordBreak: 'break-all' }}>
        {value || '—'}
        {match !== undefined && (
          <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
            {match ? '✓ matches' : '≠ mismatch'}
          </span>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, color = '#888' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 120,
      background: '#0a0a0a', border: '1px solid #1e1e1e',
      borderRadius: '0.5rem', padding: '0.75rem 1rem',
    }}>
      <div style={{ ...sectionLabel, marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function RegionRow({ r, i }: { r: RegionApplyResult; i: number }) {
  const [open, setOpen] = useState(false)
  const color = r.stockMismatch ? '#ef4444' : r.applied ? '#10b981' : '#f59e0b'

  return (
    <div style={{
      borderBottom: '1px solid #1a1a1a',
      padding: '0.4rem 0',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none',
          cursor: 'pointer', padding: '0.25rem 0',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          textAlign: 'left',
        }}
      >
        <span style={{ ...mono, color: '#555', minWidth: 28, fontSize: '0.72rem' }}>
          #{i + 1}
        </span>
        <span style={{ ...mono, color: '#666', minWidth: 80, fontSize: '0.72rem' }}>
          {toHexOffset(r.offset)}
        </span>
        <span style={{ ...mono, color: '#555', minWidth: 36, fontSize: '0.72rem' }}>
          {r.byteCount}B
        </span>
        <span style={{ flex: 1, fontSize: '0.8rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.mapName ?? '(audited/unmatched)'}
          {r.category ? <span style={{ color: '#555', marginLeft: '0.5rem' }}>· {r.category}</span> : null}
        </span>
        <span style={badge(color)}>
          {r.stockMismatch ? '⚠ mismatch' : r.applied ? '✓ applied' : '– skipped'}
        </span>
        <span style={{ color: '#444', fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ paddingLeft: '2.5rem', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={mono}>
            <span style={{ color: '#555' }}>expected stock  </span>
            <span style={{ color: '#888' }}>{r.expectedHex}</span>
          </div>
          <div style={mono}>
            <span style={{ color: '#555' }}>actual stock    </span>
            <span style={{ color: r.stockMismatch ? '#ef4444' : '#888' }}>{r.actualStockHex}</span>
          </div>
          <div style={mono}>
            <span style={{ color: '#555' }}>replacement     </span>
            <span style={{ color: '#3b82f6' }}>{r.replacementHex}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PatchReviewPanelProps {
  result: PatchApplyResult
  /** Show per-region detail table (owner-facing) */
  showRegionDetail?: boolean
}

export default function PatchReviewPanel({ result, showRegionDetail = false }: PatchReviewPanelProps) {
  const [regionDetailOpen, setRegionDetailOpen] = useState(showRegionDetail)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const sColor = statusColor(result.status)
  const mismatchRegions = result.regionResults.filter(r => r.stockMismatch)

  // Category list for filter
  const categories = Array.from(
    new Set(result.regionResults.map(r => r.category ?? '(other)'))
  ).sort()

  const filteredRegions = categoryFilter === 'all'
    ? result.regionResults
    : result.regionResults.filter(r => (r.category ?? '(other)') === categoryFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── REVIEW ONLY banner ── */}
      <div style={{
        background: '#1a0f00',
        border: '1px solid #f59e0b40',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.1rem' }}>🔒</span>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>
            STANDARD BIN — REVIEW ONLY
          </div>
          <div style={{ fontSize: '0.72rem', color: '#92400e' }}>
            Patch applied in-memory. No BIN download. Owner review required before any export step.
            MHD encryption pipeline is not connected.
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'right' }}>
          <span style={{ fontSize: '0.6rem', color: '#555' }}>encryptionApproved</span>
          <span style={{ ...mono, color: '#ef4444', fontSize: '0.7rem' }}>false</span>
        </div>
      </div>

      {/* ── Status card ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e5e5e5' }}>
              {result.romId} / {result.stage} / {result.fuel}
            </div>
            <div style={{ ...mono, color: '#555', fontSize: '0.7rem' }}>{result.packageId}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={badge(sColor)}>{statusLabel(result.status)}</span>
          </div>
        </div>

        {/* Stat boxes */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <StatBox
            label="Regions applied"
            value={result.appliedCount}
            color={result.appliedCount === result.totalRegions ? '#10b981' : '#f59e0b'}
          />
          <StatBox
            label="Total regions"
            value={result.totalRegions}
            color="#888"
          />
          <StatBox
            label="Stock mismatches"
            value={result.stockMismatchCount}
            color={result.stockMismatchCount === 0 ? '#10b981' : '#ef4444'}
          />
        </div>

        {/* Hash rows */}
        <HashRow
          label="Input BIN SHA-256"
          value={result.inputSha256}
          match={result.stockSha256Match}
        />
        <HashRow
          label="Expected stock SHA-256 (package)"
          value={result.stockSha256Expected}
        />
        <HashRow
          label="Patched BIN SHA-256 (review)"
          value={result.patchedSha256}
          match={result.patchedMatchesTuned}
        />
        <HashRow
          label="Tuned SHA-256 expected (after flasher CRC)"
          value={result.tunedSha256Expected}
        />
      </div>

      {/* ── Notes ── */}
      {result.notes.length > 0 && (
        <div style={{ ...card, border: '1px solid #1e3a2a' }}>
          <div style={{ ...sectionLabel, color: '#16a34a' }}>Notes</div>
          {result.notes.map((n, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.4rem' }}>
              ℹ {n}
            </div>
          ))}
        </div>
      )}

      {/* ── Errors ── */}
      {result.errors.length > 0 && (
        <div style={{ ...card, border: '1px solid #3a1e1e' }}>
          <div style={{ ...sectionLabel, color: '#ef4444' }}>Errors</div>
          {result.errors.map((e, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: '#ef4444', marginBottom: '0.4rem' }}>
              ✗ {e}
            </div>
          ))}
        </div>
      )}

      {/* ── Mismatch summary (if any) ── */}
      {mismatchRegions.length > 0 && (
        <div style={{ ...card, border: '1px solid #3a2a1e' }}>
          <div style={{ ...sectionLabel, color: '#f59e0b' }}>
            {mismatchRegions.length} Stock-Byte Mismatch{mismatchRegions.length > 1 ? 'es' : ''}
          </div>
          {mismatchRegions.map((r, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: '#92400e', ...mono, marginBottom: '0.3rem' }}>
              {toHexOffset(r.offset)} ({r.byteCount}B) {r.mapName ?? '(unmatched)'} —
              expected <span style={{ color: '#888' }}>{r.expectedHex}</span> got{' '}
              <span style={{ color: '#ef4444' }}>{r.actualStockHex}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Region detail table (owner-facing) ── */}
      <div style={card}>
        <button
          onClick={() => setRegionDetailOpen(o => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
            padding: 0,
          }}
        >
          <div style={{ ...sectionLabel, marginBottom: 0, flex: 1, textAlign: 'left' }}>
            Region Detail ({result.regionResults.length} regions)
          </div>
          <span style={{ color: '#444', fontSize: '0.8rem' }}>
            {regionDetailOpen ? '▲ Collapse' : '▼ Expand'}
          </span>
        </button>

        {regionDetailOpen && (
          <div style={{ marginTop: '1rem' }}>
            {/* Category filter */}
            {categories.length > 1 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {['all', ...categories].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '0.3rem',
                      border: `1px solid ${cat === categoryFilter ? '#3b82f6' : '#222'}`,
                      background: cat === categoryFilter ? '#1e3a5f' : '#0a0a0a',
                      color: cat === categoryFilter ? '#93c5fd' : '#555',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Region rows */}
            <div>
              {filteredRegions.map((r, i) => (
                <RegionRow key={r.regionIndex} r={r} i={r.regionIndex} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
