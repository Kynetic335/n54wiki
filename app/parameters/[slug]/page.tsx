import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalibrationShell } from '@/components/calibration/CalibrationShell'
import { CategoryParameterList } from '@/components/calibration/CategoryParameterList'
import { ParameterDetail } from '@/components/calibration/ParameterDetail'
import {
  categoryIntros,
  getCategoryBySlug,
  getCategorySlug,
  getParameterById,
  getParametersByCategory,
  parameterCategories,
  tuningParameters,
} from '@/data/calibration/tuningParameters'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return [
    ...parameterCategories.map((category) => ({ slug: getCategorySlug(category) })),
    ...tuningParameters.map((parameter) => ({ slug: parameter.id })),
  ]
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://synergybmwtuning.com'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const url = `${BASE_URL}/parameters/${slug}`

  const category = getCategoryBySlug(slug)
  if (category) {
    return {
      title: `${category} Parameters`,
      description: categoryIntros[category],
      alternates: { canonical: url },
      openGraph: { title: `${category} Parameters`, description: categoryIntros[category], url },
    }
  }

  const parameter = getParameterById(slug)
  if (parameter) {
    return {
      title: parameter.canonicalName,
      description: parameter.whatItDoes,
      alternates: { canonical: url },
      openGraph: { title: parameter.canonicalName, description: parameter.whatItDoes, url },
    }
  }

  return {}
}

export default async function ParameterSlugPage({ params }: PageProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (category) {
    const parameters = getParametersByCategory(category)
    return (
      <CalibrationShell>
        <section className="cal-hero cal-compact-hero">
          <p className="cal-eyebrow">Parameter Category</p>
          <h1>{category}</h1>
          <p>{categoryIntros[category]}</p>
        </section>
        <CategoryParameterList parameters={parameters} />
      </CalibrationShell>
    )
  }

  const parameter = getParameterById(slug)
  if (!parameter) notFound()

  return (
    <CalibrationShell>
      <ParameterDetail parameter={parameter} />
    </CalibrationShell>
  )
}
