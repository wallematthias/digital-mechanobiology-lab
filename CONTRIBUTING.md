# Updating the lab website

You edit content, not page layout. Each item lives in a small Markdown file in `content/`. Copy a matching example from `templates/content/`, give it a descriptive filename, and fill in its fields. The metadata is JSON between `---` lines: keep double quotes and commas. Below it, write normal paragraphs, `## Heading`, `**bold**`, lists using `- `, and `[link text](https://...)`. Raw HTML is deliberately escaped.

## Common updates

| Update | Folder | Change |
|---|---|---|
| Add a lab member | `content/people/` | Copy person template; `status: current` |
| Move a member to alumni | Same person file | Change `"status": "current"` to `"status": "alumni"`; add `years` |
| Add a research project | `content/projects/` | Copy project template; set theme, summary and body |
| Add a student project | `content/opportunities/` | Use `direction` if exploratory; `open` only when confirmed |
| Close an opportunity | Same opportunity file | Set `status` to `closed`; it remains visible as closed |
| Hide an item | Any content folder | Set `status` to `draft`; it is excluded from the build |
| Add a publication | `content/publications/` | Copy publication template; supply DOI URL, year and journal |
| Add a radio interview | `content/outreach/` | Copy outreach template; verify recording, station and date |
| Edit a research theme | `content/research/` | Edit the existing theme file |

`order` controls ordering; smaller numbers appear first. Photos go in `assets/` and use `"image": "assets/your-photo.jpg"`. Photos are optional: initials appear when no photo is supplied. Only upload photos and information with the person's agreement.

### Temporary People layout examples

Three visible examples are in `content/people/preview-msc-student.md`, `preview-phd-student.md`, and `preview-alumni.md`. To hide them, set each file's `status` to `draft` and rebuild. To restore the alumni example, use `alumni`; use `current` for the student examples. These are layout placeholders, not actual lab members. Hide them before public launch.

The homepage shows only the PI (marked with `"pi": true`), followed by a Lab members link. All profiles appear on `people/members.html`, grouped into Principal Investigator, Staff, Postdocs, Grad Students, Undergrad / Visiting, and finally Alumni. Cards use three columns on desktop; empty categories are hidden. Set `category` to `staff`, `postdocs`, `grad-students`, or `undergrad-visiting` (omitting it defaults to Grad Students). To move a member to Alumni, change only their `status` to `alumni` and add their `years` and next position; no layout editing is needed. Old alumni-page links redirect to this page's Alumni section.

Research highlights appear at the bottom of their research area's separate page, matched by `theme` to the area's title. The homepage keeps three research overview cards side by side. `category` groups highlights within each detail page. Add optional `image`, `imageAlt`, `imageCredit`, and `url` fields to illustrate a project. Referenced local images are copied to the deployable build automatically. Images are displayed uncropped; clicking opens the full figure. Figure sources and reuse terms are recorded in `assets/research/SOURCES.md`.

Publications are grouped by year, newest first; `date` sorts within a year. The three latest publication years are displayed, with earlier years in an expandable list. Set `kind` to `Book chapter` for a chapter. Avoid listing a preprint again when its journal article is already included. Publication content is manually editable; refreshing the collaborator map does not overwrite it.

The homepage Open Positions section embeds the live public MSK Research listing, filtered to Matthias Walle. Create, edit or close recruitment postings in the MSK Research faculty workspace; the lab listing updates on page load without a rebuild or GitHub edit. The adjacent link provides direct access if the embed cannot load. Local `content/opportunities/` files retain the longer research descriptions and figures on their detail pages; they do not populate the homepage listings. The open-tools description is preserved as a draft.

## Build and preview

With Node 22 or newer:

```sh
npm run build
npm test
npm run preview
```

Then open http://localhost:8765/. If that port is already serving this folder, just rebuild and refresh. `index.html` and the `research/`, `projects/`, `opportunities/` pages are generated: edit the content or templates, not those HTML files. `_site/` is the clean publication output and is regenerated on every build. Removed/drafted items' generated pages are removed using the build manifest.

No npm packages need installing. The site is static, so member profiles and research pages work without JavaScript. The bone illustration and map use JavaScript. Google Fonts supplies the current fonts; system sans-serif fonts are the fallback.

## Publication network

```sh
npm run network:refresh
npm run build
```

This matches Matthias's OpenAlex author ID to ORCID, fetches works and institution coordinates, then replaces the cached map only after a successful import. If OpenAlex requires an API key, provide `OPENALEX_API_KEY` in your shell or GitHub secret—never commit it. A failed refresh keeps the last cache. No refresh runs on a visitor's device.

`content/network-overrides.json` supports:

- `excludeWorks`: full OpenAlex work URLs to remove incorrect matches.
- `excludeInstitutions`: full institution URLs to omit incorrect affiliations.
- `institutions`: correction objects keyed by full institution URL, e.g. `{ "display_name": "Correct name", "geo": { "latitude": 51.0, "longitude": -114.0, "city": "Calgary" } }`.

Locations reflect paper-time affiliations, not current workplaces. Counts are indexed works, including preprints and some abstracts—not a count of distinct peer-reviewed papers. The initial import has not been manually curated; review it before public launch. The map's background is public-domain Natural Earth 1:110m land geometry, from the [Natural Earth source repository](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson).

## GitHub Pages (future publication)

The provided workflow builds and tests on pull requests, but **deployment requires a manual workflow dispatch**. Put this project in a separate repository to preserve the personal site. Enable Pages with GitHub Actions in that repository's settings, then manually run the workflow when ready. The workflow uploads only `_site/`, not drafts, source notes or templates. Do not add this workflow to the personal website repository without deciding how the two sites should coexist.

Once deployed, you can use GitHub's browser editor to update a content file, review the build, and publish with the manual workflow. A scheduled network refresh can be added later if desired; nothing is scheduled now.

## Before launch

- Hide the temporary People layout examples by setting their `status` to `draft`.
- Confirm research project scope, programme routes, funding and eligibility before labelling any position open.
- Add radio appearances with verified links; the draft example is not published.
- Review the network for duplicate institutions or incorrect metadata.
- Verify that software links are publicly accessible and ready to promote.
- The hero is a synthetic conceptual illustration, not real scan data or an actual FE solution; its accessible description says so.
# Automatic OpenAlex refreshes

Two GitHub Actions check publications and the research network on the first of each month (08:23 and 08:43 UTC). They can also be run manually from Actions. Changes open or update separate review pull requests; nothing is automatically merged or published. Tests and a full build run within each refresh, since PRs created with GitHub's built-in token do not trigger the separate PR workflow.

Publication refreshes only add new Markdown files. Existing entries, including drafts, are never overwritten. Matching uses DOI, normalized title and OpenAlex ID; preprints and repository copies are skipped. Review publication type, author list and date before merging, since OpenAlex can misclassify abstracts. Put unwanted OpenAlex work URLs in `content/publication-overrides.json` under `excludeWorks` to prevent reimporting a removed record.

Network corrections belong in `content/network-overrides.json`. An unchanged network produces no date-only update. Both refreshes verify the author ORCID before writing. Failed requests leave existing data intact.

Make manual edits on main rather than the regenerating `automation/*-refresh` branches. OpenAlex's optional API key can be stored as the repository Actions secret `OPENALEX_API_KEY` if anonymous access becomes restricted. No key is currently required for these small refreshes. GitHub Actions must be allowed to create pull requests; the jobs request only contents and pull-request write permissions.
