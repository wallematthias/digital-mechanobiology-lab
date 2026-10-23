# Digital Mechanobiology Lab — parallel preview

A standalone content-managed lab website, separate from the current personal website. Nothing is published.

Preview: run `python3 -m http.server 8765` in this folder and visit http://localhost:8765.

Edit copy in `content/`, then run `npm run build`. **Do not edit generated `index.html`.** See [CONTRIBUTING.md](CONTRIBUTING.md) for member/alumni updates, projects, opportunities, outreach, and publication-network refresh. Copyable examples live in `templates/content/`. Appearance is in `assets/site.css`; layout is in `templates/home.html`. The accepted animation remains in `assets/bone-overlay.js` and `assets/bone-paths.js`.

The hero uses cuboidal, plump osteoblast-inspired cells with prominent nuclei and short processes. Movement and repair are conceptual visual metaphors, not a biological simulation.

No funded positions, admissions eligibility, additional team members, or university endorsement are implied. Verify wording and the launch date before publishing. Student projects are labelled research directions rather than funded vacancies. Radio entries remain drafts until recording links are verified.

The color palette is UCalgary-inspired, without an institutional crest. The illustrative mechanical response uses jet. Pointer clicks accumulate damage; cells prioritize stronger damage and continue wandering along connected bone paths.

The selected synthetic scan-inspired image is `assets/trabecular-synthetic-slab-v1.png`, shown at its full framing with 16 larger cells. The broad trabeculae are part of the image, not artificially thickened at runtime. An approximate brightness/opacity mask retains bright and shaded foreground plates. A quadrilateral lattice is clipped to this mask at drawing time, avoiding missing whole edges near textured boundaries. Cells and wireframe render at four times the routing-grid resolution.

This is an illustrative surface, not patient imaging, measured depth segmentation, solved FE mesh, or strain/repair model. Cells and colour are clipped to the approximate foreground mask. The underlying raster image stays fixed, while mesh vertices and cells compress and shear near the pointer. Clicking adds a stronger compression/rebound pulse; repeated clicks increase its amplitude and accumulate damage that recruits cells faster. Cursor colour is centred on the actual pointer even over pores; recruitment routes from the nearest bone node. Arriving cells gradually clear damage.

When idle, only one temporary strain hotspot can exist; it must clear before another appears. Pointer engagement anywhere inside the canvas prevents new automatic hotspots and fades the existing one; after leaving, spawning resumes after three seconds. Reduced-motion mode disables geometric deformation, cell movement, and automatic hotspots, while retaining interactive colouring.

The active mesh is now a square quadrilateral grid, representing a 2D hex-element model view. Cells start randomly scattered with minimum-spacing attempts. Their routing mask expands one grid pixel beyond the visible mask to bridge small texture gaps without altering the rendered surface. Cells sense signals only within 36 connected routing steps; outside that range they wander. Random movement is faster and avoids immediate backtracking, with a 52% attraction bias when a local signal is detected. The cursor jet field has a smaller 34-grid-pixel cutoff.

Check routing with `node scripts/test-bone-paths.cjs`.

Accumulated manual damage now expands recruitment from four up to twelve cells and from 85 up to 309 connected routing steps. Committed repair cells remain until their target clears even as its health falls. Once released, they return to within 28 steps of their starting locations before being eligible for recruitment again.

Current contour/recruitment tuning: outline loops are subsampled and rounded with three Chaikin subdivision passes, using the same colour, opacity and line weight as the neutral mesh. Only the largest connected widened routing network is retained; disconnected islands have no overlay or cell spawning. Recruited cells commit to manual damage until cleared, avoiding target switches as competing site strengths change. The total recruit pool remains limited to four.

A thin black outline follows the rendered foreground mask boundary, including pore rims, to give the clipped quadrilateral grid a defined edge. The outline stays aligned to the static image/mask while interior grid nodes deform.

Home roaming now spans 80 connected routing steps instead of 18. Once returning, cells continue to within 28 steps before resuming wandering, avoiding repeated direction flips at a single home-radius boundary.

Cell orientation now eases through turns and movement preserves fractional progress between routing steps. Recruits slow down on approach and settle near their target rather than wandering after arrival. Damage repair works within 12 connected routing steps, with faster clearance; unreachable damage is not allowed to monopolize recruitment. The cursor colour represents ongoing loading and remains while hovering, independently of repaired click damage.

Latest movement tuning: wandering maintains a heading for 2–5 seconds instead of choosing a fresh direction at every pixel. Four nearest reachable cells are recruited to the strongest damage site, otherwise the cursor or single idle site. Recruitment uses a 92% directional bias and faster travel. Other cells return toward their initial locations when more than 18 routing steps away, then resume local wandering. This four-cell recruitment policy supersedes the earlier sensing-radius-only behaviour described above; signals on disconnected components may recruit fewer than four cells.

The current site builds without external npm dependencies. `npm test` checks content rendering, alumni/draft behaviour, generated pages, portrait copying, network aggregation, and the existing animation helpers. `_site/` contains only deployable assets. An optional GitHub Pages workflow is included, with manual deployment only; no repository has been created or connected.

Research connections are generated from the ORCID-matched OpenAlex author record and cached locally. They show publication affiliations, including preprints/abstracts, not a verified list of active lab collaborators. Initial import: 2026-10-02; review before public launch. Personal-context portfolio path was unavailable, so copy was grounded in user-provided future lab directions, the public personal website, public software README, publications, and ORMIR workshop evidence.

## Brand assets

The approved lab logos and graphic elements live in `assets/brand/kit/`, with individual SVG, PDF, and PNG files. The complete download is `assets/brand/digital-mechanobiology-brand-kit.zip`. The public [brand kit](https://digitalmechanobiology.ca/brand/) is generated from `templates/brand.html`; all pages use the same symbol and icons. Retain the charcoal inner ring, symmetric arches, straight lower beam edge, and thicker white linework when updating assets.

The d has a UCalgary gold (#FFCD00) centre dot and no upright indicator. Monochrome exports retain a charcoal centre dot. The kit includes the approved scanner and padded square avatar; the scanner, beam, mesh, and response remain standalone kit assets for future use.
