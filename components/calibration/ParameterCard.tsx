import Link from 'next/link'
import type { TuningParameter } from '@/data/calibration/tuningParameters'
import { DifficultyBadge, RiskBadge } from './Badges'

export function ParameterCard({ parameter }: { parameter: TuningParameter }) {
  return (
    <Link className="cal-card cal-parameter-card" href={`/parameters/${parameter.id}`}>
      <div className="cal-card-head">
        <div>
          <p className="cal-eyebrow">{parameter.category}</p>
          <h3>{parameter.canonicalName}</h3>
        </div>
        <div className="cal-badge-row">
          <DifficultyBadge difficulty={parameter.difficulty} />
          <RiskBadge risk={parameter.riskLevel} />
        </div>
      </div>
      <p>{parameter.whatItDoes}</p>
      <div className="cal-chip-row" aria-label="ROM aliases">
        {parameter.romAliases.I8A0S && <span className="cal-chip">I8A0S: {parameter.romAliases.I8A0S}</span>}
        {parameter.romAliases.IJE0S && <span className="cal-chip">IJE0S: {parameter.romAliases.IJE0S}</span>}
      </div>
    </Link>
  )
}
