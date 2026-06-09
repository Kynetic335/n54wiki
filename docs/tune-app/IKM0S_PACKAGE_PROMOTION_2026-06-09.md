# IKM0S Package Promotion Audit

Date: 2026-06-09

## Published READY Packages

The following 16 app-safe patch JSON packages were validated and published:

- `ikm0s-stage1-91-v90`
- `ikm0s-stage1-93-v90`
- `ikm0s-stage1-e30-v90`
- `ikm0s-stage1-e50-v90`
- `ikm0s-stage1p-91-v90`
- `ikm0s-stage1p-93-v90`
- `ikm0s-stage1p-e30-v90`
- `ikm0s-stage1p-e50-v90`
- `ikm0s-stage2-91-v90`
- `ikm0s-stage2-93-v90`
- `ikm0s-stage2-e30-v90`
- `ikm0s-stage2-e50-v90`
- `ikm0s-stage3-91-v90`
- `ikm0s-stage3-93-v90`
- `ikm0s-stage3-e30-v90`
- `ikm0s-stage3-e50-v90`

All published packages are labeled `v90-source`, contain only XDF-mapped
calibration regions, and produce Review BIN output only.

## Missing Package Exports

These eight source selections do not have app-safe package exports and remain
disabled with `No matching package`:

- Stage 1 / 95
- Stage 1 / ACN91-CAD94
- Stage 1+ / 95
- Stage 1+ / ACN91-CAD94
- Stage 2 / 95
- Stage 2 / ACN91-CAD94
- Stage 3 / 95
- Stage 3 / ACN91-CAD94

No package entries were created for these selections.

## Safety Boundary

- `0x0470B2` is excluded as `UNKNOWN_EXCLUDE` from every source tune.
- IDENT, checksum, header, and ROM flag bytes are not included.
- Raw BIN files, XDF files, tuned BINs, and private paths are not published.
- Published output is never flash-ready. An external flasher must apply its
  normal checksum handling after owner review.
