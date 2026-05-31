import type { Difficulty, RiskLevel } from '@/data/calibration/tuningParameters'

const difficultyTone: Record<Difficulty, string> = {
  Basic: 'cal-badge-neutral',
  Intermediate: 'cal-badge-blue',
  Advanced: 'cal-badge-amber',
  Critical: 'cal-badge-red',
}

const riskTone: Record<RiskLevel, string> = {
  Low: 'cal-badge-neutral',
  Moderate: 'cal-badge-blue',
  High: 'cal-badge-amber',
  Critical: 'cal-badge-red',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`cal-badge ${difficultyTone[difficulty]}`}>{difficulty}</span>
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span className={`cal-badge ${riskTone[risk]}`}>{risk} Risk</span>
}

export function MetaBadge({ children }: { children: React.ReactNode }) {
  return <span className="cal-badge cal-badge-neutral">{children}</span>
}
