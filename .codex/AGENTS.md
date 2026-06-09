# Codex Rules For This Repository

## Scope

- This repository contains the public N54 Wiki and safety-sensitive Tune App code.
- Follow the root `AGENTS.md` public-content and calibration-safety rules.
- Inspect the requested area before editing and keep changes narrowly scoped.
- Do not modify Tune App code unless the user explicitly requests that exact work.
- Do not modify patch packages, package manifests, lockfiles, generated artifacts, or private calibration files unless the user explicitly requests an allowed maintenance task.

## Protected Material

- Treat BIN, XDF, DAMOS, A2L, OLS, tune, customer, and calibration-package files as private.
- Never expose private values or file contents in prompts, logs, fixtures, screenshots, documentation, or final reports.
- Do not add flashing, binary writing, checksum correction, tune generation, emissions bypass, or diagnostic-defeat behavior.
- Public documentation may explain concepts and validation workflows without publishing proprietary definitions or copy-paste calibration values.

## Implementation

- Preserve existing Next.js, React, TypeScript, routing, component, and content patterns.
- Prefer small edits over broad refactors.
- Do not overwrite unrelated user changes in a dirty worktree.
- Keep technical claims sourced or label their confidence as required by the root `AGENTS.md`.
- Add tests proportional to the behavior changed, especially for shared or safety-sensitive logic.

## Validation

Run commands separately from the repository root:

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. `npm run lint`

- If `npm run build` encounters a transient Turbopack panic, rerun exactly `npm run build`.
- Do not use piped or combined PowerShell commands for routine validation.
- Report exact failing files and diagnostics.
- Distinguish pre-existing failures in untouched files from failures caused by the current change.

## Final Report

- List files changed.
- List each validation command and result.
- State skipped or blocked checks.
- State any public-content, calibration-safety, or private-file boundary applied.
