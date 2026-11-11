# Daily Liquid Biopsy Demo sync: Claude Code cloud routine

The homepage "Liquid Biopsy Demo" and the full page at `/liquid-biopsy/index.html` mirror the
Claude artifact `https://claude.ai/artifact/GdVZhFeKtZ9uyrx1xFWiE6` (P2G liquid biopsy
highlights). It works exactly like the Single Cell Demo sync (`docs/demo-sync-routine.md`):
claude.ai does not let servers fetch artifacts, so a Claude Code cloud routine checks the
artifact once a day under the Rosa Bio account and opens a pull request when it changed.
A person reviews and merges the PR; Vercel deploys `main`.

Two differences from the Single Cell Demo:

- The artifact is a single page, so the download is just `index.html` (about 0.5 MB).
- The page lets its authors edit headings and text in place. Those edits are stored in the
  artifact's database, not in the page, and do not change the artifact version. The routine
  reads them too (ArtifactData tool, collection `edits`), so an in-place edit also opens a PR.
  They are recorded in `public/liquid-biopsy/.artifact-edits.json` and written into the page by
  `scripts/prepare-liquid-biopsy.mjs` at build time.

## Who sets it up

Same account as the Single Cell Demo routine: **cmalagon@rosabio.com**. The routine was
created from a Claude Code session on that account ("RosaBio demo sync (liquid biopsy
artifact)", daily). To recreate it by hand, use `/schedule` as described in
`docs/demo-sync-routine.md` with the prompt below, connectors Gmail and Slack.

The routine does nothing until this pipeline is merged to `main` (step 1 of the prompt checks).

## Routine prompt

```
You are working on cmalagon-rb/RosaBio_Website (the Rosa Bio website, Next.js).
Your job: keep the Liquid Biopsy Demo in sync with the Claude artifact that holds the
P2G liquid biopsy results. Do exactly this, in order, and stop at the first failure with a
clear report.

0. If your working directory has no clone of cmalagon-rb/RosaBio_Website, attach it with the
   add_repo tool (owner cmalagon-rb, repo RosaBio_Website, access push), clone it exactly as
   that tool's result says, and cd into the clone.

1. git checkout main && git pull --ff-only.
   If scripts/import-liquid-biopsy.mjs does not exist, finish with the message
   "Liquid Biopsy Demo pipeline is not on main yet, nothing to do." and make no changes.
   Send no email and no Slack message in this case. Otherwise run: npm ci

2. Read the artifact URL from src/data/siteContent.ts (key liquidBiopsyDemo.artifactUrl;
   today it is https://claude.ai/artifact/GdVZhFeKtZ9uyrx1xFWiE6).
   Use the Artifact tool, action "list", scope "files", with that url. Note the artifact
   version in the result header (e.g. 1794415948-a324). The artifact is one page
   (index.html), so the listing may say it has no separately published files; that is expected.

3. Read the page's in-place text edits: ArtifactData tool, action "list", url = the artifact
   url, collection "edits", query {"limit": 1000}, out_dir = a new empty folder in your
   scratchpad; call that folder EDITS_DIR. If the result gives a next_cursor, call it again
   with query.cursor set to it and the same out_dir until there is none. If the ArtifactData
   tool is unavailable or fails, carry on without the edits: leave "--edits EDITS_DIR" out of
   every command below and say so in your final report.

4. Run: node scripts/import-liquid-biopsy.mjs --check --version <version> --edits EDITS_DIR
   If it prints "import-liquid-biopsy: unchanged", finish with the message "Liquid Biopsy Demo
   already at artifact version <version>, nothing to do." and make no changes. Send no email
   and no Slack message in this case.

5. Otherwise use the Artifact tool, action "read", the same url, with paths ["index.html"].
   Do not set out_dir. The result says where index.html was saved; the folder that holds it
   is DOWNLOAD_DIR.

6. Run: node scripts/import-liquid-biopsy.mjs DOWNLOAD_DIR --version <version> --edits EDITS_DIR
   Then: npm run build
   If the build fails, do not commit. Report the error output; the most likely cause is that
   the artifact's HTML changed shape and scripts/extract-liquid-biopsy.mjs needs updating by
   a person.

7. Review: git status and git diff --stat. Only public/liquid-biopsy/ and
   src/data/liquidBiopsyDemo.generated.json may change. Summarise from the diff of
   src/data/liquidBiopsyDemo.generated.json which cards were added, removed, retitled or got a
   new headline number, and any change to "summary" (stats) or "page" (header). Mention the
   "import-liquid-biopsy: changed (...)" reason from step 4 and any "prepare-liquid-biopsy:"
   lines from the build output.

8. Create a branch named liquid-biopsy-sync-<YYYY-MM-DD>, commit with the message
   "content: sync Liquid Biopsy Demo from artifact <version>", and push it with
   git push -u origin <branch>. Then open a pull request against main through the GitHub REST
   API (gh pr create does NOT work in these cloud sessions, because GitHub GraphQL is blocked):
   write the summary from step 7 plus the artifact url to a file in your scratchpad, then run
   gh api repos/cmalagon-rb/RosaBio_Website/pulls -X POST -f title="content: sync Liquid Biopsy Demo from artifact <version>" -f head="<branch>" -f base="main" -F body=@<that file> --jq .html_url
   It prints the pull request link.
   Never push to main, never force-push, never merge the pull request, never edit files other
   than the ones named above.

9. Notify Calvin, in both of these ways, whenever you opened a pull request OR whenever any
   step failed (never when step 1 or step 4 found nothing to do):
   a. Email, using the Gmail tools: to cmalagon@rosabio.com, subject
      "RosaBio liquid biopsy sync: PR opened for artifact <version>" (or "RosaBio liquid biopsy
      sync FAILED"), body = the PR link (or the error), the summary from step 7, and the
      artifact url.
   b. Slack direct message, using the Slack tools: send to Slack user id U09JE47UN3B
      (Calvin, cmalagon@rosabio.com) with the same content. If that id is rejected, search
      users for "cmalagon" (searching by the full email returns nothing) and DM the match.
   If one of the two notifications fails, still send the other and mention the failure in
   your final report.

10. Finish with the PR link and the summary.

Further detail, if needed, is in .claude/skills/sync-liquid-biopsy/SKILL.md and README.md
("Liquid Biopsy Demo") inside the repo.
```

## What the routine must never do

- Push to `main` or force-push anything.
- Edit anything outside `public/liquid-biopsy/` and `src/data/liquidBiopsyDemo.generated.json`.
- Commit when `npm run build` fails.
