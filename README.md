# Dead Man's Hunt Research Archive

A community notebook for Hypixel SkyBlock's Dead Man's Hunt: 116 routes (104 original records and 12 later additions), 27 grouped interpretations and 90 detailed breakdowns, developed theory pages, attributed tests, and open questions. Confirmed mechanics, player reports and speculation keep separate labels.

The existing dark layout, expandable cards, search, filters and parking lot are preserved. Research pages are generated as ordinary HTML with stable URLs; JavaScript adds filtering but is not required to read the content. AI assistance is disclosed on the site. Original reports and sources retain contributor credit.

## Preview

Node.js 22+; no third-party packages to install:

```sh
npm test
npm run build
npm run audit
npm run preview
```

Open the local URL printed by the server. On Windows, Start-Hub.cmd can use an installed Node runtime. Local builds are marked noindex. Keep the terminal open while browsing; Ctrl+C stops the preview.

## Publish after review

Follow [PUBLISHING.md](PUBLISHING.md). The manual GitHub Pages workflow validates and builds with the real HTTPS Pages URL. It publishes only the generated dist folder. No push trigger is enabled.

Use the reviewed PUBLIC_SOURCE bundle to update the repository. It contains only the selected website source files. The public build and source package use explicit file allowlists.

## Maintain

- Edit database JSON records, preserving route, theory, test, observation, source and interpretation IDs.
- web/views.js and web/interpretations.js contain the shared page renderers; web/app.js adds browser interactions.
- scripts/build.mjs creates static pages, CSV interchange tables, sitemap, robots and metadata.
- site.config.json contains optional public URL, Search Console verification value and Google Form URL. GitHub variables can supply these at deployment.
- test/ checks data fidelity, URL routing, no-JavaScript content, metadata and input escaping.
- npm run audit checks the selected source files and generated site's internal links, asset paths, metadata, external active assets and obvious credential patterns.

Research updates are not automatic. Rebuild and review after edits. The Google Form is not connected; submissions are visibly closed. Keep any real form responses private and review them before adding public records.

## Investigation Log

`database/investigations.json` holds dated editorial follow-ups, separate from theory, interpretation and test records. Each entry has a stable `L###` ID, topic, evidence labels, personal assessment and links to existing IDs. The `/investigation-log/` page offers expandable entries and topic/status filters; up to three `featured` entries appear on the homepage.

New entries start as `publication_state: "draft"`. Local noindex previews include them; public builds and public search exclude them. Only change an entry to `"approved"` after the owner approves its wording and sources. This does not publish anything: the existing manual workflow still requires a separate approved release.

Dates are documentation dates, not original discovery or test dates. For a changed assessment, append a new entry with `updates` pointing to the old ID, keep the earlier entry, and remove any old `featured` flag. Approved updates must retain an approved earlier entry. Reuse public source IDs and contributor credits. Only reviewed, publication-ready content belongs in public records.
