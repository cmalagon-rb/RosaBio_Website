// Prepares the P2G liquid biopsy export in public/liquid-biopsy/ for the site.
// Runs before every build (package.json "prepare:demo"), so a fresh export from the Claude
// page can be dropped in as-is. Safe to run repeatedly: it only changes what still needs it.
//
// 1. In-page edits: the artifact lets its authors edit headings and text in place
//    (<span data-edit-id="...">). Those edits are stored in the artifact's database, not in
//    the page, so the page shows them only on claude.ai. The sync records them in
//    public/liquid-biopsy/.artifact-edits.json; here they are written into the page, so the
//    site shows the same text as the artifact. Edits are plain text (escaped here); simple
//    inline tags <b> <i> <em> <strong> <br> <sup> <sub> are kept, as the artifact keeps them.
// 2. Links to claude.ai pages (private to Rosa Bio): keep the text, drop the link.
// 3. Page title reads "Liquid Biopsy Demo".
// 4. A homepage card links to index.html#<card id>; the card it lands on is outlined.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "public", "liquid-biopsy");
const page = join(root, "index.html");
const TITLE = "Liquid Biopsy Demo";

if (!existsSync(page)) {
  console.log("prepare-liquid-biopsy: no public/liquid-biopsy/index.html, skipping");
  process.exit(0);
}

const readJson = (p) => {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
  } catch {
    return {};
  }
};
const edits = readJson(join(root, ".artifact-edits.json"));

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const unescape = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m);
const plain = (html) => unescape(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SAFE_TAG = /&lt;(\/?)(b|i|em|strong|br|sup|sub)\s*\/?&gt;/gi;
const toHtml = (value) => escapeHtml(value).replace(SAFE_TAG, "<$1$2>");

// Replaces the content of every <span data-edit-id="id"> whose recorded edit reads differently.
// Spans can hold other spans, so the end is found by counting.
function applyEdits(s) {
  const missing = [];
  let changed = 0;
  for (const [id, value] of Object.entries(edits)) {
    const open = `<span data-edit-id="${id}">`;
    const start = s.indexOf(open);
    if (start < 0) {
      missing.push(id);
      continue;
    }
    const from = start + open.length;
    const re = /<span\b[^>]*>|<\/span>/g;
    re.lastIndex = from;
    let depth = 1;
    let end = -1;
    for (let m; (m = re.exec(s)); ) {
      depth += m[0] === "</span>" ? -1 : 1;
      if (depth === 0) {
        end = m.index;
        break;
      }
    }
    if (end < 0) continue;
    if (plain(s.slice(from, end)) === plain(toHtml(value))) continue; // same text: keep the artifact's own markup
    s = s.slice(0, from) + toHtml(value) + s.slice(end);
    changed++;
  }
  if (changed) console.log(`prepare-liquid-biopsy: applied ${changed} in-page edit(s) from .artifact-edits.json`);
  if (missing.length) console.log(`prepare-liquid-biopsy: ${missing.length} recorded edit(s) match nothing on the page (ignored): ${missing.join(", ")}`);
  return s;
}

const TARGET_STYLE = `<style id="card-target">article.card:target{outline:2px solid var(--accent);outline-offset:4px}</style>
`;

const before = readFileSync(page, "utf8");
let s = applyEdits(before);
s = s.replace(/<a\b[^>]*href="https:\/\/claude\.ai\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1");
s = s.replace(/<title>[^<]*<\/title>/g, `<title>${TITLE}</title>`);
if (!s.includes('id="card-target"')) {
  const i = s.indexOf("</head>");
  s = i >= 0 ? s.slice(0, i) + TARGET_STYLE + s.slice(i) : TARGET_STYLE + s;
}
if (s !== before) {
  writeFileSync(page, s);
  console.log("prepare-liquid-biopsy: updated index.html");
}
