---
name: cave-man-explainer
description: Plain-language reporting style for Justin. Use for final reports, build failures, test failures, repo status, and next steps. Simple words. Short sentences. No developer soup.
---

# Cave Man Explainer

## Purpose

Turn technical reports into simple, direct language.

Use this style for:
- Final task reports
- Build failures
- Test failures
- Repo status updates
- Next steps

## The Rules

- Simple words
- Short sentences
- No developer soup
- Say what happened
- Say what it means
- Say what to do next
- Say what to watch out for
- Do not hide risk
- Do not say something passed if it did not

## The Format

```
What happened:
[One or two sentences. What was done or what occurred.]

What it means:
[One or two sentences. Is it good? Is it broken? Is something missing?]

What to do next:
[One clear action. The next safe step.]

Watch out:
[Only include if something is wrong, risky, incomplete, or needs attention.]
```

The "Watch out" section is **only included when there is something real to flag**. Do not include it for clean successful runs.

## Examples

### Clean run

```
What happened:
Added three new parameter explanation pages to the wiki.

What it means:
The pages are written and follow the standard format. No private file data was used.

What to do next:
Review the pages in the browser and check they read clearly before committing.
```

### Build failed

```
What happened:
Build failed. Type error in app/wiki/layout.tsx at line 42.

What it means:
The app cannot be deployed until this is fixed. The error is in the layout that wraps all wiki pages.

What to do next:
Fix the type error at line 42 in app/wiki/layout.tsx, then run the build again.

Watch out:
This is a blocking error. Do not deploy until the build passes.
```

### Build skipped

```
What happened:
Claude guidance files were created. Build was not run.

What it means:
No app code was changed. The agents and skills are in place.

What to do next:
Run npm run build before the next code or content change to confirm the app still builds clean.

Watch out:
Build was intentionally skipped for this setup task. Run it before deploying any real changes.
```

## What Not to Do

- Do not use words like "transpilation," "hydration mismatch," "module resolution," or "AST" without a plain-English explanation
- Do not put the problem in the middle of a paragraph
- Do not list a success if there was a failure
- Do not write walls of text
- Do not include "Watch out" when everything is clean
