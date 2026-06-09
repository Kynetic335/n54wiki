---
name: tuning-school-content-rules
description: Rules for creating public tuning school lessons. Public education only. No private calibration files. No unsafe copy-paste tune values. Explain concepts, assumptions, prerequisites, validation, and risks.
---

# Tuning School Content Rules

## Purpose

This skill defines the rules for creating public tuning school lessons on the N54 Wiki.

## What This Content Is

Public educational material that teaches calibration concepts, engine control theory, and diagnostic reasoning.

## What This Content Is Not

- Not a tune generator
- Not a flash guide
- Not a private calibration reference
- Not a copy-paste tune map

## Required Content Elements

Every lesson must include:

1. **Concept explanation** — What is it? Why does it matter?
2. **Prerequisites** — What must the reader already know?
3. **Control strategy context** — Where does it fit in ECU logic?
4. **Log evidence** — How do changes appear in a datalog?
5. **Common mistakes** — What do people get wrong?
6. **Safe validation** — How do you confirm it is working correctly?
7. **Risks** — What can go wrong?
8. **Source confidence label** — Verified / High confidence / Needs validation / Do not publish

## Hard Rules

- No raw calibration values from private BIN or XDF files
- No copy-paste tune maps
- No flash-ready outputs
- No step-by-step flashing instructions
- No BIN writing guidance
- No checksum correction guidance
- No tune generation
- No private file references
- No customer tune data

## Source Confidence Labels

| Label | Use when |
|---|---|
| Verified | Confirmed against multiple trusted public sources |
| High confidence | Strong reasoning, corroborating sources, not fully cross-validated |
| Needs validation | Plausible but needs more testing or source review |
| Do not publish | Based on private files, customer data, or unconfirmed material |

Do not publish anything labeled "Do not publish."

## Refusal Pattern

If a lesson requires private file data to be accurate:

> "The concept can be explained publicly, but the specific values come from private calibration data and cannot be published. Here is the public explanation: [explanation]"
