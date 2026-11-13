# Dead Man's Hunt Research Archive

A community notebook for Hypixel SkyBlock's Dead Man's Hunt: 115 routes (104 original records and 11 later additions), 26 grouped interpretations, developed theory pages, attributed tests, and open questions. Confirmed mechanics, player reports and speculation keep separate labels.

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

Use the PUBLIC_SOURCE bundle for a new repository. Owner working notes, pending contributions and historical source snapshots are excluded from that bundle and the website. Never upload a parent research workspace wholesale. The public build and source package use explicit file allowlists.

## Maintain

- Edit database JSON records, preserving route, theory, test, observation, source and interpretation IDs.
- web/views.js and web/interpretations.js contain the shared page renderers; web/app.js adds browser interactions.
- scripts/build.mjs creates static pages, CSV interchange tables, sitemap, robots and metadata.
- site.config.json contains optional public URL, Search Console verification value and Google Form URL. GitHub variables can supply these at deployment.
- test/ checks data fidelity, URL routing, no-JavaScript content, metadata and input escaping.
- npm run audit checks the selected source files and generated site's internal links, asset paths, metadata, external active assets and obvious credential patterns.

Research updates are not automatic. Rebuild and review after edits. The Google Form is not connected; the draft-download page makes that explicit. Keep any real form responses private and review them before adding public records.
