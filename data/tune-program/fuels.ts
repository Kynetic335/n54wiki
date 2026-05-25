import type { Fuel } from '@/types/tune-program'

// ─── Fuel Registry ─────────────────────────────────────────────────────────────
// status: 'active'  = selectable in the Tune Program UI now.
// status: 'future'  = source BIN files detected in _private_tuning_sources/
//                     but not yet available as selectable options.
//                     Shown as greyed-out informational pills in the UI.
// ─────────────────────────────────────────────────────────────────────────────

export const fuels: Fuel[] = [
  // ── Active fuels ─────────────────────────────────────────────────────────────
  {
    id: '91',
    label: '91 oct',
    description: '91 octane premium pump gas. Baseline tune for areas where 93 is unavailable.',
    color: '#f59e0b',
    minOctane: 91,
    ethanolPercent: 10,
    status: 'active',
  },
  {
    id: '93',
    label: '93 oct',
    description: '93 octane premium pump gas. Recommended for all gasoline-based tunes.',
    color: '#10b981',
    minOctane: 93,
    ethanolPercent: 10,
    status: 'active',
  },
  {
    id: 'E30',
    label: 'E30',
    description: '30% ethanol / 70% premium pump blend. Requires flex fuel sensor or fixed blend.',
    color: '#3b82f6',
    ethanolPercent: 30,
    status: 'active',
  },
  {
    id: 'E40',
    label: 'E40',
    description: '40% ethanol blend. Good balance of power and availability in most markets.',
    color: '#8b5cf6',
    ethanolPercent: 40,
    status: 'active',
  },
  {
    id: 'E50',
    label: 'E50',
    description: '50% ethanol blend. Maximum charge cooling. Requires upgraded fuel system support.',
    color: '#ec4899',
    ethanolPercent: 50,
    status: 'active',
  },

  // ── Future fuels — source files detected, not yet active ─────────────────────
  // All three have OTS v90 BIN files in _private_tuning_sources/ (all 4 ROMs).
  // Will become active options after patch-package JSON is validated.
  {
    id: '95',
    label: '95 oct',
    description: '95 octane fuel common in European and some international markets.',
    color: '#6b7280',
    minOctane: 95,
    ethanolPercent: 5,
    status: 'future',
    statusNote: 'Source files detected — coming soon',
  },
  {
    id: 'ACN91',
    label: 'ACN91',
    description:
      'ACN-spec 91 octane — North American certification variant. Region-specific pump gas standard.',
    color: '#6b7280',
    minOctane: 91,
    status: 'future',
    statusNote: 'Source files detected — coming soon',
  },
  {
    id: 'CAD94',
    label: 'CAD94',
    description: 'Canadian 94 octane premium. Available in Quebec and some Canadian provinces.',
    color: '#6b7280',
    minOctane: 94,
    status: 'future',
    statusNote: 'Source files detected — coming soon',
  },
]

export const activeFuels = fuels.filter((f) => f.status === 'active')
export const futureFuels = fuels.filter((f) => f.status === 'future')

export const getFuelById = (id: string): Fuel | undefined =>
  fuels.find((f) => f.id === id)
