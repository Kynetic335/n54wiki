'use client'

import { useState } from 'react'

interface FileHashDisplayProps {
  hash: string
  label?: string
  full?: boolean
}

export function FileHashDisplay({ hash, label = 'SHA-256', full = false }: FileHashDisplayProps) {
  const [copied, setCopied] = useState(false)

  const display = full ? hash : hash.slice(0, 16) + '...' + hash.slice(-8)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: '#0d0d0d',
        border: '1px solid #1e1e1e',
        borderRadius: '0.4rem',
        padding: '0.35rem 0.7rem',
      }}
    >
      <span style={{ fontSize: '0.7rem', color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <code
        style={{
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: '#4ade80',
          letterSpacing: '0.05em',
        }}
      >
        {display}
      </code>
      <button
        onClick={handleCopy}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: copied ? '#4ade80' : '#444',
          padding: '0',
          fontSize: '0.8rem',
          lineHeight: 1,
        }}
        title="Copy full hash"
      >
        {copied ? '✓' : '⧉'}
      </button>
    </div>
  )
}
