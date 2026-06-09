---
name: parameter-explanation-format
description: Standard format for N54 parameter explanation pages. Every parameter page must cover plain-English purpose, control strategy, related signals, log behavior, common mistakes, validation checklist, and source confidence.
---

# Parameter Explanation Format

## Purpose

This skill defines the required format for every N54 parameter documentation page on the wiki.

## Required Sections

Every parameter page must include these sections in this order:

### 1. Plain-English Purpose
What does this parameter do? Explain it in one or two sentences a tuner with logging experience can understand.

### 2. Control Strategy Context
Where does this parameter fit in the N54 ECU control logic? What does it influence? What does it not influence? What controls it upstream?

### 3. Related Public Signals, Tables, and Limits
What other parameters, maps, or measured signals interact with this one? List them. Briefly explain the relationship.

### 4. How Changes Appear in Logs
When this parameter is changed, what shows up in a datalog? Which channels change? In what direction? Are the effects immediate or require certain conditions?

### 5. Common Mistakes
What do tuners get wrong with this parameter? What adjustments commonly cause unintended side effects?

### 6. Safe Validation Checklist
A numbered checklist of steps to confirm a change is working correctly and safely. Reference specific log channels where applicable.

### 7. Source Confidence Label
One of:
- **Verified** — confirmed against multiple trusted public sources
- **High confidence** — strong reasoning with corroborating sources
- **Needs validation** — plausible, requires further testing or review
- **Do not publish** — based on private files or customer data; do not create this page

## Rules

- Do not include raw calibration values from private BIN or XDF files
- Do not write "set this to X" unless X is well-established public knowledge
- Do not reference private files
- Do not generate tune-ready outputs
- If the page requires private file data to be accurate, label it "Do not publish" and do not create it

## Quick Format Reference

```
## [Parameter Name]

**Plain-English Purpose:**
[One or two sentences]

**Control Strategy Context:**
[Where it fits, what it touches]

**Related Signals and Tables:**
- [Signal / Table] — [Relationship]

**How Changes Appear in Logs:**
[What channels, what direction, what conditions]

**Common Mistakes:**
- [Mistake and consequence]

**Safe Validation Checklist:**
1. [Step]
2. [Step]

**Source Confidence:** [Verified / High confidence / Needs validation / Do not publish]
```
