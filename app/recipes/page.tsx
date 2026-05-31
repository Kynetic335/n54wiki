import Link from 'next/link'
import type { Metadata } from 'next'
import { CalibrationShell } from '@/components/calibration/CalibrationShell'
import { allRecipes, formatStage, getRecipePath } from '@/data/calibration/recipes'

export const metadata: Metadata = {
  title: 'Stage & Fuel Recipes',
  description: 'N54 I8A0S and IJE0S stage, fuel, and hybrid base tune recipe scaffolds.',
}

export default function RecipesPage() {
  return (
    <CalibrationShell>
      <section className="cal-hero cal-compact-hero">
        <p className="cal-eyebrow">How We Tune</p>
        <h1>Stage & Fuel Recipes</h1>
        <p>
          ROM-specific strategy pages that list changed parameters, stock-to-tuned
          direction, and the reason each control function moves.
        </p>
      </section>

      <section className="cal-section">
        <div className="cal-grid">
          {allRecipes.map((recipe) => (
            <Link className="cal-card" href={getRecipePath(recipe)} key={`${recipe.rom}-${recipe.stage}-${recipe.fuel}`}>
              <div className="cal-card-head">
                <div>
                  <p className="cal-eyebrow">{recipe.rom} · {formatStage(recipe.stage)} · {recipe.fuel.toUpperCase()}</p>
                  <h2>{recipe.title}</h2>
                </div>
              </div>
              <p>{recipe.calibrationIntent}</p>
              <div className="cal-chip-row">
                {recipe.datasetStatus && <span className="cal-chip">{recipe.datasetStatus}</span>}
                {recipe.changedParameterCount !== undefined && (
                  <span className="cal-chip">{recipe.changedParameterCount} changed maps</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </CalibrationShell>
  )
}
