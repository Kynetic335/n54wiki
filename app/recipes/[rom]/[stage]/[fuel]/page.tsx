import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalibrationShell } from '@/components/calibration/CalibrationShell'
import { RecipeTable } from '@/components/calibration/RecipeTable'
import { SourceNotes } from '@/components/calibration/SourceNotes'
import {
  allRecipes,
  formatStage,
  getChangesByCategory,
  getRecipe,
} from '@/data/calibration/recipes'
import { parameterCategories } from '@/data/calibration/tuningParameters'

type PageProps = {
  params: Promise<{
    rom: string
    stage: string
    fuel: string
  }>
}

export function generateStaticParams() {
  return allRecipes.map((recipe) => ({
    rom: recipe.rom.toLowerCase(),
    stage: recipe.stage,
    fuel: recipe.fuel.toLowerCase(),
  }))
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://synergybmwtuning.com'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { rom, stage, fuel } = await params
  const recipe = getRecipe(rom, stage, fuel)
  if (!recipe) return {}

  const url = `${BASE_URL}/recipes/${rom}/${stage}/${fuel}`
  return {
    title: recipe.title,
    description: recipe.calibrationIntent,
    alternates: { canonical: url },
    openGraph: { title: recipe.title, description: recipe.calibrationIntent, url },
  }
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { rom, stage, fuel } = await params
  const recipe = getRecipe(rom, stage, fuel)
  if (!recipe) notFound()

  const groupedChanges = getChangesByCategory(recipe)

  return (
    <CalibrationShell>
      <article className="cal-detail">
        <div className="cal-breadcrumb">
          <Link href="/recipes">Recipes</Link>
          <span>/</span>
          <span>{recipe.rom}</span>
          <span>/</span>
          <span>{formatStage(recipe.stage)}</span>
          <span>/</span>
          <span>{recipe.fuel.toUpperCase()}</span>
        </div>

        <header className="cal-hero cal-compact-hero">
          <p className="cal-eyebrow">Stage & Fuel Recipe</p>
          <h1>{recipe.title}</h1>
          <p>{recipe.calibrationIntent}</p>
          <div className="cal-chip-row cal-status-row">
            {recipe.datasetStatus && <span className="cal-chip">{recipe.datasetStatus}</span>}
            {recipe.changedParameterCount !== undefined && (
              <span className="cal-chip">{recipe.changedParameterCount} changed maps</span>
            )}
          </div>
        </header>

        <section className="cal-card">
          <h2>Hardware Assumptions</h2>
          <ul className="cal-list">
            {recipe.hardwareAssumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </section>

        <SourceNotes references={recipe.sourceReferences} />

        {(recipe.logsToVerify || recipe.failureSigns) && (
          <section className="cal-two-column">
            {recipe.logsToVerify && (
              <div className="cal-card">
                <h2>Logs To Verify</h2>
                <ul className="cal-list">
                  {recipe.logsToVerify.map((channel) => (
                    <li key={channel}>{channel}</li>
                  ))}
                </ul>
              </div>
            )}
            {recipe.failureSigns && (
              <div className="cal-card cal-warning-card">
                <h2>Failure Signs</h2>
                <ul className="cal-list">
                  {recipe.failureSigns.map((sign) => (
                    <li key={sign}>{sign}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {parameterCategories.map((category) => {
          const changes = groupedChanges[category]
          if (changes.length === 0) return null

          return (
            <section className="cal-card" key={category}>
              <p className="cal-eyebrow">{category}</p>
              <h2>{category} Changes</h2>
              <RecipeTable changes={changes} />
            </section>
          )
        })}
      </article>
    </CalibrationShell>
  )
}
