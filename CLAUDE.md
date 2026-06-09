# CLAUDE.md — Synergy N54 Wiki

## Project Purpose

This is the **public-facing Synergy N54 Wiki and Tuning School**.

It is a Next.js (App Router) educational reference for BMW N54 engine tuning concepts, calibration theory, parameter documentation, datalog diagnostics, and workflow guides.

This repo is **NOT**:
- XDF Architect
- ECU Forge
- A private calibration file workspace
- A flashing tool
- A tune generator

---

## Public Wiki Boundaries

This repo serves public educational content only.

**Allowed:**
- Tuning school lessons explaining calibration concepts
- Parameter documentation with plain-English explanations
- Datalog diagnostic guides explaining symptoms and channels
- Public workflow guides for safe tuning processes
- UI/UX improvements to existing wiki pages
- Route work for existing or new public educational pages

**Not allowed in this repo:**
- No flashing
- No BIN writing
- No checksum correction
- No tune generation
- No binary patching
- No private file handling
- Do not expose raw private BIN files
- Do not expose private XDF files
- Do not expose private DAMOS files
- Do not expose private A2L files
- Do not expose OLS project data
- Do not expose customer tune files
- Do not expose customer logs unless explicitly approved and sanitized
- Do not create upload/download routes for private calibration files
- Do not create tooling UI for flashing, patching, or tune generation

If a request crosses into private files or unsafe tuning operations, refuse that part and give a safe public educational explanation instead.

---

## Design Rules

- Keep pages quiet, technical, readable, and scan-friendly
- Consistent with existing app design and component patterns
- Mobile-friendly
- No private tooling UI exposed in the public wiki
- Preserve existing layout, color system, and typography choices

---

## Route Rules

- Inspect `app/` directory before adding or editing any routes
- Preserve existing route structure
- Use Next.js App Router conventions
- Do not add routes for: flashing, BIN writing, tune generation, checksum correction, private file browsing, or private file downloads
- Check for App Router conflicts before creating new route folders

---

## Content Rules

- All tuning school content must be safe for public consumption
- Explain concepts, assumptions, prerequisites, validation steps, and risks
- Do not publish raw calibration values from private files
- Do not copy-paste tune values directly — explain the concept instead
- Every parameter page must include a source confidence label
- Every workflow guide must include safety notes, stop conditions, and a validation checklist

---

## Safety Rules

Before publishing any content, check:
- Does it expose private BIN, XDF, DAMOS, A2L, OLS, tune, or customer files? → Do not publish
- Does it describe flashing, BIN writing, checksum correction, or tune generation steps? → Do not publish
- Does it defeat emissions controls? → Do not publish
- Does it expose customer data or logs without approval and sanitization? → Do not publish

When in doubt, use the `n54-public-safety-reviewer` agent.

---

## Source Confidence Labels

Every parameter page, tuning lesson, and technical claim should carry one of these labels:

| Label | Meaning |
|---|---|
| **Verified** | Confirmed against multiple trusted public sources or known-good calibration data |
| **High confidence** | Strong reasoning and corroborating sources but not fully cross-validated |
| **Needs validation** | Plausible but requires further testing or source review |
| **Do not publish** | Based on private files, customer data, or unconfirmed material — keep internal only |

---

## Build and Test Requirements

- Always inspect relevant files before editing
- Prefer small, targeted changes
- For normal code and content changes, run `npm run build` unless the user explicitly says not to run builds or tests
- Run focused lint, type, or test commands when relevant
- If builds or tests are skipped because the user instructed it, say so clearly in the final report
- Do not run build or tests for Claude guidance setup tasks (agents, skills, CLAUDE.md)

---

## Final Report Requirements

After completing any task, Claude must produce a Cave Man Final Report:

```
What happened:
[Simple summary of what was done]

What it means:
[Plain-English meaning — did it work, is it safe, is anything pending]

What to do next:
[The next safe step]

Watch out:
[Only include if there is a risk, failed test, dirty repo, private file risk, build issue, or skipped validation]
```

The "Watch out" section is **only included when there is something real to flag**.

---

## Cave Man Explainer Rule

Claude must use Cave Man Explainer style when explaining:
- Repo status
- Build errors
- Test failures
- Final reports
- Next steps
- Technical issues

**Cave Man style means:**
- Simple words
- Short sentences
- No developer soup
- Say what happened
- Say what it means
- Say what to do next
- Say what to watch out for
- Do not hide risk
- Do not say something passed if it did not

---

## Agents

| Agent | Role |
|---|---|
| `n54-wiki-lead` | Main coordinator. Routes work, protects boundaries |
| `n54-tuning-school-content` | Public tuning school lessons |
| `n54-parameter-docs` | Public parameter documentation |
| `n54-log-diagnostics` | Datalog diagnostic content |
| `n54-workflow-guides` | Public step-by-step workflow guides |
| `n54-ui-ux-nextjs` | Wiki UI/UX and design |
| `n54-route-build-guardian` | Route protection and build validation |
| `n54-public-safety-reviewer` | Private file and unsafe content review |
| `cave-man-explainer` | Plain-English reporting for Justin |

## Skills

| Skill | Purpose |
|---|---|
| `tuning-school-content-rules` | Rules for creating public tuning lessons |
| `parameter-explanation-format` | Standard format for parameter pages |
| `log-diagnostics-rules` | Rules for diagnostic content |
| `workflow-guide-rules` | Rules for public workflow guides |
| `source-confidence-rules` | How to label source confidence |
| `public-safety-no-private-files` | Hard safety boundary enforcement |
| `ui-ux-design-rules` | Wiki design consistency rules |
| `nextjs-route-build-rules` | Route and build protection |
| `cave-man-explainer` | Plain-language reporting style |
