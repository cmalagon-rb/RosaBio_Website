---
name: sync-liquid-biopsy
description: Pull the latest P2G liquid biopsy page and its in-page edits from the Claude artifact into public/liquid-biopsy/, regenerate the homepage Liquid Biopsy Demo data, build, and commit. Use when the liquid biopsy artifact was updated or someone asks to refresh/sync the liquid biopsy demo.
---

# Sync the Liquid Biopsy Demo from the Claude artifact

Same idea as `/sync-demo` (Single Cell Demo). The website cannot fetch claude.ai itself, so
this skill is the sync step; everything after the download is deterministic scripts. The
artifact URL is `siteContent.liquidBiopsyDemo.artifactUrl` in `src/data/siteContent.ts`.

## Steps

1. **Version.** `Artifact` tool, `action: "list"`, `scope: "files"`, `url: <artifactUrl>`.
   The result header names the version (e.g. `version 1794415948-a324`). The artifact is a
   single page (`index.html`), so the listing may say there are no separately published files.

2. **In-page edits.** The page lets its authors edit headings and text in place; those edits
   live in the artifact's database and do not change the version.
   `ArtifactData` tool, `action: "list"`, `url: <artifactUrl>`, `collection: "edits"`,
   `query: {"limit": 1000}`, `out_dir: <a new empty scratchpad folder>` (call it `<editsDir>`).
   Page with `query.cursor` if the result gives a `next_cursor`.

3. **Anything new?** `node scripts/import-liquid-biopsy.mjs --check --version <version> --edits <editsDir>`
   If it prints `unchanged`, report "liquid biopsy demo already at artifact version X" and stop.

4. **Download.** `Artifact` tool, `action: "read"`, `url: <artifactUrl>`, `paths: ["index.html"]`.
   Leave `out_dir` unset. The folder that holds the saved `index.html` is `<downloadDir>`.

5. **Import.** `node scripts/import-liquid-biopsy.mjs <downloadDir> --version <version> --edits <editsDir>`
   This replaces `public/liquid-biopsy/` with the page, records the edits in
   `.artifact-edits.json` and writes `.artifact-version.json`.

6. **Regenerate and build.** `npm run build` (runs `prepare:demo`: `scripts/prepare-liquid-biopsy.mjs`
   writes the edits into the page, retitles it and drops claude.ai links; then
   `scripts/extract-liquid-biopsy.mjs` writes `src/data/liquidBiopsyDemo.generated.json`).
   If `extract-liquid-biopsy` fails, the page markup changed in a way the parser does not
   understand: report the error, do not commit, and fix the script (or ask) before retrying.

7. **Review.** `git diff --stat` and the diff of `src/data/liquidBiopsyDemo.generated.json`.
   Summarise cards added/removed and changed headlines, titles and stats.

8. **Commit.** On a branch unless told to commit to main:
   `git checkout -b liquid-biopsy-sync-<YYYY-MM-DD>`, then
   `git add public/liquid-biopsy src/data/liquidBiopsyDemo.generated.json` and commit
   `content: sync Liquid Biopsy Demo from artifact <version>`.
   Push only if asked. Production deploys from `main` through the existing Vercel flow.

## Notes
- The same steps run daily as a cloud routine on the Rosa Bio account; it opens a PR that a
  person merges. See `docs/liquid-biopsy-sync-routine.md`.
- `prepare-liquid-biopsy:` lines in the build output: `applied N in-page edit(s)` means the
  page text now matches the artifact's edits; `recorded edit(s) match nothing on the page`
  lists edits for text the page no longer has (harmless).
- Featured cards, stats and badges are rules over the artifact data (see README "Liquid
  Biopsy Demo"); `siteContent.liquidBiopsyDemo` holds copy and optional overrides only.
