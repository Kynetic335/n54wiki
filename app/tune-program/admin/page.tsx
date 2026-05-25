'use client'

import { useState } from 'react'
import { TuneProgramHeader } from '@/components/tune-program/TuneProgramHeader'
import { AdminDashboard } from '@/components/tune-program/AdminDashboard'

const DEFAULT_PIN = 'synergy2026'

export default function AdminPage() {
  const [pin, setPin] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    // v1: client-side PIN check — replace with proper auth in production
    if (pin === DEFAULT_PIN) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect PIN.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <TuneProgramHeader activePath="/tune-program/admin" />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f59e0b', fontWeight: 600, marginBottom: '0.5rem' }}>
            Admin Dashboard
          </p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Tune Request Management
          </h1>
        </div>

        {!authenticated ? (
          <div style={{ maxWidth: '360px' }}>
            <div
              style={{
                background: '#111',
                border: '1px solid #1e1e1e',
                borderRadius: '0.75rem',
                padding: '1.75rem',
              }}
            >
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#888', lineHeight: 1.6 }}>
                Enter your admin PIN to access the dashboard.
                <br />
                <span style={{ color: '#555', fontSize: '0.8rem' }}>
                  Default (dev): <code style={{ fontFamily: 'monospace' }}>{DEFAULT_PIN}</code>
                  <br />
                  Set <code style={{ fontFamily: 'monospace' }}>SYNERGY_ADMIN_PIN</code> in production.
                </span>
              </p>
              <form onSubmit={handleLogin}>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Admin PIN"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0d0d0d',
                    border: `1px solid ${error ? '#7f1d1d' : '#1e1e1e'}`,
                    borderRadius: '0.5rem',
                    padding: '0.65rem 0.8rem',
                    color: '#f0f0f0',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
                />
                {error && (
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#f87171' }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Access Dashboard →
                </button>
              </form>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#333', lineHeight: 1.6 }}>
              ⚠️ v1 uses a client-side PIN. Integrate proper server-side authentication for production use.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                background: '#0d1525',
                border: '1px solid #1e3a8a44',
                borderRadius: '0.65rem',
                padding: '0.8rem 1.1rem',
                marginBottom: '1.5rem',
                fontSize: '0.82rem',
                color: '#6699ff',
              }}
            >
              ℹ️ Protected tune exports are encrypted with AES-256-GCM using <code style={{ fontFamily: 'monospace', color: '#93c5fd' }}>SYNERGY_EXPORT_SECRET</code>.
              Generated BIN files are flashed by the customer using MHD Flasher or N54 Quickflash.
            </div>
            <AdminDashboard adminPin={DEFAULT_PIN} />
          </>
        )}
      </div>

      <div style={{ borderTop: '1px solid #111', padding: '1.25rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.78rem', color: '#444', margin: 0 }}>
          © {new Date().getFullYear()} N54 Wiki —{' '}
          <a href="https://synergybmwtuning.com" target="_blank" rel="noopener noreferrer"
            style={{ color: '#6699ff', textDecoration: 'none', fontWeight: 600 }}>
            Synergy BMW Tuning
          </a>
        </p>
      </div>
    </div>
  )
}
