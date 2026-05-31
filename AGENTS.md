# Synergy N54 Wiki / Tuning School Agent Rules

## Project Purpose

This repository is the public-facing Synergy N54 Wiki and Tuning School. Treat it as an educational documentation and learning site for BMW N54 calibration concepts, diagnostics, workflows, and public reference material.

This repo is not XDF Architect, not ECU Forge, and not a private calibration file workspace.

## Public Wiki Boundaries

- Publish approved educational calibration information only.
- Do not expose, summarize, transform, embed, or quote raw private BIN, XDF, DAMOS, A2L, OLS, tune, or customer files.
- Do not add flashing workflows, BIN writing, checksum correction, tune generation, automatic patching, or private file handling.
- Do not create app features that accept, generate, patch, download, or write ECU binary files.
- Do not use private source files as page content, examples, fixtures, screenshots, or downloadable assets.
- If private material is present in the working tree, treat it as off-limits unless the user explicitly asks for a safety review of exposure risk.

## Design Rules

- Preserve the public wiki/tuning school tone: clear, technical, practical, and instructional.
- Keep UI changes consistent with the existing Next.js app, route layout, components, typography, and spacing.
- Prefer dense, scan-friendly educational pages over marketing-style pages.
- Do not introduce decorative UI that weakens readability or makes technical content harder to compare.
- Use existing components, styles, and content patterns before adding new abstractions.

## Route Rules

- Preserve the existing route structure unless the user explicitly asks for a route change.
- Do not overwrite app pages, route groups, layouts, data files, styles, or components when creating guidance.
- For new public wiki pages, use stable, descriptive routes such as `/school`, `/parameters`, `/diagnostics`, `/guides`, and `/recipes` when consistent with the existing app.
- Do not add public routes for private file browsers, BIN generators, flashing tools, checksum tools, or tune-download workflows.

## Content Rules

- Explain calibration concepts in public, educational terms.
- Include assumptions, prerequisites, risks, and validation steps where relevant.
- Separate facts from interpretation.
- Avoid claiming exact tables, addresses, private scalar values, proprietary definitions, or customer-specific calibration details unless they are already approved public content in this repo.
- Prefer parameter explanations, log interpretation, diagnostic reasoning, and workflow guidance over prescriptive tune changes.
- Do not provide copy-paste tune values for unsafe or unverifiable changes.

## Safety Rules

- Treat all calibration content as potentially safety-relevant.
- Include cautions for emissions compliance, mechanical limits, fuel quality, boost control, knock response, fueling headroom, temperature limits, and datalog validation where applicable.
- Do not present guidance as a substitute for professional calibration review.
- Do not help bypass emissions controls, disable safety monitors, defeat diagnostics, or conceal faults.
- If a request asks for unsafe tuning, private files, flashing, binary patching, checksum correction, or tune generation, refuse that part and offer a public educational explanation instead.

## Source Confidence Labels

Use confidence labels when adding or revising technical content:

- `Verified`: Confirmed by approved public repo content, official documentation, or directly cited reputable public sources.
- `High confidence`: Strongly supported by multiple reputable public sources or well-established N54 calibration practice, but not directly verified in repo source material.
- `Needs validation`: Plausible or commonly discussed, but should be checked against logs, vehicle configuration, public documentation, or reviewer knowledge before publication.
- `Do not publish`: Derived from private files, customer material, raw BIN/XDF/DAMOS/A2L/OLS data, or any source that cannot be made public.

## Build And Test Requirements

- Always inspect before editing.
- Prefer small, targeted changes.
- For normal code/content changes, run `npm run build` before the final report unless the user explicitly says not to run builds or tests.
- Run focused lint/type/test commands when the touched area warrants them and the user has not prohibited test execution.
- If builds or tests are skipped because the user instructed that, state that clearly in the final report.

## Final Report Requirements

Every final report must include:

- Changed files.
- Commands run, including build/test commands, or a clear statement that none were run.
- Blocked items or skipped validation.
- Any safety boundary applied, if the request touched calibration, diagnostics, private files, or binary/tune workflows.
