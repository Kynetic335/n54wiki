import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalibrationShell } from '@/components/calibration/CalibrationShell'
import { SourceNotes } from '@/components/calibration/SourceNotes'
import { getLogDiagnostic, logDiagnostics } from '@/data/calibration/logDiagnostics'
import { getGuide } from '@/data/calibration/guides'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return logDiagnostics.map((diagnostic) => ({ slug: diagnostic.slug }))
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://synergybmwtuning.com'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const diagnostic = getLogDiagnostic(slug)
  if (!diagnostic) return {}

  const url = `${BASE_URL}/diagnostics/${slug}`
  return {
    title: diagnostic.title,
    description: diagnostic.summary,
    alternates: { canonical: url },
    openGraph: {
      title: diagnostic.title,
      description: diagnostic.summary,
      url,
      type: 'article',
    },
  }
}

export default async function DiagnosticPage({ params }: PageProps) {
  const { slug } = await params
  const diagnostic = getLogDiagnostic(slug)
  if (!diagnostic) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: diagnostic.title,
    description: diagnostic.summary,
    url: `${BASE_URL}/diagnostics/${slug}`,
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
        <div className="cal-breadcrumb">
          <Link href="/school">School</Link>
          <span>/</span>
          <Link href="/diagnostics/logs">Diagnostics</Link>
          <span>/</span>
          <span>{diagnostic.title}</span>
        </div>

        <header className="cal-hero cal-compact-hero">
          <p className="cal-eyebrow">{diagnostic.category}</p>
          <h1>{diagnostic.title}</h1>
          <p>{diagnostic.summary}</p>
        </header>

        <SourceNotes references={diagnostic.sourceReferences} />

        <section className="cal-grid">
          {logDiagnostics.map((item) => (
            <Link className="cal-card" href={`/diagnostics/${item.slug}`} key={item.slug}>
              <p className="cal-eyebrow">{item.category}</p>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
            </Link>
          ))}
        </section>

        {diagnostic.relatedWorkflows && diagnostic.relatedWorkflows.length > 0 && (
          <section className="cal-card">
            <h2>Related Workflows</h2>
            <div className="cal-chip-row">
              {diagnostic.relatedWorkflows.map((slug) => {
                const guide = getGuide(slug)
                return guide ? (
                  <Link className="cal-chip cal-chip-link" href={`/guides/${slug}`} key={slug}>
                    {guide.title}
                  </Link>
                ) : (
                  <span className="cal-chip" key={slug}>{slug}</span>
                )
              })}
            </div>
          </section>
        )}

        {diagnostic.cases.map((diagnosticCase) => (
          <section className="cal-card" key={diagnosticCase.title}>
            <p className="cal-eyebrow">Teaching Format</p>
            <h2>{diagnosticCase.title}</h2>
            <div className="cal-teaching-flow">
              <FlowStep label="Symptom" body={diagnosticCase.symptom} />
              <FlowList label="Log Evidence" values={diagnosticCase.logEvidence} />
              <FlowList label="Map To Inspect" values={diagnosticCase.mapsToInspect} />
              <FlowStep label="Safe Adjustment Direction" body={diagnosticCase.safeAdjustmentDirection} />
              <FlowList label="Validation" values={diagnosticCase.validation} />
            </div>
          </section>
        ))}
      </article>
    </CalibrationShell>
  )
}

function FlowStep({ label, body }: { label: string; body: string }) {
  return (
    <div className="cal-flow-step">
      <span>{label}</span>
      <p>{body}</p>
    </div>
  )
}

function FlowList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="cal-flow-step">
      <span>{label}</span>
      <ul className="cal-list">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  )
}
