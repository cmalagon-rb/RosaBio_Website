// Prepares the p2single "Single Cell Demo" export in public/highlights/ for the site.
// Runs before every build, so a fresh export from the Claude page can be dropped in as-is.
// Safe to run repeatedly: it only changes things that still need changing.
//
// 1. Links to private claude.ai pages: point to the local study pages when we have them,
//    otherwise drop the link (keep its text).
// 2. "full results" links on cards without a local page are removed (the card itself
//    opens its detail panel).
// 3. index.html#cN opens card N's detail panel (used by the homepage panels).
// 4. Page title reads "Single Cell Demo".
// 5. On phones, the fixed "dark mode" / "Rosa Bio" buttons no longer cover the page header.
// 6. The pancreas card's perfect 1.000 shows its 95% CI.
// 7. claude.ai URLs quoted in the card detail text (panels/*.json) are removed.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "public", "highlights");
const CLAUDE = "https://claude.ai/artifact/";

// claude.ai artifact id -> local study page (relative to public/highlights/).
// The export does not say which study page belongs to which claude.ai link. The seed below
// covers the first four; every mapping found later is learned automatically: a link whose id
// is unknown is matched to an unclaimed study page whose <title> starts with a token (an
// accession or dataset name) that appears in the card's text or in its detail panel
// (panels/cardN.json), and the match is recorded in public/highlights/.study-pages.json.
// import-highlights.mjs keeps that file across syncs and the sync commits it, so nobody has
// to edit this table again.
const SEED_STUDY_PAGES = {
  LTthSXNJBcsB83xjSXQwKq: "s/s1/index.html", // GSE123813
  YaEUyKUKgtHxabkoee9ruW: "s/s2/index.html", // SRP251372
  "7QE9JMnaYL1WsyGCGhHGPE": "s/s3/index.html", // bmcite
  "3c4oNTA6kiam82xj6hqCm5": "s/s4/index.html", // SRP268462
};
const MAP_FILE = join(root, ".study-pages.json");
const readJson = (p) => {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
  } catch {
    return {};
  }
};
// learned mappings win over the seed; entries whose page is not in this export are ignored
const STUDY_PAGES = Object.fromEntries(
  Object.entries({ ...SEED_STUDY_PAGES, ...readJson(MAP_FILE) }).filter(([, page]) => existsSync(join(root, page)))
);

// Every study page in the export (s/<name>/index.html) with the first token of its <title>,
// e.g. { page: "s/s1/index.html", token: "GSE123813" }. Tokens shorter than 4 characters are
// too generic to match on and are left empty.
function studyPages() {
  const dir = join(root, "s");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => existsSync(join(dir, n, "index.html")))
    .sort()
    .map((n) => {
      const title = /<title>([^<]*)<\/title>/.exec(readFileSync(join(dir, n, "index.html"), "utf8"))?.[1] ?? "";
      const token = (title.trim().split(/\s+/)[0] ?? "").replace(/[^\w.-]/g, "");
      return { page: `s/${n}/index.html`, token: token.length >= 4 ? token : "" };
    });
}
const INDEX_ID = "12Y1fJvzEgSdhQQR8q9Gkf"; // "All studies (index)"

const DEEP_LINK = `<script id="card-deep-link">
/* Open a card's detail panel from a link like index.html#c7 */
(function () {
  function fromHash() {
    var m = /^#c(\\d+)$/.exec(location.hash), b = m && document.querySelector('#c' + m[1] + ' .cl');
    if (b) b.click();
  }
  window.addEventListener('load', fromHash);
  window.addEventListener('hashchange', fromHash);
})();
</script>
`;

// The buttons are position:fixed at top:12px (about 34px tall); push the page below them
// on narrow screens, where the header runs under them.
const TOP_FIX = `<style id="top-controls-fix">@media(max-width:899px){body{padding-top:56px!important}}</style>
`;
const addTopFix = (s) => {
  if (s.includes('id="top-controls-fix"')) return s;
  const i = s.indexOf("</head>");
  return i >= 0 ? s.slice(0, i) + TOP_FIX + s.slice(i) : s;
};

const PANCREAS_KEY = "<b>Macro F1</b> · p2single and the 17 published methods";
const PANCREAS_CI = " · p2single 1.000 (95% CI 0.989–1.000)";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function update(file, fn) {
  const path = join(root, file);
  if (!existsSync(path)) return;
  const before = readFileSync(path, "utf8");
  const after = fn(before);
  if (after !== before) {
    writeFileSync(path, after);
    console.log(`prepare-highlights: updated ${file}`);
  }
}

if (!existsSync(join(root, "index.html"))) {
  console.log("prepare-highlights: no public/highlights/index.html, skipping");
  process.exit(0);
}

// Main demo page
update("index.html", (s) => {
  // "full results" links: local study page if we have one (table, then title-token fallback
  // within the card's own text), else remove the link. Each page is used by one card only.
  const pages = studyPages();
  const claimed = new Set(Object.values(STUDY_PAGES));
  const learned = {}; // id -> page, matched in this run and recorded in MAP_FILE
  const dropped = []; // "cN (id)" for links to claude.ai pages the export has no local page for
  s = s.replace(/<article class="sc" id="(c\d+)"[^>]*>[\s\S]*?<\/article>/g, (article, cardId) => {
    const panelPath = join(root, "panels", `card${cardId.slice(1)}.json`);
    const panel = existsSync(panelPath) ? readFileSync(panelPath, "utf8") : "";
    return article.replace(
      /<a class="go" href="https:\/\/claude\.ai\/artifact\/([A-Za-z0-9]+)(#[^"]*)?"[^>]*>(.*?)<\/a>/g,
      (all, id, hash = "", text) => {
        let page = STUDY_PAGES[id] ?? learned[id];
        if (!page) {
          const free = pages.filter((p) => p.token && !claimed.has(p.page));
          const hit = free.find((p) => article.includes(p.token)) ?? free.find((p) => panel.includes(p.token));
          if (hit) {
            page = hit.page;
            claimed.add(page);
            learned[id] = page;
            console.log(`prepare-highlights: card ${cardId} link to ${CLAUDE}${id} mapped to ${page} by its title "${hit.token}", recorded in .study-pages.json`);
          }
        }
        if (!page) {
          dropped.push(`${cardId} (${id})`);
          return "";
        }
        return `<a class="go" href="${page}${hash}" target="_blank" rel="noopener">${text}</a>`;
      }
    );
  });
  if (Object.keys(learned).length) {
    const map = { ...readJson(MAP_FILE), ...learned };
    writeFileSync(MAP_FILE, JSON.stringify(Object.fromEntries(Object.entries(map).sort()), null, 2) + "\n");
  }
  if (dropped.length) {
    console.log(`prepare-highlights: ${dropped.length} card link(s) to claude.ai pages with no local study page, link dropped: ${dropped.join(", ")}`);
  }
  // any other claude.ai link: keep the text, drop the link
  s = s.replace(new RegExp(`<a [^>]*href="${esc(CLAUDE)}[^"]*"[^>]*>(.*?)</a>`, "g"), "$1");
  s = s.replace("<title>p2single Highlights</title>", "<title>Single Cell Demo</title>");
  s = s.replace("<h1>p2single Highlights</h1>", "<h1>Single Cell Demo</h1>");
  if (!s.includes(PANCREAS_KEY + PANCREAS_CI)) s = s.replace(PANCREAS_KEY, PANCREAS_KEY + PANCREAS_CI);
  s = addTopFix(s);
  if (!s.includes('id="card-deep-link"')) {
    const i = s.lastIndexOf("</body>");
    s = i >= 0 ? s.slice(0, i) + DEEP_LINK + s.slice(i) : s + DEEP_LINK;
  }
  return s;
});

// Study pages (every s/<name>/index.html in the export)
for (const { page: studyPage } of studyPages()) {
  update(studyPage, (s) => {
    for (const [id, page] of Object.entries(STUDY_PAGES)) {
      s = s.replaceAll(CLAUDE + id, "../" + page.slice(2));
    }
    s = s.replaceAll(CLAUDE + INDEX_ID, "../../index.html");
    s = s.replaceAll("All studies (index)", "All highlights");
    // sidenav entries for pages we don't have
    s = s.replace(new RegExp(`,?\\n\\s*\\['[A-Za-z0-9]+', '${esc(CLAUDE)}[A-Za-z0-9]+', '[^']*'\\]`, "g"), "");
    // study-nav links to pages we don't have: drop them from the nav entirely
    s = s.replace(/(<nav class="studies"[\s\S]*?<\/nav>)/, (nav) =>
      nav.replace(new RegExp(`<a href="${esc(CLAUDE)}[^"]*"[^>]*>[\\s\\S]*?</a>`, "g"), "")
    );
    // any remaining claude.ai link in the text: keep the text, drop the link
    s = s.replace(new RegExp(`<a href="${esc(CLAUDE)}[^"]*"[^>]*>([\\s\\S]*?)</a>`, "g"), "$1");
    return addTopFix(s);
  });
}

// Card detail panels: drop claude.ai URLs quoted in the provenance text
const panelsDir = join(root, "panels");
if (existsSync(panelsDir)) {
  for (const f of readdirSync(panelsDir).filter((f) => f.endsWith(".json"))) {
    update(`panels/${f}`, (s) => s.replace(new RegExp(`${esc(CLAUDE)}[A-Za-z0-9]+(#[^\\s,)"]*)?(, )?`, "g"), ""));
  }
}
