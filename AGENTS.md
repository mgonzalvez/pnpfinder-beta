# PnP Finder Beta Maintenance Notes

## Stack

Static GitHub Pages app (`mgonzalvez.github.io/pnpfinder-beta`). Beta companion to
PnP Finder Lite. Vanilla HTML/CSS/JS, no build step.

## Key files

| File | Role |
|---|---|
| `index.html`, `detail.html`, `submit.html`, `tools.html` | Pages |
| `js/`, `css/` | Application code and styling |
| `data/` | Game records |
| `images/` | Artwork |

## Critical rules

1. This is a **beta**. Do not deploy it as the canonical PnP Finder; the live site
   is `pnpfinder.gonzhome.us` (the `pnpfinder-lite` repo).
2. Any data schema changes here must be checked against `pnpfinder-lite/data/`
   before either site is merged or promoted.
3. Keep the shared sticky header / Related Sites dropdown consistent with the rest
   of the family.

## Registry & provenance rule (portfolio-wide)

Personal project — completely separate from Apple work.

- No npm dependencies today. If any are ever added, commit an `.npmrc` pinning
  `registry=https://registry.npmjs.org` before the first lockfile is generated.
  Apple's internal mirror (`npm.apple.com`, `artifacts.apple.com/artifactory/...`)
  is unreachable from GitHub Actions and causes `ENOTFOUND` CI failures.
- Audit before pushing: `../scripts/check-registry.sh` (add `--fix` to normalize).
- No work credentials, internal hostnames, proprietary assets, or confidential
  material in this repo.
