import Link from 'next/link'
import type { Metadata } from 'next'
import { CalibrationShell } from '@/components/calibration/CalibrationShell'
import {
  categoryIntros,
  getCategorySlug,
  getParametersByCategory,
  parameterCategories,
  tuningParameters,
} from '@/data/calibration/tuningParameters'
import { ParameterCard } from '@/components/calibration/ParameterCard'

export const metadata: Metadata = {
  title: 'Parameter Library',
  description: 'N54 MSD80/MSD81 tuning parameter library grouped by boost, fueling, ignition, VANOS, protections, and drivability.',
}

export default function ParametersPage() {
  return (
    <CalibrationShell>
      <section className="cal-hero cal-compact-hero">
        <p className="cal-eyebrow">Map Reference</p>
        <h1>Parameter Library</h1>
        <p>
          Canonical control-function explanations with I8A0S and IJE0S aliases,
          risk notes, log channels, and links into the stage recipes.
        </p>
      </section>

      <section className="cal-section">
        <div className="cal-grid">
          {parameterCategories.map((category) => (
            <Link className="cal-card" href={`/parameters/${getCategorySlug(category)}`} key={category}>
              <div className="cal-card-head">
                <h2>{category}</h2>
                <span className="cal-count">{getParametersByCategory(category).length}</span>
              </div>
              <p>{categoryIntros[category]}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="cal-section">
        <div className="cal-section-head">
          <p className="cal-eyebrow">All Parameters</p>
          <h2>Current Seed Library</h2>
        </div>
        <div className="cal-grid">
          {tuningParameters.map((parameter) => (
            <ParameterCard key={parameter.id} parameter={parameter} />
          ))}
        </div>
      </section>
    </CalibrationShell>
  )
}
