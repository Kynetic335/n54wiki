type CTAVariant = 'tune' | 'log' | 'readiness' | 'contact' | 'default'

interface CTABoxProps {
  variant?: CTAVariant
  title?: string
  body?: string
  buttonText?: string
  href?: string
}

const DEFAULTS: Record<CTAVariant, { title: string; body: string; buttonText: string; href: string }> = {
  tune: {
    title: 'Need a custom N54 tune?',
    body: 'Synergy BMW Tuning offers remote and in-person custom tunes for every N54 build — from Stage 1 bolt-ons to full single-turbo setups.',
    buttonText: 'Get a Custom Tune',
    href: '/contact?from=tune',
  },
  log: {
    title: 'Upload your log for Synergy review',
    body: 'Not sure what your datalogs are telling you? Synergy offers professional log review to spot knock, fuel issues, and boost anomalies before they cause damage.',
    buttonText: 'Submit a Log for Review',
    href: '/contact?from=log',
  },
  readiness: {
    title: 'Not sure if your car is tune-ready?',
    body: 'Run through the tune readiness checklist, or reach out to Synergy for a pre-tune consultation. Skipping this step is the #1 cause of tuning issues.',
    buttonText: 'Check Tune Readiness',
    href: '/checklist/tune-readiness',
  },
  contact: {
    title: 'Talk to a professional N54 tuner',
    body: 'Need help reading your N54 log or choosing the right calibration path? Synergy BMW Tuning can review your setup and guide the next step — whether you\'re just getting started or pushing the build further.',
    buttonText: 'Contact Synergy BMW Tuning',
    href: '/contact?from=contact',
  },
  default: {
    title: 'Get expert N54 tuning support',
    body: 'Synergy BMW Tuning specializes in N54 custom calibration, log review, and tune readiness consultation.',
    buttonText: 'Visit Synergy BMW Tuning',
    href: '/contact',
  },
}

export function CTABox({ variant = 'default', title, body, buttonText, href }: CTABoxProps) {
  const d = DEFAULTS[variant]
  const resolvedTitle = title ?? d.title
  const resolvedBody = body ?? d.body
  const resolvedButton = buttonText ?? d.buttonText
  const resolvedHref = href ?? d.href

  const isExternal = resolvedHref.startsWith('http')

  return (
    <div
      style={{
        border: '1px solid #2563eb',
        borderRadius: '0.75rem',
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        margin: '2rem 0',
      }}
    >
      <p
        style={{
          fontWeight: 700,
          fontSize: '1.05rem',
          margin: '0 0 0.4rem',
          color: '#1e3a8a',
        }}
      >
        {resolvedTitle}
      </p>
      <p style={{ margin: '0 0 1rem', color: '#374151', fontSize: '0.95rem' }}>{resolvedBody}</p>
      <a
        href={resolvedHref}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        style={{
          display: 'inline-block',
          background: '#2563eb',
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.9rem',
          padding: '0.55rem 1.25rem',
          borderRadius: '0.5rem',
          textDecoration: 'none',
        }}
      >
        {resolvedButton} →
      </a>
    </div>
  )
}
