import Link from 'next/link'
import { CalibrationShell } from '@/components/calibration/CalibrationShell'
import {
  categoryIntros,
  getCategorySlug,
  parameterCategories,
  getParametersByCategory,
} from '@/data/calibration/tuningParameters'
import { allRecipes, getRecipePath } from '@/data/calibration/recipes'

const featuredRecipes = allRecipes.filter(
  (recipe) => recipe.fuel === '93' && recipe.stage !== 'hybrid-base',
).slice(0, 6)

const journey = [
  { num: '01', label: 'Start Here', sub: 'Engine & ECU', href: '/wiki/start-here' },
  { num: '02', label: 'School', sub: 'Calibration basics', href: '/school' },
  { num: '03', label: 'Map Reference', sub: 'Parameters', href: '/parameters' },
  { num: '04', label: 'Workflow Guides', sub: 'Step-by-step', href: '/guides/n54-log-review' },
  { num: '05', label: 'Log Diagnostics', sub: 'Symptom first', href: '/diagnostics/logs' },
  { num: '06', label: 'Tune Program', sub: 'BIN review', href: '/tune-program' },
]

const tunerWorkflows = [
  { label: 'Review a Log', desc: 'Read every control loop in order before touching any map.', href: '/guides/n54-log-review' },
  { label: 'Fix Boost Oscillation', desc: 'Separate base WGDC overshoot from PID instability.', href: '/guides/boost-oscillation-fix' },
  { label: 'Diagnose Fuel Pressure Drop', desc: 'Rail pressure first, lambda second — hardware before calibration.', href: '/guides/hpfp-lpfp-pressure-drop' },
  { label: 'Diagnose Throttle Closure', desc: 'Find the root cause before raising any ceiling or limiter.', href: '/guides/throttle-closure-diagnosis' },
  { label: 'Build a Safe Base Map', desc: 'Baseline log, then earn load, fuel, and timing in order.', href: '/guides/safe-base-map-workflow' },
  { label: 'Choose Fuel / Turbo Strategy', desc: 'Stock twins, hybrid, single — hardware defines the approach.', href: '/guides/turbo-type-workflow' },
]

const synergyCTAs = [
  { label: 'Get a Custom Tune', desc: 'Data-first N54 remote calibration for I8A0S and IJE0S.', href: '/contact' },
  { label: 'Submit a Log for Review', desc: 'Send MHD logs and get a calibration assessment.', href: '/contact' },
  { label: 'Check Tune Readiness', desc: 'Walk through the pre-tune checklist before you flash.', href: '/guides/pre-tune-checklist' },
  { label: 'Request Calibration Help', desc: 'Boost, fueling, timing, or diagnostic — describe your issue.', href: '/contact' },
]

export default function HomePage() {
  return (
    <CalibrationShell>
      {/* Hero */}
      <section className="cal-hero">
        <p className="cal-eyebrow">Synergy BMW Tuning · N54 MSD80/MSD81</p>
        <h1>Professional N54 Calibration</h1>
        <p>
          Parameter-level MSD80/81 calibration work — boost, fueling, ignition, VANOS, stage
          recipes, and data-driven workflow guides built for the N54 twin-turbo inline-six.
        </p>
        <div className="cal-disclaimer">
          Educational calibration reference only. Validate every change with logs, mechanical
          inspection, and qualified review before flashing any vehicle.
        </div>
        <div className="cal-action-row">
          <Link className="cal-button" href="/wiki/start-here">
            Start Here →
          </Link>
          <Link className="cal-button cal-button-secondary" href="/school">
            Enter Tuning School
          </Link>
          <Link className="cal-button cal-button-secondary" href="/contact">
            Get a Custom Tune →
          </Link>
        </div>
      </section>

      {/* Tuner Journey */}
      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">The Tuner Journey</p>
          <h2>Where to Start</h2>
        </div>
        <nav className="cal-journey" aria-label="Tuner learning path">
          {journey.map((step) => (
            <Link className="cal-journey-step" href={step.href} key={step.num}>
              <span className="cal-journey-num">{step.num}</span>
              <span className="cal-journey-label">{step.label}</span>
              <span className="cal-journey-sub">{step.sub}</span>
            </Link>
          ))}
        </nav>
      </section>

      {/* Tuner Workflows */}
      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">Common Workflows</p>
          <h2>Tuner Workflow Guides</h2>
        </div>
        <div className="cal-grid cal-grid-compact">
          {tunerWorkflows.map((wf) => (
            <Link className="cal-card" href={wf.href} key={wf.label}>
              <h3>{wf.label}</h3>
              <p>{wf.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Synergy CTAs */}
      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">Synergy BMW Tuning</p>
          <h2>Work With Us</h2>
        </div>
        <div className="cal-cta-grid">
          {synergyCTAs.map((cta) => (
            <Link className="cal-cta-card" href={cta.href} key={cta.label}>
              <h3>{cta.label}</h3>
              <p>{cta.desc}</p>
              <span className="cal-cta-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Parameter Library */}
      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">Map Reference</p>
          <h2>Parameter Library</h2>
        </div>
        <div className="cal-grid">
          {parameterCategories.map((category) => (
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

      {/* Stage & Fuel Recipes */}
      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">How We Tune</p>
          <h2>Stage &amp; Fuel Recipes</h2>
        </div>
        <div className="cal-grid cal-grid-compact">
          {featuredRecipes.map((recipe) => (
            <Link className="cal-card" href={getRecipePath(recipe)} key={`${recipe.rom}-${recipe.stage}-${recipe.fuel}`}>
              <p className="cal-eyebrow">{recipe.rom}</p>
              <h3>{recipe.title}</h3>
              <p>{recipe.calibrationIntent}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* XDF Architect product card */}
      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">Synergy Tools</p>
          <h2>XDF Architect</h2>
        </div>
        <Link className="cal-card" href="/xdf-architect" style={{ display: 'block' }}>
          <div className="cal-card-head">
            <h3>XDF Architect — Coming Soon</h3>
            <span className="cal-count">N54</span>
          </div>
          <p>
            Desktop tool for N54 MSD80/81/87 XDF work: identify ROMs from verified version strings,
            browse the full A2L/DAMOS parameter catalog with available vs missing coverage, and export
            TunerPro XDF files from verified data only. No BINs modified. No values guessed.
          </p>
        </Link>
      </section>

      {/* Footer CTA */}
      <section className="cal-section">
        <div className="cal-cta-strip">
          <p>Ready to tune your N54? Synergy provides data-first remote calibration for MSD80/MSD81.</p>
          <div className="cal-cta-strip-actions">
            <Link className="cal-button" href="/contact">Get a Custom Tune</Link>
            <Link className="cal-button cal-button-secondary" href="/school">Enter School</Link>
          </div>
        </div>
      </section>
    </CalibrationShell>
  )
}
