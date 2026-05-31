'use client'

import { useMemo, useState } from 'react'
import type { TuningParameter } from '@/data/calibration/tuningParameters'
import { ParameterCard } from './ParameterCard'

export function CategoryParameterList({ parameters }: { parameters: TuningParameter[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return parameters

    return parameters.filter((parameter) => {
      const aliases = Object.values(parameter.romAliases).join(' ')
      const searchable = [
        parameter.canonicalName,
        parameter.whatItDoes,
        parameter.dangerSigns,
        aliases,
        parameter.relatedMaps.join(' '),
        parameter.logChannels.join(' '),
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(normalized)
    })
  }, [parameters, query])

  return (
    <section className="cal-section">
      <div className="cal-filter-row">
        <label htmlFor="parameter-search">Filter this category</label>
        <input
          id="parameter-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search map name, alias, log channel..."
        />
      </div>

      <div className="cal-grid">
        {filtered.map((parameter) => (
          <ParameterCard key={parameter.id} parameter={parameter} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="cal-muted">No parameters match that filter in this category.</p>
      )}
    </section>
  )
}
