'use client'

import Link from 'next/link'
import type { TuneFile } from '@/types/tune-program'

interface PackageCardProps {
  tuneFile: TuneFile
  showSelectLink?: boolean
  compact?: boolean
}

const stageColors: Record<string, string> = {
  stage1: '#10b981',
  stage1plus: '#3b82f6',
  stage2: '#f59e0b',
  stage3: '#ef4444',
  'hybrid-base': '#8b5cf6',
}

const turboLabels: Record<string, string> = {
  stock: 'Stock Turbo',
  'upgraded-stock-frame': 'Upgraded Stock-Frame',
  hybrid: 'Hybrid Turbo',
}

const fuelLabels: Record<string, string> = {
  '91': '91 oct',
  '93': '93 oct',
  E30: 'E30',
  E40: 'E40',
  E50: 'E50',
}

const stageLabels: Record<string, string> = {
  stage1: 'Stage 1',
  stage1plus: 'Stage 1+',
  stage2: 'Stage 2',
  stage3: 'Stage 3',
  'hybrid-base': 'Hybrid Base',
}

export function PackageCard({ tuneFile, showSelectLink = false, compact = false }: PackageCardProps) {
  const accentColor = stageColors[tuneFile.stage] ?? '#2563eb'
  const isPlaceholder = !tuneFile.fileExists

  return (
    <div
      style={{
        background: '#111',
        border: `1px solid ${isPlaceholder ? '#1e1e1e' : '#1a1a2e'}`,
        borderRadius: '0.75rem',
        padding: compact ? '1rem' : '1.25rem',
        position: 'relative',
        opacity: isPlaceholder ? 0.7 : 1,
      }}
    >
      {/* Placeholder badge */}
      {isPlaceholder && (
        <div
          style={{
            position: 'absolute',
            top: '0.6rem',
            right: '0.6rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '0.35rem',
            padding: '0.15rem 0.5rem',
            fontSize: '0.68rem',
            color: '#555',
            fontWeight: 600,
          }}
        >
          PENDING FILE
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: compact ? '0.75rem' : '1rem' }}>
        <div
          style={{
            width: '8px',
            flexShrink: 0,
            alignSelf: 'stretch',
            borderRadius: '4px',
            background: accentColor,
            minHeight: '40px',
          }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: compact ? '0.9rem' : '1rem', color: '#f0f0f0', lineHeight: 1.3 }}>
            {tuneFile.displayName}
          </p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#555', fontFamily: 'monospace' }}>
            {tuneFile.id}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: compact ? '0.75rem' : '1rem' }}>
        <Tag label={tuneFile.romVersion} color="#2563eb" />
        <Tag label={stageLabels[tuneFile.stage] ?? tuneFile.stage} color={accentColor} />
        <Tag label={fuelLabels[tuneFile.fuel] ?? tuneFile.fuel} color="#10b981" />
        <Tag label={turboLabels[tuneFile.turboType] ?? tuneFile.turboType} color="#f59e0b" />
        <Tag label={tuneFile.transmissionCompatibility} color="#6b7280" />
      </div>

      {/* Required mods */}
      {!compact && tuneFile.requiredMods.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', fontWeight: 600 }}>
            Required Mods
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {tuneFile.requiredMods.map((mod, i) => (
              <li key={i} style={{ fontSize: '0.8rem', color: '#777', marginBottom: '0.15rem' }}>
                {mod}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety notes — first one only in compact */}
      {!compact && tuneFile.safetyNotes.length > 0 && (
        <div
          style={{
            background: '#1a0f00',
            border: '1px solid #854d0e33',
            borderRadius: '0.5rem',
            padding: '0.6rem 0.8rem',
            marginBottom: '0.75rem',
          }}
        >
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#854d0e', fontWeight: 600 }}>
            Safety Notes
          </p>
          {tuneFile.safetyNotes.map((note, i) => (
            <p key={i} style={{ margin: i < tuneFile.safetyNotes.length - 1 ? '0 0 0.25rem' : 0, fontSize: '0.8rem', color: '#d97706', lineHeight: 1.5 }}>
              • {note}
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: tuneFile.exportable && tuneFile.fileExists ? '#4ade80' : '#555',
              fontWeight: 500,
            }}
          >
            {tuneFile.exportable && tuneFile.fileExists ? '🔒 Exportable' : tuneFile.exportable ? '⏳ File Pending' : '🚫 Not Exportable'}
          </span>
          <span style={{ color: '#333' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#555' }}>
            {tuneFile.locked ? '🔐 Locked' : 'Unlocked'}
          </span>
        </div>

        {showSelectLink && (
          <Link
            href={`/tune-program/intake?fileId=${tuneFile.id}&rom=${tuneFile.romVersion}&fuel=${tuneFile.fuel}&stage=${tuneFile.stage}&turbo=${tuneFile.turboType}`}
            style={{
              display: 'inline-block',
              background: '#1e3a8a',
              color: '#93c5fd',
              textDecoration: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: '1px solid #2563eb44',
              whiteSpace: 'nowrap',
            }}
          >
            Select →
          </Link>
        )}
      </div>
    </div>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.18rem 0.5rem',
        borderRadius: '0.3rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  )
}
