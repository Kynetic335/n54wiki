---
name: public-safety-no-private-files
description: Hard boundary enforcement for the N54 Wiki. Do not expose raw private BIN, XDF, DAMOS, A2L, OLS, tune, or customer files. Do not create upload, download, or private-file tooling.
---

# Public Safety — No Private Files

## Purpose

This is the hard boundary for the N54 Wiki.

Nothing from private calibration files, customer tune files, or customer logs appears on the public wiki.

## What Is Prohibited

### Private Calibration Files
- Raw BIN files
- XDF definition files
- DAMOS files
- A2L files
- OLS project files

### Customer and Tune Data
- Customer tune files
- Customer BIN files
- Customer log files (unless explicitly approved and sanitized)
- Any tune values directly extracted from private files

### Unsafe Operations
- Flashing instructions or tools
- BIN writing instructions or tools
- Checksum correction instructions or tools
- Tune generation instructions or tools
- Binary patching instructions or tools

### Route and API Risk
- File upload endpoints for calibration files
- File download endpoints for private calibration files
- API routes that return private file content
- Admin or internal tooling exposed through public routes

## What Is Allowed

- Public educational explanations of how a parameter type or control strategy works
- References to parameter categories or signal names that are publicly known
- General descriptions of what a calibration tool does without providing the tool
- Workflow guides that describe process conceptually without providing private file steps
- Diagnostic guides that explain log reading without referencing private tune-specific values

## Enforcement Checklist

Before publishing any content or merging any code, check:

- [ ] No raw BIN content
- [ ] No XDF file paths or embedded XDF data
- [ ] No DAMOS or A2L content
- [ ] No OLS project references or data
- [ ] No customer tune values
- [ ] No customer log data without approval and sanitization
- [ ] No flash tool routes or UI
- [ ] No BIN download or upload routes
- [ ] No checksum correction routes or tools
- [ ] No tune generation routes or tools

If any item is checked, it is a hard block. Do not publish or merge until removed.

## Refusal Pattern

If asked to expose or use private file content:

> "This request involves private calibration file data. That content cannot be published on the public N54 Wiki. Here is what can be explained publicly: [public explanation of the concept]"

If asked to build a private file tool for the public wiki:

> "That tool type — [flashing / BIN writing / private file browser / etc.] — is not part of the public N54 Wiki. It belongs in a private workspace. Here is what the public wiki can include instead: [safe public alternative]"
