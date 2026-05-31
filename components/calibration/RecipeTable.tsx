import Link from 'next/link'
import { getParameterById } from '@/data/calibration/tuningParameters'
import type { RecipeChange } from '@/data/calibration/recipes'

export function RecipeTable({ changes }: { changes: RecipeChange[] }) {
  return (
    <div className="cal-table-wrap">
      <table className="cal-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Stock</th>
            <th>Tuned</th>
            <th>Change / Review</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change) => {
            const parameter = change.parameterId ? getParameterById(change.parameterId) : undefined
            const displayName = parameter?.canonicalName ?? change.mapName ?? change.parameterId ?? 'Unknown map'
            const rowKey = `${displayName}-${change.stock}-${change.tuned}`
            return (
              <tr key={rowKey}>
                <td>
                  {parameter ? (
                    <Link href={`/parameters/${parameter.id}`}>{parameter.canonicalName}</Link>
                  ) : (
                    displayName
                  )}
                  {change.changedCellCount !== undefined && change.totalCellCount !== undefined && (
                    <span className="cal-table-subtext">
                      {change.changedCellCount} / {change.totalCellCount} cells
                      {change.units ? ` · ${change.units}` : ''}
                    </span>
                  )}
                </td>
                <td>{change.stock}</td>
                <td>{change.tuned}</td>
                <td>
                  <span>{change.why}</span>
                  {change.reviewStatus === 'NEEDS_REVIEW' && (
                    <span className="cal-review-flag">
                      NEEDS_REVIEW{change.reviewReason ? `: ${change.reviewReason}` : ''}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
