import Link from 'next/link'

const paths = [
  {
    href: '/wiki/start-here',
    label: 'Learn the basics',
    desc: 'New to N54 tuning? Start here — engine overview, upgrade stages, and where to begin.',
  },
  {
    href: '/wiki/diagnostics/common-codes',
    label: 'Diagnose a problem',
    desc: '30FF, P0300, overboost, underboost — decoded with likely causes and diagnostic steps.',
  },
  {
    href: '/wiki/datalogging/guide',
    label: 'Read datalogs',
    desc: 'Set up MHD, log the right channels, and interpret timing corrections and fueling data.',
  },
  {
    href: '/wiki/checklist/tune-readiness',
    label: 'Prepare for tuning',
    desc: 'Run the complete pre-tune checklist — boost leaks, HPFP health, ignition, cooling.',
  },
  {
    href: '/contact',
    label: 'Contact Synergy',
    desc: 'Get a custom tune, professional log review, or a tune readiness consultation.',
  },
]

const cards = [
  {
    href: '/wiki/start-here',
    icon: '🚀',
    title: 'Start Here',
    desc: 'New to N54 tuning? This is your map — what to do first, what to fix, and what to expect.',
  },
  {
    href: '/wiki/maintenance/before-tuning',
    icon: '🔧',
    title: 'Maintenance Before Tuning',
    desc: 'Plugs, LPFP, HPFP, cooling system — the checklist that keeps your tune from killing your engine.',
  },
  {
    href: '/wiki/datalogging/guide',
    icon: '📊',
    title: 'Datalogging Guide',
    desc: 'Learn to read MHD logs, interpret boost and knock, and flag fueling issues before they hurt.',
  },
  {
    href: '/wiki/checklist/tune-readiness',
    icon: '✅',
    title: 'Tune Readiness',
    desc: 'Boost leak test, HPFP health, spark plugs, charge pipes — everything before your first flash.',
  },
  {
    href: '/wiki/diagnostics/common-codes',
    icon: '⚠️',
    title: 'Common N54 Problems',
    desc: 'Fault codes, VANOS rattles, wastegate chatter — decoded and explained for tuned cars.',
  },
  {
    href: '/wiki/synergy/services',
    icon: '🏁',
    title: 'Synergy Custom Tuning',
    desc: 'Stage 1 through single-turbo builds. Remote tunes, log reviews, and full power packages.',
  },
]

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>N54 Wiki</span>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/wiki" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem' }}>Wiki</Link>
          <Link href="/tune-program" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Tune Program</Link>
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

      {/* Hero */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '5rem 2rem 3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#1a1a2e', border: '1px solid #2563eb44', borderRadius: '2rem', padding: '0.3rem 1rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#6699ff', fontWeight: 500 }}>Powered by Synergy BMW Tuning</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.2rem', letterSpacing: '-0.03em' }}>
          N54 Wiki
        </h1>
        <p style={{ fontSize: '1.15rem', color: '#999', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          The complete BMW N54 tuning reference — engine specs, stage upgrades, datalogging, diagnostics, and fueling guides.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/wiki/start-here"
            style={{
              display: 'inline-block',
              background: '#2563eb',
              color: '#fff',
              textDecoration: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Start Here →
          </Link>
          <Link
            href="/wiki"
            style={{
              display: 'inline-block',
              background: '#1a1a1a',
              color: '#e0e0e0',
              textDecoration: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '1rem',
              border: '1px solid #333',
            }}
          >
            Browse Wiki
          </Link>
        </div>
      </div>

      {/* Quick Paths */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 2rem 3rem' }}>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', marginBottom: '1rem', textAlign: 'center' }}>
          Find what you need
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          {paths.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              title={p.desc}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#111',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                color: '#c0c0c0',
                fontWeight: 500,
                fontSize: '0.875rem',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 2rem 5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              style={{
                display: 'block',
                background: '#111',
                border: '1px solid #222',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{card.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: '#f0f0f0' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#888', lineHeight: 1.55, margin: 0 }}>
                {card.desc}
              </p>
            </Link>
          ))}
        </div>

        {/* CTA Banner */}
        <div
          style={{
            marginTop: '3rem',
            background: 'linear-gradient(135deg, #0f1f4a 0%, #1a1a2e 100%)',
            border: '1px solid #2563eb44',
            borderRadius: '1rem',
            padding: '2rem 2.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
            Need help reading your N54 log or choosing the right calibration path?
          </p>
          <p style={{ fontSize: '0.95rem', color: '#c0cfff', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            <strong style={{ color: '#fff' }}>Synergy BMW Tuning</strong> can review your setup and guide the next step — whether you're diagnosing a problem, preparing for your first tune, or pushing the build further.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/contact"
              style={{
                display: 'inline-block',
                background: '#2563eb',
                color: '#fff',
                textDecoration: 'none',
                padding: '0.65rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Talk to Synergy →
            </Link>
            <Link
              href="/wiki/checklist/tune-readiness"
              style={{
                display: 'inline-block',
                background: 'transparent',
                color: '#93c5fd',
                textDecoration: 'none',
                padding: '0.65rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1px solid #2563eb66',
              }}
            >
              Check Tune Readiness
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
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
