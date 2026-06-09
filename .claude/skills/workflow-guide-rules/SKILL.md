---
name: workflow-guide-rules
description: Rules for creating public N54 workflow guides. Public safe workflows only. No flashing, BIN writing, checksum correction, tune generation, binary patching, or private file steps.
---

# Workflow Guide Rules

## Purpose

This skill defines the rules for creating public workflow guides on the N54 Wiki.

## What These Guides Are

Step-by-step public guides that teach safe tuning processes. They teach process and validation. They do not provide private calibration steps or flash-ready outputs.

## What These Guides Are Not

- Not flash guides
- Not tune generation guides
- Not private file workflows
- Not customer-specific procedures

## Required Guide Sections

Every workflow guide must include:

1. **Goal** — What the tuner is trying to accomplish
2. **Audience** — Who this guide is for and what experience level is assumed
3. **Prerequisites** — Hardware, software, baseline conditions, knowledge required
4. **Required tools** — What is needed and why
5. **Safety notes** — What can go wrong before starting
6. **Steps** — Numbered, clear, action-oriented
7. **Validation checklist** — Numbered checklist confirming the workflow completed correctly
8. **Stop conditions** — Situations where the tuner must stop immediately
9. **Source confidence label**

## Step Format

Each step should include:
- What to do
- What to check after doing it
- What a good outcome looks like

## Stop Conditions Format

Make stop conditions visually prominent. Do not bury them in body text.

Example format:
```
STOP — Do not continue if:
- [Condition]
- [Condition]
```

## Hard Rules

- No flashing steps
- No BIN writing steps
- No checksum correction steps
- No tune generation steps
- No binary patching steps
- No steps requiring private file access
- No customer-specific tune steps

If a workflow requires one of the above, document what the step achieves conceptually and note it requires a calibration tool and appropriate access. Do not describe the private step itself.

## Source Confidence Labels

| Label | Use when |
|---|---|
| Verified | Confirmed against multiple trusted public sources |
| High confidence | Strong reasoning, corroborating sources |
| Needs validation | Plausible, needs more testing or source review |
| Do not publish | Based on private files or customer data |

## Refusal Pattern

If asked to write a workflow that includes unsafe steps:

> "This workflow can be documented for the public wiki up to the point where it requires [flashing / private file access / etc.]. That step is not documented here. Here is the public-safe version: [guide without unsafe steps]"
