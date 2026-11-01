// Replaces public/highlights/ with a fresh export of the p2single demo artifact.
//
//   node scripts/import-highlights.mjs <downloadDir> --version <artifactVersion> [--url <artifactUrl>]
//
// <downloadDir> holds the artifact's published files at their published paths
// (index.html, panels/*.json, s/..., v/...), as saved by the Artifact tool's read action.
// Files no longer in the export are deleted, so the folder mirrors the artifact exactly.
// Writes public/highlights/.artifact-version.json, which the build reads to show the
// artifact version on the site. Run `npm run prepare:demo` afterwards (the build does too).

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const DEFAULT_URL = "https://claude.ai/artifact/CcKXrB5KSXn2khh9pR5Y4X";
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const src = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true);
const version = opt("--version");
const url = opt("--url") ?? DEFAULT_URL;

const usage = () => {
  console.error("usage: node scripts/import-highlights.mjs <downloadDir> --version <artifactVersion> [--url <artifactUrl>]");
  process.exit(2);
};
if (!src || !version) usage();
const from = resolve(src);
if (!existsSync(join(from, "index.html"))) {
  console.error(`import-highlights: ${from} has no index.html; is this the artifact export?`);
  process.exit(1);
}

const walk = (dir, base = dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p, base) : [relative(base, p)];
  });
const files = walk(from).sort();

const dest = join(process.cwd(), "public", "highlights");
// .study-pages.json holds the claude.ai link -> local study page mappings that
// prepare-highlights.mjs learned on earlier syncs; it is ours, not the artifact's, so keep it.
const mapFile = join(dest, ".study-pages.json");
const learned = existsSync(mapFile) ? readFileSync(mapFile, "utf8") : null;
if (existsSync(dest)) rmSync(dest, { recursive: true });
mkdirSync(dest, { recursive: true });
cpSync(from, dest, { recursive: true });
if (learned !== null) writeFileSync(mapFile, learned);

const meta = { artifactUrl: url, version, syncedAt: new Date().toISOString(), fileCount: files.length, files };
writeFileSync(join(dest, ".artifact-version.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(`import-highlights: ${files.length} files copied into public/highlights (artifact version ${version})`);
