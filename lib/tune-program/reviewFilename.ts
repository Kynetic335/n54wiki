// ─── Review BIN Filename Builder — Customer-Facing ────────────────────────────
//
// Produces the download filename for a generated Review BIN. The name encodes
// the full selection and is always suffixed REVIEW so it can never be mistaken
// for a flash-ready file.
//
//   Example: I8A0S_Stage2Plus_E50_StockTurbo_REVIEW.bin
//
// Pure + server-safe — no DOM, no crypto.
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewFilenameParts {
  /** ROM family id, e.g. 'I8A0S' */
  romId: string
  /** Stage id (manifest or UI form), e.g. 'stage2+', 'stage1plus', 'hybrid-base' */
  stage: string
  /** Fuel id, e.g. '91', 'e50', 'pump' */
  fuel: string
  /** Turbo type label, e.g. 'stock', 'stock-turbo', 'hybrid', 'n20-map-hybrid-base' */
  turboType: string
}

// ─── Token formatters ─────────────────────────────────────────────────────────

function pascalToken(raw: string): string {
  return (raw ?? '')
    .replace(/\+/g, ' plus ')           // 'stage2+' → 'stage2 plus'
    .replace(/(\d)(plus)/gi, '$1 $2')   // 'stage1plus' → 'stage1 plus'
    .split(/[\s_\-/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
}

/** Stage → PascalCase. 'stage2+' / 'stage2plus' → 'Stage2Plus', 'hybrid-base' → 'HybridBase' */
export function formatStageToken(stage: string): string {
  const token = pascalToken(stage)
  return token || 'Stage'
}

/** Fuel → display token. '91' → '91', 'e50' → 'E50', 'pump' → 'Pump' */
export function formatFuelToken(fuel: string): string {
  const f = (fuel ?? '').trim()
  if (f === '') return 'Fuel'
  if (/^\d+$/.test(f)) return f // octane numbers stay as-is
  return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()
}

/** Turbo type → PascalCase. 'stock' → 'StockTurbo', 'hybrid' → 'Hybrid' */
export function formatTurboToken(turboType: string): string {
  const t = (turboType ?? '').toLowerCase()
  if (t === '' ) return 'Turbo'
  if (t === 'stock' || t === 'stock-turbo' || t === 'stockturbo') return 'StockTurbo'
  if (t === 'n20-map-stock-turbo') return 'StockTurboN20Map'
  if (t === 'n20-map-hybrid-base' || t === 'hybrid-base') return 'HybridBase'
  if (t === 'hybrid') return 'Hybrid'
  if (t === 'upgraded-stock-frame') return 'UpgradedStockFrame'
  return pascalToken(turboType) || 'Turbo'
}

// ─── Public builder ───────────────────────────────────────────────────────────

/**
 * Build the customer-facing Review BIN filename.
 * Always ends in `_REVIEW.bin`.
 *
 * @example
 *   makeCustomerReviewFilename({
 *     romId: 'I8A0S', stage: 'stage2+', fuel: 'e50', turboType: 'stock',
 *   }) // → 'I8A0S_Stage2Plus_E50_StockTurbo_REVIEW.bin'
 */
export function makeCustomerReviewFilename(parts: ReviewFilenameParts): string {
  const rom = (parts.romId ?? 'ROM').toUpperCase()
  const stage = formatStageToken(parts.stage)
  const fuel = formatFuelToken(parts.fuel)
  const turbo = formatTurboToken(parts.turboType)
  return `${rom}_${stage}_${fuel}_${turbo}_REVIEW.bin`
}
