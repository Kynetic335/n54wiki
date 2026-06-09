# ROM Unlock Workflow — IJE0S and IKM0S

Private-audit workflow + checklist for the next safe unlock pass.

This doc is **process only**. It exposes no BIN, XDF, DAMOS, A2L, or tune values.
The public Tune App ships **app-safe JSON only**. Raw private files stay in
`_private_tuning_sources/` (gitignored) and are never imported by app code.

---

## Ground rules

- **Validator decides READY, not the ROM name.** `resolveGenerateBin()` enables a
  ROM only when its selected package is READY + structurally valid + has a known
  stock hash. No allowlist by ROM name.
- **Hard SHA gate.** Generate BIN hard-stops on a stock SHA-256 mismatch. Output
  is **Review BIN only** (`outputMode: "STANDARD_BIN_REVIEW_ONLY"`).
- **Do not hand-edit `safeForApp` / `safeForAppPackage` to unlock.** Promotion
  happens by re-exporting from a validated private package after audit passes.

### Current state (snapshot)

| ROM   | ROM gate     | Entries | Stock hash | App-unlocked |
|-------|--------------|---------|------------|--------------|
| I8A0S | READY        | 13      | yes        | yes          |
| INA0S | READY        | 13      | yes        | yes (N20 MAP)|
| IJE0S | READY        | 13      | yes        | yes          |
| IKM0S | READY        | 16      | yes        | yes          |

IKM0S is unlocked only for its 16 validated v90-source packages. Its eight
95/ACN91-CAD94 source selections remain disabled because no package exports
exist for them.

---

## 1. IJE0S unlock requirements

IJE0S has 13 NEEDS_AUDIT packages (150+ unmatched XDF regions). Do **not** mark
READY until every step below passes against the real stock IJE0S BIN.

- [ ] **Verify XDF coverage.** Every patched offset maps to a known XDF
      parameter. Classify each unmatched region
      (`scripts/private/ije0s-unmatched-audit.mjs`): IDENT / METADATA / CHECKSUM
      excludes are fine; UNKNOWN_BLOCK in calibration space needs owner review.
- [ ] **Verify every patch offset against the real stock IJE0S BIN.** Each offset
      lands in calibration space (`≥0x040410`), not Bosch code (`0x000000–0x03FFFF`)
      or the DATA_SET header.
- [ ] **Confirm `expectedStockHex` matches stock bytes.** Dry-run every region
      against `IJE0S_original.bin` — **0 stock-byte mismatches**.
- [ ] **Confirm `replacementHex` is correct.** Replacement bytes match the
      validated private tuned package for that stage/fuel.
- [ ] **Confirm no overlapping ranges.** `validatePatchPackage()` reports 0
      overlapping write ranges on the exported JSON.
- [ ] **Re-export app-safe patch packages** via
      `scripts/private/export-app-safe-packages.mjs` (strips all private paths).
- [ ] **Set `safeForAppPackage:true` only after validation** — by re-export, not
      by hand-editing the manifest.
- [ ] **Remove `NEEDS_FULL_XDF_AUDIT` only after the private audit passes.**

Promotion is per-package: an IJE0S stage/fuel becomes READY only when its own
exported JSON passes. Partial unlocks are allowed (one stage at a time).

---

## 2. IKM0S package promotion status

IKM0S has 16 published app-safe packages. The promotion completed with the
following checks:

- [x] **Identify the stock IKM0S BIN hash.** Registered in
      `data/tune-program/binFingerprints.ts`
      and enforced by the hard SHA gate.
- [x] **Export app-safe patch packages.** Published 16 validated JSON exports.
      No package was invented for the eight missing source selections.
- [x] **Create manifest entries** in
      `data/tune-program/patch-packages/manifest.ts`
      (`romId:'IKM0S'`, correct `stage`/`fuel`/`packageType`/`patchRegions`,
      `filename: 'ikm0s/....json'`, `sourceMapVersion:'v90-source'`).
- [x] **Validate patch JSON.** `validatePatchPackage()` passes for each exported
      file (hex parity, byteCount, ROM bounds, no overlaps, safety fields).
- [x] **Verify stock hash gate.** `getStockHashForRom('IKM0S')` resolves and the
      package `stockSha256` matches the registry.
- [x] **Exclude unknown data.** Byte `0x0470B2` is absent from every patch range.
- [x] **Mark READY only if validation passes** (`safeForApp:true` via re-export).

---

## 3. Commands to run after export

From `n54wiki-main/n54wiki-main`:

```bash
npm test          # vitest — includes audit + gate + unlock-checklist tests
npm run typecheck # tsc --noEmit
npm run build     # next build
npm run lint      # eslint
```

All four must be green before promoting any package.

---

## 4. Safety rules

- Public app gets **app-safe JSON only** — no raw BIN / XDF / DAMOS / A2L / tune.
- No raw private files in the public app or its data dirs.
- Generated files are **Review BIN only** (`STANDARD_BIN_REVIEW_ONLY`).
- **SHA mismatch hard-stops Generate BIN** — no patch is applied to a non-matching upload.
- **The validator decides READY, not the ROM name.**

---

## Audit helpers

Programmatic skeleton (pure, no fs, no private files) — for the next audit pass:

- `lib/tune-program/romUnlockChecklist.ts` — `buildRomUnlockChecklist(romId)`
  returns AUTO gates (manifest + fingerprint derived; decide `appUnlocked`) plus
  the MANUAL private-audit items above (always `status:'manual'`).
- `lib/tune-program/auditPackages.ts` — `auditAllPackages()` loads exported JSON
  from disk and reports per-package readiness (Node/test only).

Tests:

- `lib/tune-program/__tests__/romUnlockChecklist.test.ts`
- `lib/tune-program/__tests__/auditReport.test.ts`
- `lib/tune-program/__tests__/ijeIkmGate.test.ts`

The checklist's `appUnlocked` is driven **only** by AUTO gates. Manual items
track human verification and never flip a ROM to unlocked on their own.

---

## Remaining TODOs (not done in this pass)

These require **private** files and are out of scope for this public repo:

1. **IJE0S** — run the offset/expectedStockHex/replacementHex audit against
   `IJE0S_original.bin`; classify the 150+ unmatched regions; re-export;
   promote per-stage.
2. **IKM0S** — locate/confirm validated private IKM0S tuned sources; if present,
   build → export → manifest → validate → READY. If absent, leave NOT_BUILT.
3. **Byte-level fingerprints (v2)** — `signatureOffsets` still empty for all ROMs
   (`verified:false`). Populate from XDF for stronger ROM identification.
