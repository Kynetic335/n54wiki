/**
 * Link integrity test.
 *
 * Catches broken internal hrefs as the wiki grows.
 * Strategy: build the full valid-route Set from data files and known static
 * routes, then assert every hardcoded href used in pages/components is a member.
 */

import { describe, it, expect } from 'vitest'
import { guides } from '@/data/calibration/guides'
import { logDiagnostics } from '@/data/calibration/logDiagnostics'
import { tuningParameters, categorySlugs } from '@/data/calibration/tuningParameters'
import { allRecipes, getRecipePath } from '@/data/calibration/recipes'

// ── Build valid route set ────────────────────────────────────────────────────

const staticRoutes = new Set([
  '/',
  '/school',
  '/guides',
  '/diagnostics',
  '/parameters',
  '/recipes',
  '/contact',
  '/tune-program',
  '/tune-program/packages',
  '/tune-program/select',
  '/tune-program/intake',
  '/tune-program/export',
  '/tune-program/admin',
  '/xdf-architect',
  '/wiki',
  // Known wiki MDX routes referenced by hardcoded hrefs
  '/wiki/start-here',
  '/wiki/log-diagnostics',
  '/wiki/map-reference',
  '/wiki/workflow-guides',
])

const guideRoutes = new Set(guides.map((g) => `/guides/${g.slug}`))
const diagnosticRoutes = new Set(logDiagnostics.map((d) => `/diagnostics/${d.slug}`))
const parameterRoutes = new Set([
  ...Object.values(categorySlugs).map((s) => `/parameters/${s}`),
  ...tuningParameters.map((p) => `/parameters/${p.id}`),
])
const recipeRoutes = new Set(allRecipes.map(getRecipePath))

function isValidRoute(href: string): boolean {
  return (
    staticRoutes.has(href) ||
    guideRoutes.has(href) ||
    diagnosticRoutes.has(href) ||
    parameterRoutes.has(href) ||
    recipeRoutes.has(href)
  )
}

// ── Hardcoded hrefs extracted from app/ and components/ ─────────────────────
// Update this list when new hardcoded links are added to pages or components.

const hardcodedHrefs = [
  // Root / shell
  '/',
  '/school',
  '/contact',
  '/tune-program',
  '/wiki',
  // Homepage / school CTAs
  '/guides',
  '/diagnostics',
  '/parameters',
  '/recipes',
  // Wiki section links
  '/wiki/start-here',
  '/wiki/log-diagnostics',
  '/wiki/map-reference',
  '/wiki/workflow-guides',
  // Specific guide links (hardcoded in pages/components)
  '/guides/pre-tune-checklist',
  '/guides/mhd-plus-overview',
  '/guides/n54-log-review',
  // Specific diagnostic links
  '/diagnostics/logs',
  // Specific parameter links
  '/parameters/mhd-plus',
  // Tune program sub-pages
  '/tune-program/packages',
  '/tune-program/select',
  '/tune-program/intake',
  '/tune-program/export',
  // XDF Architect placeholder
  '/xdf-architect',
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('data arrays are non-empty', () => {
  it('guides has entries', () => expect(guides.length).toBeGreaterThan(0))
  it('logDiagnostics has entries', () => expect(logDiagnostics.length).toBeGreaterThan(0))
  it('tuningParameters has entries', () => expect(tuningParameters.length).toBeGreaterThan(0))
  it('allRecipes has entries', () => expect(allRecipes.length).toBeGreaterThan(0))
  it('categorySlugs has all 7 categories', () => expect(Object.keys(categorySlugs).length).toBe(7))
})

describe('hardcoded hrefs resolve to valid routes', () => {
  for (const href of hardcodedHrefs) {
    it(`${href}`, () => {
      expect(isValidRoute(href), `"${href}" has no matching route`).toBe(true)
    })
  }
})

describe('guide slugs used in data are self-consistent', () => {
  it('every guide has a non-empty slug', () => {
    for (const g of guides) {
      expect(g.slug.length, `guide "${g.title}" has empty slug`).toBeGreaterThan(0)
    }
  })

  it('guide slugs are unique', () => {
    const slugs = guides.map((g) => g.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('diagnostic slugs used in data are self-consistent', () => {
  it('every diagnostic has a non-empty slug', () => {
    for (const d of logDiagnostics) {
      expect(d.slug.length, `diagnostic "${d.title}" has empty slug`).toBeGreaterThan(0)
    }
  })

  it('diagnostic slugs are unique', () => {
    const slugs = logDiagnostics.map((d) => d.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('relatedWorkflows slugs resolve to known guides', () => {
    for (const d of logDiagnostics) {
      if (!d.relatedWorkflows) continue
      for (const slug of d.relatedWorkflows) {
        expect(
          guideRoutes.has(`/guides/${slug}`),
          `diagnostic "${d.slug}" relatedWorkflow "${slug}" not in guides`,
        ).toBe(true)
      }
    }
  })
})

describe('parameter slugs are self-consistent', () => {
  it('parameter IDs are unique', () => {
    const ids = tuningParameters.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('recipe paths are self-consistent', () => {
  it('all recipes produce valid paths', () => {
    for (const r of allRecipes) {
      const path = getRecipePath(r)
      expect(path).toMatch(/^\/recipes\/[a-z0-9]+\/[a-z0-9-]+\/[a-z0-9-]+$/)
    }
  })

  it('recipe rom/stage/fuel combos are unique', () => {
    const paths = allRecipes.map(getRecipePath)
    expect(new Set(paths).size).toBe(paths.length)
  })
})
