# Publish and request Google indexing

Nothing is published by editing this folder. The GitHub workflow is manual.

## GitHub Pages

1. Extract the **PUBLIC_SOURCE** ZIP and upload its contents into a new GitHub repository. `package.json`, `site.config.json`, `web/`, `database/` and `.github/` must be at the repository root. Do not upload the parent research folder or the owner review bundle.
2. In **Settings → Pages**, set the build source to **GitHub Actions**. For a free account, use a public repository.
3. Open **Actions → Publish reviewed research hub → Run workflow**. Checks run before deployment. The workflow obtains the actual Pages URL, including a repository subdirectory or configured custom domain, and builds the correct asset paths, canonical URLs, sitemap and preview metadata automatically.
4. Open the deployment URL. In Pages settings enable **Enforce HTTPS** when available. Check the homepage, one theory, one interpretation, `sitemap.xml` and the social-preview PNG at that URL.
5. Share the ordinary page URL, such as `/theories/T002/` or `/interpretations/R6I009/`. Old hash links still redirect in the browser, but the new URLs have their own HTML and social metadata.

If GitHub says the Pages deployment needs approval, approve it in the repository environment. This project does not grant anyone repository access or change sharing settings.

## Verify Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console/) and add a **URL-prefix property** with the exact published HTTPS address, including the repository path and final slash. You cannot use DNS verification for a domain you do not control.
2. Choose **HTML tag** verification. Copy only the tag's `content` value.
3. In GitHub **Settings → Secrets and variables → Actions → Variables**, add a repository variable named `GOOGLE_SITE_VERIFICATION` containing that value. It is a public verification value, not your Google password or an API key. Alternatively set `google_site_verification` in `site.config.json`.
4. Run the publishing workflow again. View the homepage's page source and confirm the `google-site-verification` meta tag is present. Then click **Verify** in Search Console. Keep the tag in future builds.
5. In **Sitemaps**, submit `sitemap.xml` under the verified property. If needed, paste the full published sitemap URL.
6. Use **URL Inspection** on the homepage and representative theory/interpretation URLs. Run the live test, then request indexing. The sitemap is the main way to submit the collection.
7. Watch the Page indexing and Sitemaps reports for errors. Discovery, indexing, ranking and the displayed site name are Google's decisions; this setup does not guarantee any position or timetable.

Official instructions: [ownership verification](https://support.google.com/webmasters/answer/9008080), [sitemap submission](https://support.google.com/webmasters/answer/7451001), [URL Inspection](https://support.google.com/webmasters/answer/9012289).

## robots.txt and the website name

The build creates `robots.txt`, `sitemap.xml`, canonical tags and WebSite/WebPage/BreadcrumbList structured data. Public builds allow crawling; local review builds explicitly use `noindex` and disallow crawling. Do not upload the local `dist/` manually and expect it to be indexable: use the production workflow.

Robots files are read from the **domain root**. On a project site such as `https://name.github.io/project/`, the generated `/project/robots.txt` is not the domain's robots file. Submit the sitemap directly in Search Console. If you control `https://name.github.io/`, you can also add the project's sitemap line to that root site's robots file. Missing root robots.txt does not itself block crawling; a restrictive root file can.

The visible name and titles are **Dead Man's Hunt Research Archive** throughout. Google supports a separate search-result site-name label at a domain or subdomain root, not a repository subdirectory. For that specific feature, a `name.github.io` user-site repository or a custom domain is a better fit. Project pages can still be indexed and found through their page titles. See [Google's site-name rules](https://developers.google.com/search/docs/appearance/site-names) and [robots guidance](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt).

## Discord previews

Every HTML page includes its own Open Graph title, description, canonical URL and the local 1200×630 PNG. Discord must be able to fetch the published HTTPS URL and may cache an older preview. The metadata is present before JavaScript runs; no Discord bot, token or external tracking script is used.

## Google Form

No Google Form has been created or connected. The website says submissions are not open and labels the existing button **Download review draft**. It does not send data.

When ready, create a Google Form with a title, category, explanation, original source link, known tests, optional proposed test and optional credit name. Keep responses private, avoid unnecessary email collection and do not enable public response summaries. Add its public responder link as the `GOOGLE_FORM_URL` GitHub repository variable (or `google_form_url` in site.config.json), then redeploy. The contribution page will link to that Form instead of the local draft. Test the responder link while signed out; an edit link is not suitable.

## Manual builds and review

Node.js 22+ is required; there are no third-party npm dependencies.

```sh
npm test
npm run build
npm run audit
npm run preview
```

For a public build outside GitHub, set `SITE_URL` to the real HTTPS URL including any project path, then run `npm run build -- --production`. An empty or local URL is rejected for production. The preview server prints the matching local mount path.

The source scanner and internal-link crawler reduce common mistakes; they are not a penetration test or a guarantee about hosting security. Original Discord messages may require server membership. A login page does not prove a source was deleted.
