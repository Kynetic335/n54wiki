---
name: n54-source-confidence-rules
description: Source confidence labeling for Synergy N54 Wiki content. Use when adding, reviewing, or revising technical claims, lessons, diagnostics, calibration explanations, or workflow pages.
---

# N54 Source Confidence Rules

Attach source confidence to technical claims that affect calibration, diagnostics, safety, legality, or mechanical decisions.

## Labels

- `Verified`: Confirmed by approved public repo content, official documentation, or cited reputable public sources.
- `High confidence`: Supported by multiple reputable public sources or well-established N54 practice, but not directly verified in repo source material.
- `Needs validation`: Plausible or context-dependent. Requires logs, vehicle configuration, or expert review before being treated as settled.
- `Do not publish`: Based on private BIN, XDF, DAMOS, A2L, OLS, customer tune, customer log, or non-public source material.

## Rules

- Use `Do not publish` as a hard stop for public content.
- Prefer lower confidence when source lineage is unclear.
- Do not launder private-file knowledge into public wording.
- Include public citations when available and useful.
- Mark assumptions explicitly.
