# Lab content refresh implementation plan

> **For agentic workers:** Use executing-plans inline; no delegation is needed. Steps use checkbox syntax.

**Goal:** Make the lab's people, research and recruitment specific and evidence-based.

**Architecture:** Preserve the static Markdown collections and existing animation. Extend project metadata with optional images and categories, and group publication rendering by year.

**Tech Stack:** Node 22+, HTML/CSS, Markdown with JSON front matter.

**Spec:** `docs/superpowers/specs/2026-10-02-content-refresh.md`

## Global constraints

- Do not alter the personal website or publish the preview.
- Do not invent degrees, project access, funding or NASA leadership.
- Exactly two visible student directions; keep other opportunities drafted.
- Optional images must be included in the deployable build and path-validated.

### Task 1: Illustrated content and publication organization

Files: `scripts/test-build.mjs`, `scripts/build.mjs`, `assets/site.css`, `templates/content/project.md`, `CONTRIBUTING.md`.

- [ ] Add integration tests: a project with `image: assets/research/example.jpg` appears with alt text and attribution and its image is copied to `_site`; `assets/../secret.jpg` is rejected; publications with orders opposed to years still render newest first and older work remains accessible.
- [ ] Run `node --test scripts/test-build.mjs` and verify new assertions fail before implementation.
- [ ] Extend project rendering with optional figures, category headings and reusable asset copying. Sort publications descending by year and expose older years in HTML details.
- [ ] Run the same tests and verify all pass.

### Task 2: Evidence-based content

Files: `templates/home.html`, `content/people/matthias-walle.md`, `content/research/*.md`, `content/opportunities/*.md`, `content/projects/*.md`, `content/publications/*.md`, `assets/research/*`, `assets/research/SOURCES.md`.

- [ ] Replace descriptive homepage headings, PI biography and education; add student profile.
- [ ] Write the two approved student directions, explicitly connecting mechanical environment to biological activity and progression. Draft the open-tools opportunity.
- [ ] Add the requested technical/applications highlights and verify figure permissions/source attribution.
- [ ] Expand journal publications and identify the book chapter separately; omit preprints, conference abstracts and duplicate repositories.
- [ ] Run `npm test` and `npm run build`; check local links and compare responsive browser screenshots. Report unresolved source/metadata limitations without claiming exhaustive coverage.
