import type { MetadataRoute } from 'next'
import { guides } from '@/data/calibration/guides'
import { logDiagnostics } from '@/data/calibration/logDiagnostics'
import { categorySlugs, tuningParameters } from '@/data/calibration/tuningParameters'
import { allRecipes } from '@/data/calibration/recipes'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://synergybmwtuning.com'

const staticRoutes = [
  '/',
  '/school',
  '/diagnostics',
  '/guides',
  '/parameters',
  '/recipes',
  '/tune-program',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const statics: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '/' ? 1.0 : 0.8,
  }))

  const guideUrls: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const diagnosticUrls: MetadataRoute.Sitemap = logDiagnostics.map((d) => ({
    url: `${BASE_URL}/diagnostics/${d.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const categoryUrls: MetadataRoute.Sitemap = Object.values(categorySlugs).map((slug) => ({
    url: `${BASE_URL}/parameters/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const parameterUrls: MetadataRoute.Sitemap = tuningParameters.map((p) => ({
    url: `${BASE_URL}/parameters/${p.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const recipeUrls: MetadataRoute.Sitemap = allRecipes.map((r) => ({
    url: `${BASE_URL}/recipes/${r.rom.toLowerCase()}/${r.stage}/${r.fuel.toLowerCase()}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.65,
  }))

  return [...statics, ...guideUrls, ...diagnosticUrls, ...categoryUrls, ...parameterUrls, ...recipeUrls]
}
