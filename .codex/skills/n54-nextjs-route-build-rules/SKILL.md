---
name: n54-nextjs-route-build-rules
description: Next.js route and build rules for the Synergy N54 Wiki repo. Use when adding, moving, reviewing, or debugging app routes, layouts, pages, metadata, MDX routing, generated content, or build behavior.
---

# N54 Next.js Route Build Rules

Keep route work small and compatible with the existing app.

## Route Rules

- Inspect the current `app`, `src`, `content`, `components`, and config layout before editing.
- Preserve existing routes unless the user explicitly asks for changes.
- Do not overwrite pages, layouts, styles, components, data files, or route structure as part of guidance-only tasks.
- Use public educational route names consistent with the repo, such as `/school`, `/parameters`, `/diagnostics`, `/guides`, and `/recipes`.
- Do not add public routes for flashing, BIN writing, checksum correction, tune generation, private file browsing, or protected downloads.

## Build Rules

- For normal code or content changes, run `npm run build` unless the user explicitly says not to run builds or tests.
- If the user prohibits build/test execution, do not run them and state that validation was skipped by instruction.
- Do not treat generated build artifacts as source edits unless the repo already tracks them intentionally.

## Implementation Rules

- Prefer existing components and content loaders.
- Keep changes targeted.
- Avoid route rewrites when a content-only update is enough.
