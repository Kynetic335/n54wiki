'use client'

import Link from 'next/link'

interface TuneProgramHeaderProps {
  activePath?: string
}

const navLinks = [
  { href: '/tune-program', label: 'Overview' },
  { href: '/tune-program/packages', label: 'Packages' },
  { href: '/tune-program/select', label: 'Start Selector' },
  { href: '/tune-program/intake', label: 'Intake Form' },
  { href: '/tune-program/admin', label: 'Admin' },
]

export function TuneProgramHeader({ activePath }: TuneProgramHeaderProps) {
  return (
    <header
      style={{
        borderBottom: '1px solid #1a1a1a',
        background: '#0a0a0a',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/"
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: '#f0f0f0',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            N54 Wiki
          </Link>
          <span style={{ color: '#333', fontSize: '0.9rem' }}>/</span>
          <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.9rem' }}>
            Tune Program
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            href="/wiki"
            style={{ color: '#777', textDecoration: 'none', fontSize: '0.85rem' }}
          >
            Wiki
          </Link>
          <a
            href="https://synergybmwtuning.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.3rem 0.7rem',
              borderRadius: '0.35rem',
              background: '#2563eb',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Synergy Tuning
          </a>
        </div>
      </div>

      {/* Sub nav */}
      <nav
        style={{
          borderTop: '1px solid #111',
          padding: '0 2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '0.25rem',
          overflowX: 'auto',
        }}
      >
        {navLinks.map((link) => {
          const isActive = activePath === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'inline-block',
                padding: '0.55rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#93c5fd' : '#666',
                textDecoration: 'none',
                borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                whiteSpace: 'nowrap',
                transition: 'color 0.1s',
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
