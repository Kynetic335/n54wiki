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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}

  return {
    title: guide.title,
    description: guide.summary,
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  return (
    <CalibrationShell>
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
