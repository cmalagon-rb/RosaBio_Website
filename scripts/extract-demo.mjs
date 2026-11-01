// Turns the p2single demo export (public/highlights/index.html, after prepare-highlights)
// into the data the homepage "Single Cell Demo" section renders:
//   src/data/singleCellDemo.generated.json
//
// Runs before every dev/build (see package.json "prepare:demo"), so the homepage cards,
// stats and header always come from the current export. Nothing here is hand-edited;
// presentation choices (featured cards, badges, section copy) live in src/data/siteContent.ts.
//
// Pure Node, no dependencies, regex based like prepare-highlights.mjs. It fails loudly
// (non-zero exit) when the export's markup no longer looks like what it expects, so a
// changed artifact breaks the build instead of silently rendering an empty section.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "public", "highlights");
const OUT = join(process.cwd(), "src", "data", "singleCellDemo.generated.json");
const MAX_BARS = 8;

const fail = (msg) => {
  console.error(`extract-demo: ${msg}`);
  process.exit(1);
};

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", prime: "′", middot: "·", rarr: "→", ndash: "–", mdash: "—" };
const unescape = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m);
const text = (html) => unescape(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const first = (re, s) => {
  const m = re.exec(s);
  return m ? m[1] : "";
};
const all = (re, s) => Array.from(s.matchAll(re), (m) => m[1]);
const hasClass = (tag, cls) => new RegExp(`class="(?:[^"]*\\s)?${cls}(?:\\s|")`).test(tag);

// "0.978" -> 0.978, "17 of 18" -> 0.944, "85%" -> 0.85, otherwise null
function toNumber(value) {
  const v = value.trim();
  let m = /^(\d[\d,]*) of (\d[\d,]*)$/.exec(v);
  if (m) {
    const d = Number(m[2].replace(/,/g, ""));
    return d ? Number(m[1].replace(/,/g, "")) / d : null;
  }
  m = /^(-?\d+(?:\.\d+)?)%$/.exec(v);
  if (m) return Number(m[1]) / 100;
  m = /^(-?\d+(?:\.\d+)?)$/.exec(v);
  return m ? Number(m[1]) : null;
}

// Rows of a lollipop / bar chart: a row label (text.rls or text.rl, "rls sm" is a
// sub-label) followed by its value (text.dv*) or a <circle><title>label value</title>.
// Returns [] for charts that are not row based (ROC curves, scatter plots).
function chartRows(svg) {
  const rows = [];
  let row = null;
  const tags = svg.matchAll(/<(text|circle|rect)\b([^>]*)>([\s\S]*?)<\/\1>|<(rect)\b([^>]*)\/>/g);
  for (const m of tags) {
    const kind = m[1] ?? m[4];
    const attrs = m[2] ?? m[5] ?? "";
    const inner = m[3] ?? "";
    const tag = `<${kind} ${attrs}>`;
    if (kind === "text" && (hasClass(tag, "rls") || hasClass(tag, "rl"))) {
      if (hasClass(tag, "sm")) {
        if (row) row.sub = text(inner);
        continue;
      }
      row = { label: text(inner), sub: "", values: [], us: false };
      rows.push(row);
      continue;
    }
    if (!row) continue;
    if (kind === "text" && /class="dv/.test(tag)) row.values.push(text(inner));
    else if (kind === "circle") {
      if (hasClass(tag, "d-us")) row.us = true;
      const t = first(/<title>([\s\S]*?)<\/title>/, inner);
      const v = /(\d+(?:\.\d+)?)(?:\s*\([^)]*\))?$/.exec(text(t));
      if (v) row.circleValues = [...(row.circleValues ?? []), v[1]];
    } else if (kind === "rect" && hasClass(tag, "hb")) row.us = true;
  }
  return rows
    .filter((r) => r.values.length || r.circleValues?.length)
    .map((r) => ({ label: r.label, sub: r.sub, values: r.values.length ? r.values : r.circleValues, us: r.us }));
}

// Two or more highlighted "big" numbers, each with the caption just before it
// (e.g. "artery model → uterus" AUC 0.88 / "uterus model → artery" AUC 0.86).
function bigPairs(svg) {
  const out = [];
  const re = /<text class="ax"[^>]*>([\s\S]*?)<\/text>\s*<text class="big"[^>]*>([\s\S]*?)<\/text>/g;
  for (const m of svg.matchAll(re)) out.push({ label: text(m[1]), value: text(m[2]) });
  return out;
}

function parseChart(body) {
  const m = /<svg class="cp"([^>]*)>([\s\S]*?)<\/svg>/.exec(body);
  if (!m) return null;
  const label = unescape(first(/aria-label="([^"]*)"/, m[1]));
  const svg = m[2];
  let rows = chartRows(svg);
  const pairs = bigPairs(svg);
  // rows with several values are multi-series; the captioned big numbers are clearer
  if ((!rows.length || rows.some((r) => r.values.length > 1)) && pairs.length >= 2) {
    rows = pairs.map((p) => ({ label: p.label, sub: "", values: [p.value.replace(/^[A-Za-z =]+/, "")], us: true }));
  }
  const bars = rows.slice(0, MAX_BARS).map((r) => ({ label: r.label, sub: r.sub, value: r.values[0], num: toNumber(r.values[0]), us: r.us }));
  return { label, bars: bars.filter((b) => b.num !== null) };
}

// "Xin 2016 · GSE81608 ·" -> ["Xin 2016", "GSE81608"]; a "·" inside parentheses does not split
function splitSources(s) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "\u00b7" && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

function parseCard(id, body) {
  const n = Number(id.slice(1));
  const tag = text(first(/<div class="tg">([\s\S]*?)<\/div>/, body));
  const title = text(first(/<h2>([\s\S]*?)<\/h2>/, body));
  if (!tag || !title) fail(`card ${id} has no tag/title; the export markup changed`);
  const scope = text(first(/<div class="ts"[^>]*>([\s\S]*?)<\/div>/, body));
  const bullets = all(/<li[^>]*>([\s\S]*?)<\/li>/g, first(/<ul[^>]*>([\s\S]*?)<\/ul>/, body) ?? "").map(text);
  const keyHtml = all(/<div class="key"[^>]*>([\s\S]*?)<\/div>/g, body);
  const keyLines = keyHtml.map(text);
  const footer = first(/<div class="ft">([\s\S]*)$/, body); // the footer is the last block of a card
  const ftFirst = first(/<span>([\s\S]*?)<\/span>\s*<span class="ins">/, footer) || first(/<span>([\s\S]*?)<\/span>/, footer);
  const updated = text(first(/<span class="up">([\s\S]*?)<\/span>/, footer)).replace(/^updated\s+/, "");
  const sources = splitSources(text(ftFirst.replace(/<span class="up">[\s\S]*?<\/span>/, "")));
  const links = Array.from(footer.matchAll(/<a class="go" href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g), (m) => ({
    href: /^https?:/.test(m[1]) ? m[1] : `/highlights/${m[1]}`,
    text: text(m[2]).replace(/\s*→$/, ""),
  }));
  const chart = parseChart(body);

  // Headline number, in order of how clearly the export states it
  const big = text(first(/<text class="big"[^>]*>([\s\S]*?)<\/text>/, body));
  const avg = text(first(/<line class="avg"[^>]*\/>\s*<text[^>]*>([\s\S]*?)<\/text>/, body));
  const metricWord = /\bAUC\b/i.test(chart?.label ?? "") ? "AUC" : "";
  let headline = big;
  if (!headline && avg) {
    const v = /(\d+(?:\.\d+)?)\s*$/.exec(avg);
    headline = v ? `${metricWord ? metricWord + " " : "avg "}${v[1]}` : "";
  }
  if (!headline) {
    const bold = keyHtml.flatMap((k) => all(/<b[^>]*>([\s\S]*?)<\/b>/g, k)).map(text).find((b) => /\d/.test(b));
    if (bold) headline = bold;
  }
  if (!headline) {
    const bold = bullets.length ? all(/<b[^>]*>([\s\S]*?)<\/b>/g, first(/<ul[^>]*>([\s\S]*?)<\/ul>/, body)).map(text)[0] : "";
    if (bold) headline = bold;
  }
  if (!headline && chart?.bars.length) {
    const us = chart.bars.find((b) => b.us) ?? chart.bars[0];
    headline = metricWord ? `${metricWord} ${us.value}` : us.value;
  }

  const local = links.find((l) => l.href.startsWith("/highlights/"));
  return {
    id,
    n,
    tag,
    title,
    scope,
    bullets,
    keyLines,
    headline: headline || null,
    sources,
    updated,
    chart,
    links,
    href: local ? local.href : `/highlights/index.html#${id}`,
  };
}

const indexPath = join(root, "index.html");
if (!existsSync(indexPath)) fail("public/highlights/index.html is missing; run the sync first");
const html = readFileSync(indexPath, "utf8");

const header = first(/<header>([\s\S]*?)<\/header>/, html);
const page = {
  eyebrow: text(first(/<div class="eyebrow">([\s\S]*?)<\/div>/, header)),
  title: text(first(/<h1>([\s\S]*?)<\/h1>/, header)),
  updated: text(first(/<div class="updated">([\s\S]*?)<\/div>/, header)).replace(/^Last updated\s+/, ""),
  legend: all(/<span>([\s\S]*?)<\/span>/g, first(/<div class="howto">([\s\S]*?)<\/div>/, header)).map(text),
};
if (!page.title) fail("no <h1> in the export header");

const cards = Array.from(html.matchAll(/<article class="sc" id="(c\d+)"[^>]*>([\s\S]*?)<\/article>/g), (m) => parseCard(m[1], m[2]));
if (!cards.length) fail("no <article class=\"sc\"> cards found in the export");

const versionPath = join(root, ".artifact-version.json");
const source = existsSync(versionPath) ? JSON.parse(readFileSync(versionPath, "utf8")) : {};

const out = {
  $comment: "Generated by scripts/extract-demo.mjs from public/highlights/index.html. Do not edit by hand.",
  source: { artifactUrl: source.artifactUrl ?? null, version: source.version ?? null, syncedAt: source.syncedAt ?? null },
  page,
  cards,
};
const json = JSON.stringify(out, null, 2) + "\n";
if (!existsSync(OUT) || readFileSync(OUT, "utf8") !== json) {
  writeFileSync(OUT, json);
  console.log(`extract-demo: wrote ${cards.length} cards to src/data/singleCellDemo.generated.json`);
}
