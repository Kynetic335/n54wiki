'use client'

import { useState } from 'react'
import type { CustomerRequest, TuneFile } from '@/types/tune-program'

interface LockedExportButtonProps {
  tuneFile: TuneFile
  request: CustomerRequest
  adminPin: string
  onSuccess?: (fileName: string, hash: string) => void
  onError?: (error: string) => void
}

export function LockedExportButton({
  tuneFile,
  request,
  adminPin,
  onSuccess,
  onError,
}: LockedExportButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [lastFileName, setLastFileName] = useState('')

  const canExport = tuneFile.exportable

  const handleExport = async () => {
    setState('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/tune-program/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tuneFileId: tuneFile.id,
          request,
          adminPin,
          exportedBy: 'Synergy Tuner (Admin)',
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Export failed' })) as { error: string }
        throw new Error(errData.error || `Export failed with status ${res.status}`)
      }

      const blob = await res.blob()
      const contentHash = res.headers.get('X-Package-Hash') ?? ''
      const fileName =
        res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        `synergy-${tuneFile.id}-export.synergytune`

      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setLastFileName(fileName)
      setState('success')
      onSuccess?.(fileName, contentHash)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed — unknown error'
      setErrorMessage(msg)
      setState('error')
      onError?.(msg)
    }
  }

  if (!canExport) {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '0.5rem',
          fontSize: '0.84rem',
          color: '#666',
        }}
      >
        🚫 This tune file is not marked as exportable.
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={state === 'loading'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.75rem',
          background: state === 'loading' ? '#1a1a1a' : state === 'success' ? '#14532d' : '#1e3a8a',
          color: state === 'loading' ? '#555' : state === 'success' ? '#4ade80' : '#93c5fd',
          border: `1px solid ${state === 'success' ? '#16a34a' : state === 'error' ? '#7f1d1d' : '#2563eb'}`,
          borderRadius: '0.5rem',
          cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          fontWeight: 700,
          fontSize: '0.95rem',
          transition: 'all 0.15s',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {state === 'loading' && <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>}
        {state === 'success' && '✅'}
        {state === 'error' && '❌'}
        {state === 'idle' && '🔐'}
        {state === 'loading'
          ? 'Encrypting and packaging...'
          : state === 'success'
          ? `Downloaded: ${lastFileName}`
          : state === 'error'
          ? 'Export failed — retry below'
          : 'Export Protected Tune Package (.synergytune)'}
      </button>

      {state === 'error' && errorMessage && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: '#1f0000',
            border: '1px solid #7f1d1d',
            borderRadius: '0.5rem',
            fontSize: '0.83rem',
            color: '#fca5a5',
          }}
        >
          <strong>Error:</strong> {errorMessage}
          <button
            onClick={() => setState('idle')}
            style={{
              display: 'block',
              marginTop: '0.5rem',
              background: 'none',
              border: '1px solid #7f1d1d',
              color: '#f87171',
              borderRadius: '0.35rem',
              padding: '0.25rem 0.65rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {state === 'success' && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: '#052e16',
            border: '1px solid #16a34a44',
            borderRadius: '0.5rem',
            fontSize: '0.83rem',
            color: '#86efac',
          }}
        >
          Package downloaded successfully. This is an <strong>encrypted protected export</strong> —
          not directly readable without the Synergy decryption tool. Share only with the customer.
          <button
            onClick={() => setState('idle')}
            style={{
              display: 'block',
              marginTop: '0.5rem',
              background: 'none',
              border: '1px solid #16a34a',
              color: '#4ade80',
              borderRadius: '0.35rem',
              padding: '0.25rem 0.65rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Export Again
          </button>
        </div>
      )}
    </div>
  )
}
