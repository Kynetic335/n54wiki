import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalibrationShell } from '@/components/calibration/CalibrationShell'
import { SourceNotes } from '@/components/calibration/SourceNotes'
import { getGuide, guides } from '@/data/calibration/guides'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }))
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://synergybmwtuning.com'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}

  const url = `${BASE_URL}/guides/${slug}`
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description: guide.summary,
      url,
      type: 'article',
    },
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.title,
    description: guide.summary,
    url: `${BASE_URL}/guides/${slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Synergy BMW Tuning',
      url: BASE_URL,
    },
  }

  return (
    <CalibrationShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="cal-detail">
        <header className="cal-hero cal-compact-hero">
          <p className="cal-eyebrow">Platform Guide</p>
          <h1>{guide.title}</h1>
          <p>{guide.summary}</p>
        </header>

        <SourceNotes references={guide.sourceReferences} />

        {guide.sections.map((section) => (
          <section className="cal-card" key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
            {section.links && (
              <div className="cal-chip-row">
                {section.links.map((link) => (
                  <Link className="cal-chip cal-chip-link" href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </article>
    </CalibrationShell>
  )
}
