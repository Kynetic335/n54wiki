---
name: ui-ux-design-rules
description: Wiki design consistency rules. Public wiki design should be quiet, technical, readable, scan-friendly, and consistent with the existing app style. No private tooling UI.
---

# UI/UX Design Rules

## Purpose

This skill defines design standards for all public-facing pages on the N54 Wiki.

## Core Design Principles

### Quiet and Technical
The design supports the content. It does not call attention to itself. Technical content should feel like a reference, not a marketing page.

### Readable
- Comfortable line length (max ~70–80 characters for body text)
- Adequate spacing between sections
- Good contrast
- Clear visual hierarchy from heading to body to supporting detail

### Scan-Friendly
Tuners will often scan for a specific piece of information. Design for that:
- Clear `h2` and `h3` sections for major topics
- Use tables for comparisons
- Use numbered lists for ordered steps
- Use bulleted lists for unordered items
- Callout boxes for warnings, stop conditions, and important notes

### Consistent
- Match existing component patterns in the codebase before creating new ones
- Read `components/` before adding new components
- Match existing spacing, typography, and color usage
- Do not introduce a new design language without explicit instruction

### Mobile-Friendly
- All content must be readable on narrow screens
- Tables should scroll horizontally if needed, not overflow the layout
- Code blocks should scroll horizontally
- No fixed-width elements that break on mobile

## What Not to Build

- No private calibration file browser UI
- No tune upload or download UI
- No flash tool UI
- No BIN writing UI
- No customer log viewer UI (without explicit approval and sanitization)
- No admin or internal tooling exposed through public pages

## Before Editing UI

1. Read the existing component or page
2. Identify the minimum change needed
3. Check if an existing component already covers the need
4. Match the existing style exactly
5. Test on both wide and narrow viewport widths if possible

## Accessibility

- Semantic HTML — use the right element for the job
- Correct heading hierarchy — do not skip levels
- Tables need `<th>` headers
- Interactive elements must be keyboard accessible
- Do not rely on color alone to convey meaning

## After UI Changes

Run `npm run build` unless the user says not to. Report the result in Cave Man style.
