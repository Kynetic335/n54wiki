# Synergy N54 Wiki Build Notes

## Purpose

This repository powers the public Synergy N54 Wiki and Tuning School. It is intended for educational BMW N54 content, structured calibration concepts, diagnostic workflows, tune-program intake, and safe public-facing service handoff.

The repo should not expose private calibration assets or customer material.

## N54 Wiki

The wiki provides public reference content for N54 owners and tuners:

- Engine and maintenance context.
- Datalogging and diagnostic explanations.
- Hardware and fueling guidance.
- Public calibration concepts written for education, not private file disclosure.

Content should separate facts, assumptions, and validation steps. High-risk tuning topics should include safety context and avoid unsupported copy-paste values.

## Tuning School

The Tuning School teaches how N54 calibration systems interact:

- Boost, load, and torque request.
- Fueling, trims, and fuel pressure behavior.
- Ignition timing and knock response.
- VANOS, spool behavior, and drivability.
- Log-first troubleshooting workflows.

Tuning School content should stay public-safe. Do not quote raw private definitions, private map dumps, customer files, proprietary source material, or binary-level details.

## Tune Program

The Tune Program supports a review-oriented intake and admin workflow:

- Customer setup intake.
- ROM, fuel, stage, turbo type, and add-on selection.
- Admin review before export.
- Protected export summary and lead handoff.

The Tune Program is not a flashing tool and should not be presented as one. Any exported package workflow remains review-gated and separate from public educational content.

## Generate BIN Review-Mode Safety

Generate BIN and related binary workflows must remain review-mode only unless explicitly approved by the owner.

Required safety boundaries:

- Do not change Generate BIN safety gates casually.
- Do not enable customer-facing binary generation without explicit approval.
- Do not bypass stock validation, size validation, expected-byte checks, replacement checks, or owner-review requirements.
- Do not add checksum correction, flashing, tune generation, or raw binary writing features as public app behavior.
- Do not expose raw BIN, XDF, DAMOS, A2L, OLS, or customer tune data.

## Lead Capture Flow

The public contact and tune-program completion flows use `/api/contact`.

Safe lead metadata can include:

- Name.
- Email.
- Vehicle summary.
- ROM.
- Stage.
- Fuel.
- Turbo type.
- Selected add-ons.
- Human-readable message summary.

Lead capture must never include uploaded file data, BIN contents, patch JSON, raw tune data, private package data, or private customer files.

## XDF Architect Boundary

XDF Architect is separate and future-ready. It is not fully integrated into the public N54 Wiki/Tuning School app.

Do not merge XDF Architect behavior into public wiki workflows unless explicitly requested. Avoid adding public routes or UI that imply private definition-file tooling, binary authoring, or export workflows are available to general users.

## Private File Safety Policy

Private assets must remain outside public content and public routes.

Do not commit or expose:

- Raw BIN files.
- XDF, DAMOS, A2L, OLS, or similar definition files.
- Customer tune files.
- Customer logs or identifying customer material.
- Private patch packages or private source inventories.
- Hashes or file-specific fingerprints unless explicitly approved as public-safe.

When in doubt, use synthetic examples and describe concepts without source-file lineage.

## Build And Test Commands

Use these commands before reporting completion for code or content changes unless the user explicitly says not to run them:

```bash
npm run typecheck
npm test
npm run build
```

For UI-only or content-only work, still run the build unless instructed otherwise. Report skipped commands clearly.

## Final Report Checklist

Final reports should include:

- Files changed.
- Commands run and results.
- Any validation skipped.
- Any private-file or safety boundary applied.
- Any known risks or owner-review items.
