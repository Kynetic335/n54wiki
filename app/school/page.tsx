import Link from 'next/link'
import type { Metadata } from 'next'
import { CalibrationShell } from '@/components/calibration/CalibrationShell'
import { logDiagnostics } from '@/data/calibration/logDiagnostics'
import { guides, type CalibrationGuide } from '@/data/calibration/guides'
import {
  categoryIntros,
  getCategorySlug,
  getParametersByCategory,
  parameterCategories,
} from '@/data/calibration/tuningParameters'

export const metadata: Metadata = {
  title: 'N54 Tuning School',
  description:
    'Structured BMW N54 MSD80/MSD81 tuning school for map reference, workflow guides, recipes, and log diagnostics.',
}

export default function SchoolPage() {
  const featuredGuides = [
    'pre-tune-checklist',
    'n54-log-review',
    'safe-base-map-workflow',
    'boost-oscillation-fix',
    'throttle-closure-diagnosis',
    'hpfp-lpfp-pressure-drop',
    'pump-gas-vs-e-blend',
    'turbo-type-workflow',
    'logging-basics',
    'boost-load-tuning',
    'wgdc-pid-diagnosis',
    'mhd-plus-overview',
  ]
    .map((slug) => guides.find((guide) => guide.slug === slug))
    .filter((guide): guide is CalibrationGuide => Boolean(guide))

  return (
    <CalibrationShell>
      <section className="cal-hero">
        <p className="cal-eyebrow">N54 Tuning School</p>
        <h1>Learn MSD80/MSD81 Calibration From Logs, Maps, and Recipes</h1>
        <p>
          Start with mechanical readiness, learn the real N54 map names, compare
          stock-to-tuned recipe scaffolds, then validate each change with logs.
        </p>
        <div className="cal-action-row">
          <Link className="cal-button" href="/guides/pre-tune-checklist">
            Start the Workflow
          </Link>
          <Link className="cal-button cal-button-secondary" href="/diagnostics/logs">
            Diagnose a Log
          </Link>
          <Link className="cal-button cal-button-secondary" href="/parameters">
            Open Map Reference
          </Link>
        </div>
      </section>

      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">Calibration Reference</p>
          <h2>Phase 2 Learning Modules</h2>
        </div>
        <div className="cal-grid cal-grid-compact">
          <Link className="cal-card" href="/wiki/map-reference">
            <h3>Map Reference</h3>
            <p>Every MSD80/81 map group explained: what it does, when to touch it, ROM support, and links to related workflows.</p>
          </Link>
          <Link className="cal-card" href="/wiki/workflow-guides">
            <h3>Workflow Guides</h3>
            <p>Seven step-by-step procedures for log review, boost oscillation, throttle closure, fuel pressure, and fuel/turbo strategy.</p>
          </Link>
          <Link className="cal-card" href="/wiki/log-diagnostics">
            <h3>Log Diagnostics</h3>
            <p>Symptom-first diagnostic index: boost overshoot, rail pressure crash, STFT/LTFT, torque intervention, and more.</p>
          </Link>
        </div>
      </section>

      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">Base MSD80/MSD81 Maps</p>
          <h2>Map Reference Layers</h2>
        </div>
        <div className="cal-grid">
          {parameterCategories
            .filter((category) => category !== 'MHD+')
            .map((category) => (
              <Link className="cal-card" href={`/parameters/${getCategorySlug(category)}`} key={category}>
                <div className="cal-card-head">
                  <h3>{category}</h3>
                  <span className="cal-count">{getParametersByCategory(category).length}</span>
                </div>
                <p>{categoryIntros[category]}</p>
              </Link>
            ))}
        </div>
      </section>

      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">MHD+ Custom Tables</p>
          <h2>Overrides and Modern Feature Layers</h2>
        </div>
        <div className="cal-grid cal-grid-compact">
          <Link className="cal-card" href="/parameters/mhd-plus">
            <h3>MHD+ Parameter Layer</h3>
            <p>{categoryIntros['MHD+']}</p>
          </Link>
          <Link className="cal-card" href="/guides/mhd-plus-overview">
            <h3>MHD+ Workflow Guide</h3>
            <p>Map switching, FlexFuel, custom boost ceiling, custom WGDC control, and antilag are handled as explicit feature layers.</p>
          </Link>
        </div>
      </section>

      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">Workflow Guides</p>
          <h2>Course Path</h2>
        </div>
        <div className="cal-grid cal-grid-compact">
          {featuredGuides.map((guide) => (
            <Link className="cal-card" href={`/guides/${guide.slug}`} key={guide.slug}>
              <h3>{guide.title}</h3>
              <p>{guide.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">Log Diagnostics</p>
          <h2>Symptom First</h2>
        </div>
        <div className="cal-grid cal-grid-compact">
          {logDiagnostics.map((diagnostic) => (
            <Link className="cal-card" href={`/diagnostics/${diagnostic.slug}`} key={diagnostic.slug}>
              <p className="cal-eyebrow">{diagnostic.category}</p>
              <h3>{diagnostic.title}</h3>
              <p>{diagnostic.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="cal-cta-strip">
        <p>Ready to tune your N54? Synergy provides data-first remote calibration for MSD80/MSD81.</p>
        <div className="cal-cta-strip-actions">
          <Link className="cal-button" href="/contact">Get a Custom Tune</Link>
          <Link className="cal-button cal-button-secondary" href="/contact">Submit a Log</Link>
          <Link className="cal-button cal-button-secondary" href="/guides/pre-tune-checklist">Check Readiness</Link>
        </div>
      </div>

    </CalibrationShell>
  )
}
