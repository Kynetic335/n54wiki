#!/usr/bin/env node
// ─── Private BIN Diff Tool ─────────────────────────────────────────────────────
//
// PURPOSE:
//   Compare a stock N54 BIN against a tuned N54 BIN (byte-by-byte) and produce
//   a structured JSON diff report. The report identifies changed byte regions
//   without applying any patches or modifying any files.
//
// USAGE:
//   node scripts/private/bin-diff.mjs \
//     --stock  _private_tuning_sources/N54/I8A0S_original.bin \
//     --tuned  "_private_tuning_sources/E Series N54-20250118T063230Z-001/E Series N54/v90 stage 1 91oct.bin" \
//     --rom    I8A0S \
//     --label  "v90-stage1-91oct" \
//     [--out   _private_tuning_sources/reports/]   (default)
//
// OUTPUT:
//   _private_tuning_sources/reports/<rom>-<label>-diff-<timestamp>.json
//
// SAFETY RULES:
//   - Reads from _private_tuning_sources/ only (gitignored — never committed)
//   - Writes to _private_tuning_sources/reports/ (gitignored — never committed)
//   - Does NOT write to public/, src/, app/, data/, lib/, components/, content/
//   - Does NOT modify either input BIN
//   - Does NOT extract calibration values — only records which bytes changed
//   - Output JSON contains ONLY offsets and raw hex byte pairs (stock → tuned)
//   - Report JSON is also gitignored via _private_tuning_sources/
//
// REQUIRES: Node.js 18+ (for native crypto, fs/promises)
//
// ─────────────────────────────────────────────────────────────────────────────

import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { resolve, dirname, basename, join } from 'path'
import { createHash } from 'crypto'
import { parseArgs } from 'util'

// ─── Constants ─────────────────────────────────────────────────────────────────

const VALID_SIZE = 2_097_152  // 0x200000 — all N54 MSD80/MSD81 ROMs

// ─── CLI argument parsing ──────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    stock:  { type: 'string', short: 's' },
    tuned:  { type: 'string', short: 't' },
    rom:    { type: 'string', short: 'r' },
    label:  { type: 'string', short: 'l' },
    out:    { type: 'string', short: 'o', default: '_private_tuning_sources/reports' },
    help:   { type: 'boolean', short: 'h', default: false },
  },
})

if (args.help || !args.stock || !args.tuned || !args.rom || !args.label) {
  console.log(`
N54 Private BIN Diff Tool
─────────────────────────
Usage:
  node scripts/private/bin-diff.mjs \\
    --stock  <path-to-stock-bin> \\
    --tuned  <path-to-tuned-bin> \\
    --rom    <I8A0S|IJE0S|IKM0S|INA0S> \\
    --label  <short-description> \\
    [--out   <output-dir>]  (default: _private_tuning_sources/reports)

Example:
  node scripts/private/bin-diff.mjs \\
    --stock  "_private_tuning_sources/N54/I8A0S_original.bin" \\
    --tuned  "_private_tuning_sources/E Series N54.../v90 stage 1 91oct.bin" \\
    --rom    I8A0S \\
    --label  "v90-stage1-91oct"

Output: JSON diff report written to _private_tuning_sources/reports/
`)
  process.exit(args.help ? 0 : 1)
}

// ─── Path validation ──────────────────────────────────────────────────────────

const stockPath = resolve(args.stock)
const tunedPath = resolve(args.tuned)
const outDir    = resolve(args.out)

// Safety: refuse to write outside of _private_tuning_sources/ or project root
const projectRoot = resolve('.')
const privateDir  = resolve('_private_tuning_sources')

if (!outDir.startsWith(privateDir) && !outDir.startsWith(join(projectRoot, 'scripts'))) {
  console.error(`\n❌ Output directory must be inside _private_tuning_sources/ or scripts/`)
  console.error(`   Got: ${outDir}`)
  process.exit(1)
}

if (!existsSync(stockPath)) {
  console.error(`\n❌ Stock BIN not found: ${stockPath}`)
  process.exit(1)
}

if (!existsSync(tunedPath)) {
  console.error(`\n❌ Tuned BIN not found: ${tunedPath}`)
  process.exit(1)
}

// ─── Main diff logic ──────────────────────────────────────────────────────────

async function main() {
  console.log(`\n  N54 BIN Diff — Private Tool`)
  console.log(`  ROM: ${args.rom}  Label: ${args.label}`)
  console.log(`  Stock: ${basename(stockPath)}`)
  console.log(`  Tuned: ${basename(tunedPath)}\n`)

  // Read both BINs
  const stockBuf = await readFile(stockPath)
  const tunedBuf = await readFile(tunedPath)

  // Size validation
  if (stockBuf.length !== VALID_SIZE) {
    console.error(`❌ Stock BIN size invalid: ${stockBuf.length} bytes (expected ${VALID_SIZE})`)
    process.exit(1)
  }
  if (tunedBuf.length !== VALID_SIZE) {
    console.error(`❌ Tuned BIN size invalid: ${tunedBuf.length} bytes (expected ${VALID_SIZE})`)
    process.exit(1)
  }

  console.log(`  ✓ Both files: ${VALID_SIZE.toLocaleString()} bytes (0x200000)`)

  // SHA-256 hashes (for report metadata — not for fingerprinting yet)
  const stockHash = createHash('sha256').update(stockBuf).digest('hex')
  const tunedHash = createHash('sha256').update(tunedBuf).digest('hex')

  console.log(`  Stock SHA-256: ${stockHash.slice(0, 16)}...`)
  console.log(`  Tuned SHA-256: ${tunedHash.slice(0, 16)}...`)

  // Byte-level diff
  console.log(`\n  Computing byte diff...`)

  /** @type {{ offset: number; offsetHex: string; stockByte: string; tunedByte: string }[]} */
  const diffs = []

  for (let i = 0; i < VALID_SIZE; i++) {
    if (stockBuf[i] !== tunedBuf[i]) {
      diffs.push({
        offset:    i,
        offsetHex: `0x${i.toString(16).toUpperCase().padStart(6, '0')}`,
        stockByte: stockBuf[i].toString(16).padStart(2, '0'),
        tunedByte: tunedBuf[i].toString(16).padStart(2, '0'),
      })
    }
  }

  console.log(`  Changed bytes: ${diffs.length.toLocaleString()} / ${VALID_SIZE.toLocaleString()}`)

  // Group consecutive changed bytes into regions
  const regions = groupIntoRegions(diffs)
  console.log(`  Regions (consecutive ranges): ${regions.length}`)

  // Build report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const report = {
    format:   'n54-bin-diff-v1',
    generated: new Date().toISOString(),
    tool:     'scripts/private/bin-diff.mjs',
    warning:  'PRIVATE — DO NOT COMMIT — DO NOT PUBLISH — FOR INTERNAL USE ONLY',
    rom:      args.rom,
    label:    args.label,
    stockFile: basename(stockPath),
    tunedFile: basename(tunedPath),
    stockSha256: stockHash,
    tunedSha256: tunedHash,
    stats: {
      totalBytes:       VALID_SIZE,
      changedBytes:     diffs.length,
      unchangedBytes:   VALID_SIZE - diffs.length,
      changedPercent:   ((diffs.length / VALID_SIZE) * 100).toFixed(4) + '%',
      regionCount:      regions.length,
    },
    notes: [
      'This report contains byte offsets and raw hex values only.',
      'No calibration labels, map names, or physical interpretations are included.',
      'To label regions, cross-reference offsetHex values with the corresponding XDF in TunerPro.',
      `XDF for ${args.rom}: _private_tuning_sources/N54/${args.rom}.xdf`,
    ],
    regions,
    // Full diff array excluded from default output to keep files manageable.
    // Set INCLUDE_FULL_DIFF=1 env var to include all individual byte pairs.
    diffs: process.env.INCLUDE_FULL_DIFF === '1' ? diffs : '(omitted — set INCLUDE_FULL_DIFF=1 to include)',
  }

  // Write output
  await mkdir(outDir, { recursive: true })
  const outFile = join(outDir, `${args.rom}-${args.label}-diff-${timestamp}.json`)
  await writeFile(outFile, JSON.stringify(report, null, 2), 'utf-8')

  console.log(`\n  ✓ Report written: ${outFile}`)
  console.log(`    Changed bytes:  ${diffs.length.toLocaleString()} (${report.stats.changedPercent})`)
  console.log(`    Regions:        ${regions.length}`)
  console.log(`\n  ⚠️  This file is private. Never commit or publish it.\n`)
}

// ─── Region grouper ───────────────────────────────────────────────────────────

/**
 * Groups consecutive byte-diff entries into contiguous regions.
 * Gaps <= 4 bytes are bridged (avoids splitting tightly clustered changes into tiny fragments).
 */
function groupIntoRegions(diffs) {
  if (diffs.length === 0) return []

  const BRIDGE_GAP = 4  // bridge gaps up to this many unchanged bytes
  const regions    = []
  let region       = null

  for (const d of diffs) {
    if (!region) {
      region = startRegion(d)
    } else if (d.offset <= region.endOffset + BRIDGE_GAP + 1) {
      // extend current region
      region.endOffset    = d.offset
      region.endOffsetHex = d.offsetHex
      region.byteCount    = region.endOffset - region.startOffset + 1
    } else {
      regions.push(finalizeRegion(region))
      region = startRegion(d)
    }
  }
  if (region) regions.push(finalizeRegion(region))

  return regions
}

function startRegion(diff) {
  return {
    startOffset:    diff.offset,
    startOffsetHex: diff.offsetHex,
    endOffset:      diff.offset,
    endOffsetHex:   diff.offsetHex,
    byteCount:      1,
  }
}

function finalizeRegion(r) {
  return {
    startOffset:    r.startOffset,
    startOffsetHex: r.startOffsetHex,
    endOffset:      r.endOffset,
    endOffsetHex:   r.endOffsetHex,
    byteCount:      r.byteCount,
    // Placeholder for XDF-derived label — fill manually after TunerPro review
    xdfLabel:       null,
    xdfMapGroup:    null,
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('\n❌ Diff failed:', err.message)
  process.exit(1)
})
