---
name: log-diagnostics-rules
description: Rules for creating N54 datalog diagnostic content. Use logs to teach diagnostic reasoning. Cover symptom, required channels, normal vs bad patterns, likely causes, safe checks, and the limits of what logs can conclude.
---

# Log Diagnostics Rules

## Purpose

This skill defines rules for creating public datalog diagnostic content on the N54 Wiki.

The goal is to teach diagnostic reasoning, not to diagnose individual customer vehicles.

## What This Content Is

- Reference guides for reading N54 datalogs
- Explanations of what symptoms look like in log data
- Teaching material for understanding normal vs problematic patterns

## What This Content Is Not

- Not individual customer log analysis
- Not a tune diagnostic tool
- Not a replacement for professional calibration support

## Required Content Elements

Every diagnostic guide or page must include:

1. **Symptom description** — What the driver or tuner observes
2. **Required log channels** — What must be logged to investigate this symptom
3. **Normal vs concerning patterns** — What a healthy log looks like vs a problematic one
4. **Likely causes** — What commonly causes this symptom, most to least common where known
5. **Safe checks** — What can be checked first without modifying the tune
6. **Limits of the data** — What cannot be concluded from logs alone
7. **Source confidence label**

## Hard Rules

- Do not post individual customer log data without explicit approval and sanitization
- Do not reference private tune files when explaining patterns
- Do not give instructions requiring flashing to complete a diagnosis
- Do not imply logs can diagnose something they cannot
- Do not give tune change recommendations in diagnostic content

## Normal vs Concerning Pattern Format

Use a table to compare clearly:

| Condition | Normal | Concerning |
|---|---|---|
| [Channel] at [condition] | [Normal range/pattern] | [Concerning range/pattern] |

## Source Confidence Labels

| Label | Use when |
|---|---|
| Verified | Confirmed against multiple trusted public sources |
| High confidence | Strong reasoning, corroborating sources |
| Needs validation | Plausible, needs more testing or source review |
| Do not publish | Based on private files or customer data |

## Refusal Pattern

If asked to analyze or post a specific customer log:

> "Customer log analysis is not published here without explicit approval and sanitization. This page explains the diagnostic pattern in general — here is what to look for: [explanation]"
