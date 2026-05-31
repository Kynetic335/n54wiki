'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONTACT_EMAIL = 'contact@synergybmwtuning.com'

const SERVICE_OPTIONS = [
  { value: '', label: 'Select a service...' },
  { value: 'custom-tune', label: 'Custom Tune' },
  { value: 'log-review', label: 'Log Review' },
  { value: 'pre-tune-consultation', label: 'Pre-Tune Consultation' },
  { value: 'general', label: 'General Question' },
]

const FROM_MAP: Record<string, string> = {
  tune: 'custom-tune',
  log: 'log-review',
  readiness: 'pre-tune-consultation',
  contact: 'general',
  default: 'general',
}

export default function ContactForm({ initialFrom }: { initialFrom?: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [service, setService] = useState(FROM_MAP[initialFrom ?? ''] ?? '')
  const [vehicle, setVehicle] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (initialFrom && FROM_MAP[initialFrom]) {
      setService(FROM_MAP[initialFrom])
    }
  }, [initialFrom])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const serviceLabel = SERVICE_OPTIONS.find((o) => o.value === service)?.label ?? 'Inquiry'
    const subject = `N54 Wiki: ${serviceLabel}${vehicle ? ` — ${vehicle}` : ''}`
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      vehicle ? `Vehicle: ${vehicle}` : null,
      `Service: ${serviceLabel}`,
      '',
      message,
    ]
      .filter(Boolean)
      .join('\n')
    const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          vehicle,
          message: body,
          source: service || 'contact-form',
        }),
      })

      if (!response.ok) {
        window.location.href = mailtoHref
      }
    } catch {
      window.location.href = mailtoHref
    } finally {
      setSubmitted(true)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f0f0f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <nav
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', textDecoration: 'none', color: '#f0f0f0' }}
        >
          N54 Wiki
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/wiki" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>
            Wiki
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
            }}
          >
            Synergy Tuning
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
          Contact Synergy BMW Tuning
        </h1>
        <p style={{ color: '#999', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Describe your setup and what you need — the Synergy team will follow up with the right path forward.
        </p>

        {submitted ? (
          <div
            style={{
              background: '#0f2a1a',
              border: '1px solid #16a34a44',
              borderRadius: '0.75rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#86efac', margin: '0 0 0.5rem' }}>
              Your message was submitted.
            </p>
            <p style={{ color: '#999', margin: '0 0 1.5rem' }}>
              If you do not hear back, email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#6699ff' }}>
                {CONTACT_EMAIL}
              </a>{' '}
              directly.
            </p>
            <Link
              href="/wiki"
              style={{
                display: 'inline-block',
                background: '#2563eb',
                color: '#fff',
                textDecoration: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Back to Wiki
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FieldLabel label="Name *">
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                />
              </FieldLabel>
              <FieldLabel label="Email *">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  style={inputStyle}
                />
              </FieldLabel>
            </div>

            <FieldLabel label="Service Interest *">
              <select required value={service} onChange={(e) => setService(e.target.value)} style={inputStyle}>
                {SERVICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.value === ''}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Vehicle (optional)">
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="e.g. 2011 335i, 135i, Z4 35i"
                style={inputStyle}
              />
            </FieldLabel>

            <FieldLabel label="Message *">
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your setup, what you've done so far, and what you need help with..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
              />
            </FieldLabel>

            <button
              type="submit"
              style={{
                background: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: '1rem',
                padding: '0.75rem 1.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Send Message →
            </button>

            <p style={{ fontSize: '0.8rem', color: '#555', margin: 0 }}>
              If the form cannot submit, it opens your email client pre-filled. Or email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#6699ff' }}>
                {CONTACT_EMAIL}
              </a>{' '}
              directly.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid #333',
  borderRadius: '0.5rem',
  padding: '0.6rem 0.85rem',
  color: '#f0f0f0',
  fontSize: '0.95rem',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}
