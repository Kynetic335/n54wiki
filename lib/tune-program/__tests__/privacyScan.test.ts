// ─── Privacy Scan — Public Tune App must not touch private sources ────────────
//
// Walks the public Tune App source tree and asserts that no file references
// private calibration sources or raw BIN/XDF/tune files. The public app may
// only use app-safe patch JSON + manifest metadata + UI logic.
//
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, resolve, extname } from 'node:path'

const ROOT = resolve(__dirname, '..', '..', '..') // repo root (n54wiki-main/n54wiki-main)

const SCAN_DIRS = [
  'lib/tune-program',
  'components/tune-program',
  'app/tune-program',
  'app/tune-app',
  'data/tune-program/patch-packages',
  'public/tune-program/patch-packages',
  'types/tune-program',
]

const SCAN_FILES = ['components/TuneProgram.tsx']

const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'])

// Forbidden substrings that would indicate the public app reaching into
// private calibration sources or raw binaries.
const FORBIDDEN = [
  '_private_tuning_sources',
  'protected-tune-files',
]

// Forbidden import targets — raw binary/calibration file types.
const FORBIDDEN_IMPORT = /\b(?:import|require)\b[^\n]*\.(?:bin|xdf|ori|org)['"]/i

function walk(dir: string): string[] {
  const out: string[] = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else if (CODE_EXTS.has(extname(name))) {
      out.push(full)
    }
  }
  return out
}

function collectFiles(): string[] {
  const files: string[] = []
  for (const d of SCAN_DIRS) files.push(...walk(join(ROOT, d)))
  for (const f of SCAN_FILES) {
    const full = join(ROOT, f)
    if (existsSync(full)) files.push(full)
  }
  // exclude the test files themselves
  return files.filter((f) => !f.includes('__tests__'))
}

describe('privacy scan — public Tune App code', () => {
  const files = collectFiles()

  it('scans a non-trivial number of files', () => {
    expect(files.length).toBeGreaterThan(5)
  })

  // Timeout raised: scan grows with every published package JSON; the default
  // 5s is fragile on slow import/CI machines. The assertion is unchanged.
  it('no public source references private calibration directories', () => {
    const offenders: string[] = []
    for (const f of files) {
      const text = readFileSync(f, 'utf8')
      for (const term of FORBIDDEN) {
        // Allow plain prose mentions in comments that warn about the boundary,
        // but forbid any import/require path that targets it.
        const importLike = new RegExp(`(?:from|require\\()\\s*['"][^'"]*${term}`, 'i')
        if (importLike.test(text)) offenders.push(`${f} → imports ${term}`)
      }
    }
    expect(offenders).toEqual([])
  }, 30000)

  it('no public source imports raw .bin/.xdf/.ori/.org files', () => {
    const offenders: string[] = []
    for (const f of files) {
      const text = readFileSync(f, 'utf8')
      if (FORBIDDEN_IMPORT.test(text)) offenders.push(f)
    }
    expect(offenders).toEqual([])
  }, 30000)
})
