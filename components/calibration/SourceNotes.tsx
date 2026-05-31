import type { SourceReference } from '@/data/calibration/tuningParameters'

export function SourceNotes({ references }: { references?: SourceReference[] }) {
  if (!references || references.length === 0) return null

  return (
    <details className="cal-source-notes">
      <summary>Source Notes</summary>
      <ul className="cal-list">
        {references.map((reference) => (
          <li key={`${reference.source}-${reference.locator}`}>
            <strong>{reference.source}</strong>
            {reference.locator ? `, ${reference.locator}` : ''}
            {reference.note ? ` - ${reference.note}` : ''}
          </li>
        ))}
      </ul>
    </details>
  )
}
