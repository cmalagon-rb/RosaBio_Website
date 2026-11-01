# Daily demo sync: Claude Code cloud routine

The homepage "Single Cell Demo" and the full demo at `/highlights/` mirror the public Claude
artifact `https://claude.ai/artifact/CcKXrB5KSXn2khh9pR5Y4X`. claude.ai does not let servers
fetch artifacts, so the sync runs inside Claude Code. This routine does it once a day under
the Rosa Bio account and opens a pull request when the artifact changed.

## Who sets it up

The routine belongs to the Claude account that creates it. Use **cmalagon@rosabio.com**
(an account inside Rosa Bio's organization, so it keeps working even if the artifact is made
private again).

## One-time setup (about 10 minutes)

1. **GitHub access for cloud sessions.** Signed in as cmalagon@rosabio.com, open
   https://claude.ai/code, connect GitHub, and grant the Claude GitHub app access to
   `cmalagon-rb/RosaBio_Website`. The account needs push rights on the repo (it pushes a branch
   and opens a PR; it never pushes to `main`).
2. **Create the routine** from a terminal:
   ```
   cd ~/RosaBio_Website
   claude
   /login            # sign in as cmalagon@rosabio.com
   /schedule         # choose "create"
   ```
   When asked:
   - repo: `https://github.com/cmalagon-rb/RosaBio_Website`
   - schedule: daily, 07:00 America/New_York (`0 11 * * *` UTC in summer, `0 12 * * *` in
     winter; pick one, the hour does not matter)
   - model: the default (Sonnet) is fine
   - connectors: Gmail and Slack (for the PR / failure notifications in step 8 of the prompt)
   - prompt: paste the block below, unchanged
3. **Run it once by hand** ("run now" in `/schedule`, or https://claude.ai/code/routines).
   The run log must show the Artifact tool listing the artifact's files, then either
   "no change" or a pull request link. If the log shows the Artifact tool is unavailable in
   the cloud session, run `/sync-demo` from a local Claude Code session on the same account
   instead; the steps are identical.
4. **Merging.** The routine emails cmalagon@rosabio.com and sends a Slack DM when it opens a PR
   or fails. A person reviews and merges the PR; Vercel deploys `main` automatically.

## Routine prompt

```
You are in a fresh clone of cmalagon-rb/RosaBio_Website (the Rosa Bio website, Next.js).
Your job: keep the Single Cell Demo in sync with the public Claude artifact that holds the
p2single results. Do exactly this, in order, and stop at the first failure with a clear report.

1. git checkout main && git pull --ff-only. Run: npm ci

2. Read the artifact URL from src/data/siteContent.ts (key singleCellDemo.artifactUrl;
   today it is https://claude.ai/artifact/CcKXrB5KSXn2khh9pR5Y4X).
   Use the Artifact tool, action "list", scope "files", with that url. Note the artifact
   version in the result header (e.g. 1793305793-e4a8) and every published path.

3. Compare that version with the "version" field in public/highlights/.artifact-version.json.
   If they are equal, finish with the message "Single Cell Demo already at artifact version
   <version>, nothing to do." and make no changes. Send no email and no Slack message in this case.

4. Otherwise use the Artifact tool, action "read", the same url, with paths = every path from
   the listing (up to 256 per call). Do not set out_dir. The result says the folder the files
   were saved under; call it DOWNLOAD_DIR.

5. Run: node scripts/import-highlights.mjs DOWNLOAD_DIR --version <version>
   Then: npm run build
   If the build fails, do not commit. Report the error output; the most likely cause is that
   the artifact's HTML changed shape and scripts/extract-demo.mjs needs updating by a person.

6. Review: git status and git diff --stat. Only public/highlights/ and
   src/data/singleCellDemo.generated.json may change. Summarise from the diff of
   src/data/singleCellDemo.generated.json which cards were added, removed, retitled or got a
   new headline number.

7. Create a branch named demo-sync-<YYYY-MM-DD>, commit with the message
   "content: sync Single Cell Demo from artifact <version>", push it, and open a pull request
   against main with: gh pr create --title "content: sync Single Cell Demo from artifact
   <version>" --body "<the summary from step 6, plus the artifact url>".
   Never push to main, never force-push, never edit files other than the ones named above.

8. Notify Calvin, in both of these ways, whenever you opened a pull request OR whenever any
   step failed (never when step 3 found nothing to do):
   a. Email, using the Gmail tools: to cmalagon@rosabio.com, subject
      "RosaBio demo sync: PR opened for artifact <version>" (or "RosaBio demo sync FAILED"),
      body = the PR link (or the error), the summary from step 6, and the artifact url.
   b. Slack direct message, using the Slack tools: find the user whose email is
      cmalagon@rosabio.com and send the same content as a DM.
   If one of the two notifications fails, still send the other and mention the failure in
   your final report.

9. Finish with the PR link and the summary.

Further detail, if needed, is in .claude/skills/sync-demo/SKILL.md and README.md
("Single Cell Demo") inside the repo.
```

## What the routine must never do

- Push to `main` or force-push anything.
- Edit anything outside `public/highlights/` and `src/data/singleCellDemo.generated.json`.
- Commit when `npm run build` fails.
