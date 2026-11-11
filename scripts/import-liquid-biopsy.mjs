// Replaces public/liquid-biopsy/ with a fresh export of the P2G liquid biopsy artifact.
//
//   node scripts/import-liquid-biopsy.mjs <downloadDir> --version <artifactVersion> [--edits <editsDir>] [--url <artifactUrl>]
//   node scripts/import-liquid-biopsy.mjs --check --version <artifactVersion> [--edits <editsDir>]
//
// <downloadDir> holds the artifact's published files at their published paths, as saved by the
// Artifact tool's read action (the artifact is a single page, so that is just index.html).
// Files no longer in the export are deleted, so the folder mirrors the artifact exactly.
//
// The page also lets its authors edit headings and text in place; those edits live in the
// artifact's database (collection "edits"), not in the page file, and do not change the
// artifact version. <editsDir> is what the ArtifactData tool saves for that collection
// (`action: "list", collection: "edits", out_dir: <dir>`): one <doc_id>.json per edit,
// each { "value": "..." }, under <dir>/edits/ (or directly in <dir>). They are recorded in
// public/liquid-biopsy/.artifact-edits.json and applied to the page by
// prepare-liquid-biopsy.mjs. Without --edits the recorded edits are kept as they are.
//
// --check changes nothing: it prints "import-liquid-biopsy: unchanged ..." when the version
// (and, with --edits, the edits) equal what public/liquid-biopsy/ already holds, otherwise
// "import-liquid-biopsy: changed ..." with the reason.
//
// Writes public/liquid-biopsy/.artifact-version.json. Run `npm run prepare:demo` afterwards
// (the build does too).

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const DEFAULT_URL = "https://claude.ai/artifact/GdVZhFeKtZ9uyrx1xFWiE6";
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const check = args.includes("--check");
const WITH_VALUE = new Set(["--version", "--edits", "--url"]);
const src = args.find((a, i) => !a.startsWith("--") && !WITH_VALUE.has(args[i - 1]));
const version = opt("--version");
const editsArg = opt("--edits");
const url = opt("--url") ?? DEFAULT_URL;

const usage = () => {
  console.error(
    "usage: node scripts/import-liquid-biopsy.mjs <downloadDir> --version <artifactVersion> [--edits <editsDir>] [--url <artifactUrl>]\n" +
      "       node scripts/import-liquid-biopsy.mjs --check --version <artifactVersion> [--edits <editsDir>]"
  );
  process.exit(2);
};
if (!version || (!check && !src)) usage();

const dest = join(process.cwd(), "public", "liquid-biopsy");
const versionFile = join(dest, ".artifact-version.json");
const editsFile = join(dest, ".artifact-edits.json");
const readJson = (p, fallback) => {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback;
  } catch {
    return fallback;
  }
};

// { "<data-edit-id>": "<value>" }, sorted by id. A missing folder means the collection is empty.
function readEdits(dir) {
  const from = resolve(dir);
  const folder = existsSync(join(from, "edits")) && statSync(join(from, "edits")).isDirectory() ? join(from, "edits") : from;
  if (!existsSync(folder)) return {};
  const out = {};
  for (const name of readdirSync(folder).filter((n) => n.endsWith(".json")).sort()) {
    const doc = JSON.parse(readFileSync(join(folder, name), "utf8"));
    // ArtifactData saves the document's fields; tolerate a full { id, data: { value } } record too
    const value = doc?.value ?? doc?.data?.value;
    if (typeof value === "string") out[doc?.id ?? basename(name, ".json")] = value;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

const edits = editsArg !== undefined ? readEdits(editsArg) : null;
const recorded = readJson(versionFile, {});
const recordedEdits = readJson(editsFile, {});
const sameEdits = edits === null || JSON.stringify(edits) === JSON.stringify(recordedEdits);

if (check) {
  const why = [];
  if (recorded.version !== version) why.push(`version ${recorded.version ?? "none"} -> ${version}`);
  if (!sameEdits) {
    const ids = new Set([...Object.keys(edits), ...Object.keys(recordedEdits)]);
    const changed = [...ids].filter((id) => edits[id] !== recordedEdits[id]).sort();
    why.push(`${changed.length} in-page edit(s) changed: ${changed.join(", ")}`);
  }
  console.log(
    why.length
      ? `import-liquid-biopsy: changed (${why.join("; ")})`
      : `import-liquid-biopsy: unchanged (artifact version ${version}${edits === null ? "" : `, ${Object.keys(edits).length} in-page edits`})`
  );
  process.exit(0);
}

const from = resolve(src);
if (!existsSync(join(from, "index.html"))) {
  console.error(`import-liquid-biopsy: ${from} has no index.html; is this the artifact export?`);
  process.exit(1);
}

const walk = (dir, base = dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p, base) : [relative(base, p)];
  });
const files = walk(from).sort();

const keptEdits = edits ?? recordedEdits;
if (existsSync(dest)) rmSync(dest, { recursive: true });
mkdirSync(dest, { recursive: true });
cpSync(from, dest, { recursive: true });
writeFileSync(editsFile, JSON.stringify(keptEdits, null, 2) + "\n");

const meta = {
  artifactUrl: url,
  version,
  syncedAt: new Date().toISOString(),
  fileCount: files.length,
  files,
  editCount: Object.keys(keptEdits).length,
};
writeFileSync(versionFile, JSON.stringify(meta, null, 2) + "\n");
console.log(
  `import-liquid-biopsy: ${files.length} file(s) copied into public/liquid-biopsy (artifact version ${version}), ` +
    `${Object.keys(keptEdits).length} in-page edit(s) ${edits === null ? "kept from the last sync" : "recorded"}`
);
