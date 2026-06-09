---
name: nextjs-route-build-rules
description: Route and build protection rules for the N54 Wiki Next.js app. Inspect app routes before editing. Preserve route structure. Block unsafe routes. Run npm run build when allowed.
---

# Next.js Route and Build Rules

## Purpose

This skill defines the rules for route changes and build validation in the N54 Wiki Next.js (App Router) codebase.

## Route Inspection Protocol

Before adding or changing any route:

1. Read the `app/` directory
2. Identify all existing route segments, layouts, and page files
3. Check for `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, and `route.ts` at every level
4. Identify any potential conflicts with the proposed change
5. Confirm the proposed route is within public wiki scope

## App Router Conventions

| File | Purpose |
|---|---|
| `page.tsx` | Renders the route UI |
| `layout.tsx` | Shared layout wrapping child routes |
| `loading.tsx` | Loading UI for the segment |
| `error.tsx` | Error boundary for the segment |
| `route.ts` | API route handler |
| `not-found.tsx` | 404 UI |

Segment folder naming:
- Standard segments: `lowercase-kebab-case`
- Dynamic segments: `[param]`
- Catch-all segments: `[...slug]`
- Optional catch-all: `[[...slug]]`
- Group routes (no URL impact): `(group-name)`
- Parallel routes: `@slot`

## Routes That Are Blocked

Do not create routes for any of the following — these are hard blocks:

- Flashing tool UI or flash API
- BIN writing or BIN file download
- Tune generation
- Checksum correction
- Private file browsing or download
- Customer log upload or download
- Any private calibration file access

If asked to create a blocked route, refuse and explain what a safe public alternative could look like.

## Build Protocol

After any route, layout, or structural code change:

1. Run `npm run build`
2. Check for errors and type failures
3. Report the result in Cave Man style
4. Do not report a pass if it failed

If the user has instructed not to run the build, skip it and say so clearly in the report.

## Type Checking

Run `npx tsc --noEmit` when:
- New TypeScript files are added
- Type definitions are changed
- Complex type errors are suspected

## Lint

Run `npm run lint` when lint issues are suspected or after significant changes.

## Build Report Format

```
What happened:
[What route/build work was done]

What it means:
[Clean build or specific error]

What to do next:
[Next step — fix errors or proceed]

Watch out:
[Only if there is a real failure, conflict, or skipped validation]
```
