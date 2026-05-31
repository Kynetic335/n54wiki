import Link from 'next/link'
import {
  getRelatedParameters,
  getCategorySlug,
  type TuningParameter,
} from '@/data/calibration/tuningParameters'
import { getGuide } from '@/data/calibration/guides'
import { DifficultyBadge, RiskBadge } from './Badges'
import { SourceNotes } from './SourceNotes'

export function ParameterDetail({ parameter }: { parameter: TuningParameter }) {
  const relatedParameters = getRelatedParameters(parameter)

  return (
    <article className="cal-detail">
      <div className="cal-breadcrumb">
        <Link href="/parameters">Parameters</Link>
        <span>/</span>
        <Link href={`/parameters/${getCategorySlug(parameter.category)}`}>{parameter.category}</Link>
      </div>

      <header className="cal-hero cal-compact-hero">
        <p className="cal-eyebrow">{parameter.category}</p>
        <h1>{parameter.canonicalName}</h1>
        <div className="cal-badge-row">
          <DifficultyBadge difficulty={parameter.difficulty} />
          <RiskBadge risk={parameter.riskLevel} />
        </div>
        <div className="cal-alias-grid">
          <div>
            <span>I8A0S alias</span>
            <code>{parameter.romAliases.I8A0S ?? 'Not mapped yet'}</code>
          </div>
          <div>
            <span>IJE0S alias</span>
            <code>{parameter.romAliases.IJE0S ?? 'Not mapped yet'}</code>
          </div>
          <div>
            <span>IKM0S alias</span>
            <code>{parameter.romAliases.IKM0S ?? <span style={{ color: 'var(--cal-amber)' }}>Needs Audit</span>}</code>
          </div>
          <div>
            <span>INA0S alias</span>
            <code>{parameter.romAliases.INA0S ?? <span style={{ color: 'var(--cal-amber)' }}>Needs Audit</span>}</code>
          </div>
        </div>
      </header>

      <section className="cal-two-column">
        <InfoBlock title="What It Does" body={parameter.whatItDoes} />
        <InfoBlock title="When To Touch" body={parameter.whenToTouch} />
        <InfoBlock title="Raising Effect" body={parameter.raisingEffect} />
        <InfoBlock title="Lowering Effect" body={parameter.loweringEffect} />
        <InfoBlock title="When Not To Touch" body={parameter.whenNotToTouch} />
        <InfoBlock title="Danger Signs" body={parameter.dangerSigns} warning />
      </section>

      <SourceNotes references={parameter.sourceReferences} />

      <section className="cal-card">
        <h2>Recommended Log Channels</h2>
        <div className="cal-chip-row">
          {parameter.logChannels.map((channel) => (
            <span className="cal-chip" key={channel}>
              {channel}
            </span>
          ))}
        </div>
      </section>

      <section className="cal-card">
        <h2>Related Maps</h2>
        <div className="cal-chip-row">
          {relatedParameters.length > 0
            ? relatedParameters.map((related) => (
                <Link className="cal-chip cal-chip-link" href={`/parameters/${related.id}`} key={related.id}>
                  {related.canonicalName}
                </Link>
              ))
            : parameter.relatedMaps.map((related) => (
                <span className="cal-chip" key={related}>
                  {related}
                </span>
              ))}
        </div>
      </section>

      {parameter.relatedWorkflows && parameter.relatedWorkflows.length > 0 && (
        <section className="cal-card">
          <h2>Related Workflows</h2>
          <div className="cal-chip-row">
            {parameter.relatedWorkflows.map((slug) => {
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

      {parameter.teachingExamples && parameter.teachingExamples.length > 0 && (
        <section className="cal-card">
          <p className="cal-eyebrow">Teaching Case</p>
          <h2>{parameter.teachingExamples[0].title}</h2>
          <div className="cal-teaching-grid">
            <TeachingField label="Situation" value={parameter.teachingExamples[0].situation} />
            <TeachingField label="Likely Cause" value={parameter.teachingExamples[0].likelyCause} />
            <TeachingList label="Log Symptoms" values={parameter.teachingExamples[0].logSymptoms} />
            <TeachingList label="Maps To Check" values={parameter.teachingExamples[0].mapsToCheck} />
            <TeachingField label="Safe Direction" value={parameter.teachingExamples[0].safeAdjustmentDirection} />
            <TeachingList label="Validation Steps" values={parameter.teachingExamples[0].validationSteps} />
          </div>
          <div className="cal-warning-inline">{parameter.teachingExamples[0].warning}</div>
        </section>
      )}
    </article>
  )
}

function InfoBlock({ title, body, warning = false }: { title: string; body: string; warning?: boolean }) {
  return (
    <div className={`cal-card ${warning ? 'cal-warning-card' : ''}`}>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  )
}

function TeachingField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  )
}

function TeachingList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <h3>{label}</h3>
      <ul className="cal-list">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  )
}
