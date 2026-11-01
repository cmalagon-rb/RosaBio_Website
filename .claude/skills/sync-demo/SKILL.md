---
name: sync-demo
description: Pull the latest p2single demo export from the Claude artifact into public/highlights/, regenerate the homepage Single Cell Demo data, build, and commit. Use when the artifact was updated or someone asks to refresh/sync the demo.
---

# Sync the Single Cell Demo from the Claude artifact

The website cannot fetch claude.ai itself (bot protection), so this skill is the sync step.
Everything after the download is deterministic scripts. The artifact URL is
`siteContent.singleCellDemo.artifactUrl` in `src/data/siteContent.ts`.

## Steps

1. **Check for a new version.** `Artifact` tool, `action: "list"`, `scope: "files"`, `url: <artifactUrl>`.
   The result header names the version (e.g. `version 1793305793-e4a8`) and lists every published path.
   Compare with `version` in `public/highlights/.artifact-version.json`. If equal, report
   "demo already at artifact version X" and stop.

2. **Download every file.** `Artifact` tool, `action: "read"`, `url: <artifactUrl>`,
   `paths: [ ...every path from the listing... ]` (up to 256 per call; the export is ~47 files, ~56 MB).
   Leave `out_dir` unset so the files land in the scratchpad's artifact folder, at their published paths.
   The result says where they were saved; call that folder `<downloadDir>`.

3. **Import.** `node scripts/import-highlights.mjs <downloadDir> --version <version>`
   This replaces `public/highlights/` with the export and writes `.artifact-version.json`.

4. **Regenerate and build.** `npm run build` (runs `prepare:demo`: link rewriting in
   `scripts/prepare-highlights.mjs`, then `scripts/extract-demo.mjs` which writes
   `src/data/singleCellDemo.generated.json`). If `extract-demo` fails, the artifact's markup
   changed in a way the parser does not understand: report the error, do not commit, and
   fix `scripts/extract-demo.mjs` (or ask) before retrying.

5. **Review the change.** `git diff --stat` and the diff of `src/data/singleCellDemo.generated.json`.
   Summarise cards added/removed and changed headlines or titles.

6. **Commit.** On a branch unless told to commit to main:
   `git checkout -b demo-sync-<YYYY-MM-DD>`, then
   `git add public/highlights src/data/singleCellDemo.generated.json` and commit
   `content: sync Single Cell Demo from artifact <version>`.
   Push only if asked. Production deploys from `main` through the existing Vercel flow.

## Notes
- `prepare-highlights.mjs` rewrites links to the private claude.ai study pages; if the export
  gains a new study page, add its artifact id to `STUDY_PAGES` there.
- Presentation choices (featured cards, badges, section copy) are in `siteContent.singleCellDemo`.
