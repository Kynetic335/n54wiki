---
name: n54-parameter-explanation-format
description: Format for public N54 calibration parameter explanations. Use when documenting, revising, or reviewing N54 tables, scalars, channels, limits, or calibration concepts for the Synergy N54 Wiki.
---

# N54 Parameter Explanation Format

Use this structure for parameter pages and glossary entries.

## Required Sections

1. Plain-English purpose.
2. Where it fits in the control strategy.
3. Related signals, tables, or limits using public names only.
4. How changes usually show up in logs.
5. Common failure modes or misinterpretations.
6. Safe validation checklist.
7. Source confidence label.

## Writing Rules

- Do not include private addresses, raw XDF/DAMOS/A2L excerpts, binary offsets, or customer values.
- Avoid prescriptive tune changes unless the value is approved public educational content.
- Explain interactions instead of treating a parameter as isolated.
- Make units, operating conditions, and assumptions explicit.
- Label speculative or context-dependent claims as `Needs validation`.

## Validation Checklist

Include log channels or observations that can confirm behavior without requiring private calibration files.
