import Link from 'next/link'
import type { ReactNode } from 'react'

export function CalibrationShell({ children }: { children: ReactNode }) {
  return (
    <main className="cal-shell">
      <nav className="cal-topbar" aria-label="Calibration navigation">
        <div>
          <Link className="cal-brand" href="/">
            Synergy BMW Tuning
          </Link>
          <span style={{ display: 'block', fontSize: '.7rem', color: 'var(--cal-dim)', letterSpacing: '.04em', marginTop: '.1rem' }}>
            N54 Calibration Reference
          </span>
        </div>
        <div className="cal-navlinks">
          <Link href="/school">School</Link>
          <Link href="/tune-app">Tune App</Link>
          <Link href="/xdf-architect">XDF Architect</Link>
          <Link href="/parameters">Maps</Link>
          <Link href="/recipes">Recipes</Link>
          <Link href="/diagnostics/logs">Diagnostics</Link>
          <Link href="/guides/n54-log-review">Guides</Link>
          <Link href="/wiki">Wiki</Link>
          <Link className="cal-nav-cta" href="/contact">Get a Tune →</Link>
        </div>
      </nav>
      {children}
    </main>
  )
}
