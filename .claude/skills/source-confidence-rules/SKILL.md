---
name: source-confidence-rules
description: Rules for labeling source confidence on all N54 Wiki content. Use Verified, High confidence, Needs validation, or Do not publish. Anything from private files or customer material is Do not publish.
---

# Source Confidence Rules

## Purpose

Every technical claim, parameter page, lesson, and diagnostic guide on the N54 Wiki must carry a source confidence label.

This tells the reader how much to trust the information and tells the team what needs more validation before publishing.

## The Four Labels

### Verified
Confirmed against multiple trusted public sources or well-established public calibration knowledge.

Use when:
- Multiple independent public sources agree
- The claim matches known factory documentation or well-documented public research
- The claim has been validated through logging and confirmed by multiple tuners

### High confidence
Strong reasoning and corroborating sources, but not fully cross-validated against multiple independent sources.

Use when:
- One strong source with good corroborating evidence
- Logical derivation from verified facts with no contradicting information
- Community consensus with some but not complete cross-validation

### Needs validation
Plausible based on available information but requires further testing, logging confirmation, or source review before being treated as established.

Use when:
- Reasonable inference from related verified data
- Single source without strong corroboration
- Something that has not been confirmed via logging or real-world testing

### Do not publish
Based on private files, customer data, or unconfirmed material. This content must not appear on the public wiki.

Use when:
- The claim or value comes from a private BIN file
- The claim comes from a private XDF, DAMOS, A2L, or OLS file
- The content includes customer tune data or customer logs
- The claim cannot be sourced to anything other than proprietary internal data

## Rules

- Every page and every major technical claim must have a label
- Do not publish anything labeled "Do not publish"
- Do not upgrade a label without proper validation — "Needs validation" stays that way until it is actually validated
- When multiple claims on a page have different confidence levels, label each section separately
- The lowest confidence label on a page determines whether it can be published

## Label Format in Content

Use bold inline labels:

```
**Source confidence: Verified**
**Source confidence: High confidence**
**Source confidence: Needs validation**
**Source confidence: Do not publish**
```

Or in a summary box at the end of a page:

```
---
Source confidence: High confidence
Reasoning: Confirmed across public sources X and Y. Corroborated by log data from multiple users. Not yet validated against factory calibration data.
---
```
