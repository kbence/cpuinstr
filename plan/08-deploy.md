# 8 · Deployment

The app is a **fully static** Vite build — `npm run build` emits `dist/` with one
HTML file, one CSS file and one JS bundle (~61 kB gzipped, all data inlined).
There is no server, no API and no runtime config. Any static host works.

## The one real constraint: the repo is private

`kbence/cpuinstr` is private, and **GitHub Pages does not publish from a private
repository on the Free plan**. Per GitHub's own docs, Pages is available "in
public repositories with GitHub Free … and in public and private repositories
with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise
Server". So on Free, private + Pages is not an option.

Second thing worth knowing before choosing: **a Pages site is publicly reachable
even when its source repo is private.** Pages keeps your *code* private, not your
*site*. Access-controlled ("private") Pages is a GitHub Enterprise Cloud feature.
If the goal was "only I can see it", Pages is the wrong tool on any plan.

### Options

| Option | Repo stays private | Cost | Effort |
|---|---|---|---|
| **A. Make the repo public, use Pages** | ✗ | free | lowest — the workflow below, unchanged |
| **B. Stay private, upgrade to GitHub Pro** | ✓ (site still public) | ~$4/mo | same workflow |
| **C. Stay private, use Cloudflare Pages** | ✓ (site still public) | free | connect repo, one build command |
| **D. Stay private + genuinely private site** | ✓ | free | Cloudflare Pages + Cloudflare Access, or Netlify password protection (paid) |

**Recommendation: A if you don't mind the code being public** — it is a reference
app built from public datasheets, and a public repo makes the provenance trail
(`scripts/*.txt` → verified sources) part of the value. **Otherwise C**:
Cloudflare Pages builds private GitHub repos on the free tier, gives unlimited
bandwidth and a `*.pages.dev` domain, and adds Cloudflare Access in front if you
later want it locked down.

## Option A/B — GitHub Pages via Actions

Two changes are needed.

**1. `vite.config.ts` — set `base` for a project page.** A project page is served
from `https://kbence.github.io/cpuinstr/`, so asset URLs must be prefixed or every
`/assets/…` request 404s:

```ts
export default defineConfig({
  plugins: [react()],
  // project page lives under /cpuinstr/; '/' is correct for a custom domain
  base: process.env.GITHUB_ACTIONS ? '/cpuinstr/' : '/',
  test: { environment: 'node', globals: true },
})
```

**2. `.github/workflows/deploy.yml`** — build and publish on push to `main`.
`npm run build` already runs `tsc --noEmit` first, and the test suite is the real
gate on the dataset, so run both:

```yaml
name: deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build:data
      # the generated JSON is committed; fail if it drifted from the sources
      - run: git diff --exit-code src/data
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - id: deploy
        uses: actions/deploy-pages@v4
```

Then: repo **Settings → Pages → Source = GitHub Actions**. First push publishes to
`https://kbence.github.io/cpuinstr/`.

The `git diff --exit-code src/data` step is the one worth keeping regardless of
host — it turns "someone edited the JSON by hand instead of the source table"
into a red build.

## Option C — Cloudflare Pages

No repo changes at all except `base` staying `'/'` (Cloudflare serves from the
domain root, so the `GITHUB_ACTIONS` conditional above already does the right
thing).

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Authorise the GitHub app for `kbence/cpuinstr` (works on private repos).
3. Build command `npm run build`, output directory `dist`, Node version 22.
4. Deploys on every push to `main`; PRs get preview URLs automatically.

To lock the site down later: Cloudflare Access → add a self-hosted application
over the `*.pages.dev` hostname, with an email-OTP or identity-provider policy.

## Also worth adding regardless of host

A CI workflow on pull requests, so the dataset invariants gate merges rather than
only deploys:

```yaml
name: ci
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Not needed

- **No SPA rewrite rule.** State lives in the query string (`?q=`), not the path,
  so there are no deep routes to rewrite to `index.html`.
- **No environment variables or secrets.** Both Pages and Cloudflare need none —
  `GITHUB_TOKEN` is provided automatically for Pages.
- **No CDN or cache config.** Vite content-hashes asset filenames, so the defaults
  are already correct.
