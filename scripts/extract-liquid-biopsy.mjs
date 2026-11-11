// Turns the P2G liquid biopsy export (public/liquid-biopsy/index.html, after
// prepare-liquid-biopsy) into the data the homepage "Liquid Biopsy Demo" section renders:
//   src/data/liquidBiopsyDemo.generated.json
//
// Same output shape as scripts/extract-demo.mjs (Single Cell Demo), so both sections are built
// by src/lib/demo.ts and drawn by the same component. Runs before every dev/build (package.json
// "prepare:demo"); nothing here is hand-edited, and presentation choices live in
// siteContent.liquidBiopsyDemo.
//
// The page is one HTML file. Every result is an <article class="card" id="..."> inside a
// <section class="pt"> ("Main point N"). Its charts are drawn in the browser from a data object
// (`const D = {...}` in the first inline script); the row charts are read from there by the
// chart's element id (ch-r-<model>, ch-sens, ch-nt, ch-xp), and a card with a results table
// that has an AUC column gets its rows from the table. Any other chart (scatter, heatmap) is
// not a row chart: the homepage then shows the card's headline number and note instead.
//
// Pure Node, no dependencies, regex based like the other scripts. It fails loudly (non-zero
// exit) when the page no longer has a header or cards, so a changed artifact breaks the build
// instead of silently rendering an empty section. A chart it cannot read only prints a line.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "public", "liquid-biopsy");
const OUT = join(process.cwd(), "src", "data", "liquidBiopsyDemo.generated.json");
const PAGE_URL = "/liquid-biopsy/index.html";
const MAX_BARS = 8;

const fail = (msg) => {
  console.error(`extract-liquid-biopsy: ${msg}`);
  process.exit(1);
};

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", prime: "′", middot: "·", rarr: "→", ndash: "–", mdash: "—", ge: "≥", le: "≤", sup2: "²" };
const unescape = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z0-9]+);/gi, (m, n) => ENT[n] ?? m);
const text = (html) => unescape((html ?? "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").replace(/\s+([,.;:)])/g, "$1").replace(/\(\s+/g, "(").trim();
const first = (re, s) => {
  const m = re.exec(s ?? "");
  return m ? m[1] : "";
};
const all = (re, s) => Array.from((s ?? "").matchAll(re), (m) => m[1]);

// "Xin 2016 · GSE81608" -> ["Xin 2016", "GSE81608"]; a "·" inside parentheses does not split
function splitSources(s) {
  const out = [];
  let depth = 0,
    cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "·" && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

const fmtAuc = (n) => (n >= 0.995 ? n.toFixed(3) : n.toFixed(2));
const pct = (n) => `${Math.round(n * 100)}%`;
// "Stanford (PRJNA792450): preeclampsia vs control" -> "Stanford";
// "SRP080977 (5hmC cfDNA, Li 2017): colorectal cancer vs healthy" -> "Li 2017"
function shortSource(s) {
  const head = s.split(":")[0].trim();
  const cite = /\([^)]*?,\s*([A-Z][\w'-]+(?: et al\.)? \d{4})\)/.exec(head);
  return cite ? cite[1] : head.replace(/\s*\([^)]*\)/g, "").trim();
}

// ---------------------------------------------------------------- page data (const D = {...})
const indexPath = join(root, "index.html");
if (!existsSync(indexPath)) fail("public/liquid-biopsy/index.html is missing; run the sync first");
const html = readFileSync(indexPath, "utf8");

let D = {};
{
  const m = /const D=(\{[\s\S]*?\});\s*\n/.exec(html);
  if (!m) console.log("extract-liquid-biopsy: no chart data (const D) on the page; cards show their headline only");
  else {
    try {
      D = JSON.parse(m[1]);
    } catch (e) {
      console.log(`extract-liquid-biopsy: chart data (const D) is not JSON (${e.message}); cards show their headline only`);
    }
  }
}
const arr = (k) => (Array.isArray(D[k]) ? D[k] : []);

// ---------------------------------------------------------------- charts
const chartOf = (label, rows) => {
  const bars = rows.filter((b) => typeof b.num === "number" && Number.isFinite(b.num));
  return {
    label,
    rowCount: bars.length,
    competitors: bars.length && bars[0].us ? bars.filter((b) => !b.us).length : 0,
    bars: bars.slice(0, MAX_BARS),
  };
};

// A chart drawn from the data object, by its element id. null when it is not a row chart.
function dataChart(chartId, body) {
  if (chartId.startsWith("ch-r-")) {
    const key = first(/data-model="([^"]+)"/, body) || chartId.slice(5).replace(/-/g, "_");
    const c = D.CARD?.[key];
    // a P2G result with no published AUC to set it against is not a comparison chart
    if (!c || typeof c.auc !== "number" || typeof c.paper !== "number") return null;
    const n = (c.pos ?? 0) + (c.neg ?? 0);
    const rows = [{ label: "P2G", sub: n ? `${n} test samples` : "", value: fmtAuc(c.auc), num: c.auc, us: true }];
    const ref = text(first(/<div class="ft">[\s\S]*?<a [^>]*>([\s\S]*?)<\/a>/, body)).split(",")[0];
    rows.push({ label: "Paper", sub: ref, value: String(c.paper), num: c.paper, us: false });
    return chartOf("Held-out AUC: P2G and the paper", rows);
  }
  if (chartId === "ch-sens" && arr("SENS").length) {
    return chartOf(
      "Cases found at 95% specificity",
      arr("SENS").map((r) => ({ label: r.q ?? r.lab ?? "", sub: r.src ?? "", value: pct(r.s95), num: r.s95, us: true }))
    );
  }
  if (chartId === "ch-nt" && arr("NT").length) {
    return chartOf(
      "Held-out AUC, not tested in the paper",
      arr("NT").map((r) => ({ label: r.q ?? r.lab ?? "", sub: r.src ?? "", value: fmtAuc(r.y), num: r.y, us: true }))
    );
  }
  if (chartId === "ch-xp" && arr("XP").length) {
    return chartOf(
      "AUC on the other center's samples",
      arr("XP").map((r) => ({ label: `${shortSource(r.tr ?? "")} → ${shortSource(r.te ?? "")}`, sub: r.lab ?? "", value: fmtAuc(r.auc), num: r.auc, us: true }))
    );
  }
  return null;
}

// Rows of the card's first table with an AUC column: one bar per row.
function tableChart(body, tag) {
  for (const [table] of body.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const heads = all(/<th[^>]*>([\s\S]*?)<\/th>/g, table).map(text);
    const col = heads.findIndex((h) => /\bAUC\b/.test(h));
    if (col < 0) continue;
    const trained = heads.findIndex((h) => /^trained on/i.test(h));
    const scored = heads.findIndex((h) => /^scored on/i.test(h));
    const rows = [];
    for (const [, tr] of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = all(/<td[^>]*>([\s\S]*?)<\/td>/g, tr);
      if (cells.length !== heads.length) continue;
      const value = first(/(\d(?:\.\d+)?)/, text(cells[col]));
      if (!value) continue;
      let label, sub;
      if (trained >= 0 && scored >= 0) {
        label = `${shortSource(text(cells[trained]))} → ${shortSource(text(cells[scored]))}`;
        sub = `${text(cells[trained])} → ${text(cells[scored])}`;
      } else {
        const bold = first(/<b>([\s\S]*?)<\/b>/, cells[0]);
        label = text(bold || cells[0]);
        sub = text(cells[0].replace(/<b>[\s\S]*?<\/b>/, ""));
      }
      rows.push({ label, sub, value, num: Number(value), us: true });
    }
    if (rows.length) {
      const h = heads[col];
      return chartOf(h === "AUC" ? `AUC · ${tag}` : h.charAt(0).toUpperCase() + h.slice(1), rows);
    }
  }
  return null;
}

// ---------------------------------------------------------------- headline
// The number the card's own title leads with, in order of how clearly it states a result.
// Thresholds ("an AUC of 0.80 or more") are not results and are skipped.
function headlineOf(title, chart) {
  let m = /\bAUC (?:of )?(\d(?:\.\d+)?)(?![\d.])(?!\s*or (?:more|higher|above))/.exec(title);
  if (m) return `AUC ${m[1]}`;
  m = /\bR(?:²|2) (?:of )?(-?\d(?:\.\d+)?)(?![\d.])(?!\s*or (?:more|higher|above))/.exec(title);
  if (m) return `R² ${m[1]}`;
  m = /\b(\d[\d,]*) of (\d[\d,]*)\b(?! million| billion)/.exec(title);
  if (m) return `${m[1]} of ${m[2]}`;
  m = /\b[Aa]ll (\d[\d,]*) [a-z]/.exec(title);
  if (m) return `${m[1]} of ${m[1]}`;
  m = /\b(\d\.\d+) to (\d\.\d+)\b/.exec(title);
  if (m) return `${/\bAUC\b|\bscores?\b/i.test(title) ? "AUC " : ""}${m[1]}–${m[2]}`;
  m = /(?:>=|≥|at least|more than|over) ?(\d+(?:\.\d+)?%)/.exec(title);
  if (m) return `≥${m[1]}`;
  if (chart?.bars.length) {
    const top = chart.bars.find((b) => b.us) ?? chart.bars[0];
    return /\bAUC\b/.test(chart.label) && !/%$/.test(top.value) ? `AUC ${top.value}` : top.value;
  }
  m = /\((\d+(?:\.\d+)?%)\)/.exec(title);
  if (m) return m[1];
  m = /^(?:The |All )?(\d[\d,]*) ([a-z]+)/.exec(title);
  if (m) return `${m[1]} ${m[2]}`;
  return null;
}

// The headline as a comparable number: "AUC 0.94" -> { kind: "AUC", num: 0.94 },
// "R² 0.93" -> { kind: "r", num: 0.93 }, anything else (ranges, counts) -> kind "".
function metricOf(headline) {
  const h = headline ?? "";
  let m = /^AUC (\d(?:\.\d+)?)$/.exec(h);
  if (m) return { kind: "AUC", num: Number(m[1]) };
  m = /^R² (-?\d(?:\.\d+)?)$/.exec(h);
  if (m) return { kind: "r", num: Number(m[1]) };
  m = /^(\d[\d,]*) of (\d[\d,]*)$/.exec(h);
  if (m) {
    const d = Number(m[2].replace(/,/g, ""));
    return { kind: "", num: d ? Number(m[1].replace(/,/g, "")) / d : null };
  }
  return { kind: "", num: null };
}

// ---------------------------------------------------------------- cards
// Sections, with their short name from the contents list ("2. Compared with papers" -> "Compared with papers")
const toc = first(/<nav class="toc"[^>]*>([\s\S]*?)<\/nav>/, html);
const sections = Array.from(html.matchAll(/<section class="pt" id="([^"]+)">([\s\S]*?)<\/section>/g), (m) => ({
  id: m[1],
  start: m.index,
  tag: text(first(/<div class="num-tag">([\s\S]*?)<\/div>/, m[2])),
  nav: text(first(new RegExp(`<a href="#${m[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>([\\s\\S]*?)</a>`), toc)).replace(/^\d+\.\s*/, ""),
  title: text(first(/<h2>([\s\S]*?)<\/h2>/, m[2])),
}));

function parseCard(id, n, body, at) {
  const tag = text(first(/<div class="tg">([\s\S]*?)<\/div>/, body));
  const title = text(first(/<h3>([\s\S]*?)<\/h3>/, body).replace(/<span class="fn">[\s\S]*?<\/span>/, ""));
  if (!tag || !title) fail(`card ${id} has no tag/title; the page markup changed`);
  const ts = first(/<div class="ts"[^>]*>([\s\S]*?)<\/div>/, body);
  const [scopeHtml, ...stageHtml] = ts.split(/<br\s*\/?>/i);
  const scope = text(scopeHtml);
  const bullets = stageHtml.map(text).filter(Boolean);
  const notes = [
    ...all(/<p class="(?:note|mut cn)"[^>]*>([\s\S]*?)<\/p>/g, body),
    ...all(/<div class="note"[^>]*>([\s\S]*?)<\/div>/g, body),
    ...all(/<h4 class="sub"[^>]*>([\s\S]*?)<\/h4>/g, body),
  ]
    .map(text)
    .filter(Boolean);
  const footer = first(/<div class="ft">([\s\S]*?)<\/div>/, body);
  const ftFirst = first(/^\s*<span>([\s\S]*?)<\/span>/, footer);
  const sources = splitSources(text(ftFirst));
  const stamp = first(/<span class="stamp[^"]*"[^>]*>([\s\S]*?)<\/span>/, footer);
  const updated = text(stamp).replace(/^updated\s+/, "");
  const links = Array.from(footer.matchAll(/<a [^>]*href="(https?:[^"]*)"[^>]*>([\s\S]*?)<\/a>/g), (m) => ({ href: unescape(m[1]), text: text(m[2]) }));

  const chartId = first(/<div class="chart" id="([^"]+)"/, body);
  const section = [...sections].reverse().find((s) => s.start < at);
  // A card with no row chart (scatter, heatmap, gene table) still gets a chart label: the
  // homepage shows it above the headline number. It names the page section the card is in.
  const chart = (chartId && dataChart(chartId, body)) ||
    tableChart(body, tag) || { label: section ? [section.tag, section.nav].filter(Boolean).join(" · ") : tag, rowCount: 0, competitors: 0, bars: [] };
  const headline = headlineOf(title, chart);

  return {
    id,
    n,
    tag,
    title,
    scope,
    bullets,
    keyLines: notes,
    headline,
    metric: metricOf(headline),
    sources,
    updated,
    chart,
    links,
    href: `${PAGE_URL}#${id}`,
    section: section ? { id: section.id, tag: section.tag, nav: section.nav, title: section.title } : null,
  };
}

const header = first(/<header>([\s\S]*?)<\/header>/, html);
const page = {
  eyebrow: text(first(/<div class="eyebrow">([\s\S]*?)<\/div>/, header)),
  title: text(first(/<h1>([\s\S]*?)<\/h1>/, header)),
  updated: text(first(/<div class="updated">([\s\S]*?)<\/div>/, header)).replace(/^Last updated\s+/, ""),
  legend: all(/<span>([\s\S]*?)<\/span>/g, first(/<div class="howto">([\s\S]*?)<\/div>/, header).replace(/<span><b>/g, "<span>")).map(text),
  lede: text(first(/<p class="lede">([\s\S]*?)<\/p>/, header)),
};
if (!page.title) fail("no <h1> in the page header");

const cards = Array.from(html.matchAll(/<article class="card[^"]*" id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g), (m, i) => parseCard(m[1], i + 1, m[2], m.index));
if (!cards.length) fail('no <article class="card"> found on the page');

// Page-wide numbers for the stats strip, from the same data the page's charts draw.
// paperComparisons: comparisons with a published AUC for the same question, and how many of them
// the page colours "P2G within 0.02 of the paper, or higher" (c1).
const f2 = arr("F2").filter((r) => typeof r.auc === "number" || r.c);
const summary = {
  paperComparisons: f2.length
    ? { matched: f2.filter((r) => (r.c ? r.c === "c1" : r.auc >= r.paper - 0.02)).length, total: f2.length }
    : null,
  questions: arr("GL").length || null,
};

const versionPath = join(root, ".artifact-version.json");
const source = existsSync(versionPath) ? JSON.parse(readFileSync(versionPath, "utf8")) : {};

const out = {
  $comment: "Generated by scripts/extract-liquid-biopsy.mjs from public/liquid-biopsy/index.html. Do not edit by hand.",
  source: { artifactUrl: source.artifactUrl ?? null, version: source.version ?? null, syncedAt: source.syncedAt ?? null },
  page,
  summary,
  cards,
};
const json = JSON.stringify(out, null, 2) + "\n";
if (!existsSync(OUT) || readFileSync(OUT, "utf8") !== json) {
  writeFileSync(OUT, json);
  console.log(`extract-liquid-biopsy: wrote ${cards.length} cards to src/data/liquidBiopsyDemo.generated.json`);
}
