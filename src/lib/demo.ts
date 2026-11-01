// Builds what the "Single Cell Demo" section renders from
//   - src/data/singleCellDemo.generated.json  (parsed from the p2single artifact export by
//     scripts/extract-demo.mjs; regenerated on every dev/build, never hand-edited)
//   - siteContent.singleCellDemo               (presentation choices: how many cards are
//     featured, which stats to compute, copy)
// Everything the artifact states wins; the config only fills what the artifact does not have.
// No rule here depends on a particular card id, so new, removed or reordered cards in the
// artifact never need a config change.

export type GeneratedBar = { label: string; sub: string; value: string; num: number | null; us: boolean };
export type GeneratedChart = { label: string; rowCount: number; competitors: number; bars: GeneratedBar[] };
export type GeneratedMetric = { kind: "AUC" | "F1" | "r" | ""; num: number | null };
export type GeneratedCard = {
  id: string;
  n: number;
  tag: string;
  title: string;
  scope: string;
  bullets: string[];
  keyLines: string[];
  headline: string | null;
  metric: GeneratedMetric;
  sources: string[];
  updated: string;
  chart: GeneratedChart | null;
  links: { href: string; text: string }[];
  href: string;
};
export type GeneratedDemo = {
  source: { artifactUrl: string | null; version: string | null; syncedAt: string | null };
  page: { eyebrow: string; title: string; updated: string; legend: string[] };
  cards: GeneratedCard[];
};

export type CardOverride = { badge?: string; headline?: string; metricLabel?: string; chartMin?: number };
export type StatRule = "cardCount" | "bestAuc" | "mostMethodsBeaten" | "updated";
export type DemoConfig = {
  artifactUrl: string;
  label: string;
  title: string;
  description: string;
  src: string;
  openLabel: string;
  featuredCount: number;
  featured: string[];
  hidden: string[];
  stats: { from: StatRule; label: string }[];
  cards: Record<string, CardOverride>;
};

export type ChartView = {
  title: string;
  min: number;
  max: number;
  highlightFirst: boolean;
  bars: { label: string; sub: string; value: string; num: number; us: boolean }[];
};
export type PanelView = {
  id: string;
  href: string;
  featured: boolean;
  tag: string;
  title: string;
  badge: string;
  metric: string;
  metricLabel: string;
  source: string;
  chart: ChartView | null;
  // shown in the chart slot when the artifact chart is not a row chart (ROC curve, scatter)
  fallback: { title: string; lines: string[] };
};
export type DemoView = {
  label: string;
  title: string;
  description: string;
  updated: string;
  src: string;
  openLabel: string;
  stats: { value: string; label: string }[];
  featured: PanelView[];
  rest: PanelView[];
};

const dateOnly = (s: string) => (s.match(/^\d{4}-\d{2}-\d{2}/) ?? [s])[0];

// A chart where p2single is the first row and the other rows are other methods.
// methodsBeaten is how many: the other rows, or the count a single summary row states
// ("9 published methods" as one row counts as 9). 0 when the chart is not a comparison.
export function methodsBeaten(chart: GeneratedChart | null): number {
  if (!chart || !chart.bars.length || !chart.bars[0].us || !chart.competitors) return 0;
  if (chart.competitors === 1) {
    const only = chart.bars.find((b) => !b.us);
    const m = only && /(\d+)\s+(?:published\s+)?methods?\b/i.exec(only.label);
    return m ? Number(m[1]) : 1;
  }
  return chart.competitors;
}

// Badge derived from what the card states, in order of how specific it is.
export function deriveBadge(card: GeneratedCard): string {
  const beaten = methodsBeaten(card.chart);
  if (beaten >= 2) return `Top of ${beaten} methods`;
  const held = /never saw|never seen|kept out|unseen|held[- ]out/i;
  const text = `${card.title} ${card.scope} ${card.keyLines.join(" ")}`;
  if (/species/i.test(`${card.title} ${card.scope}`)) return "Across species";
  if (/one tissue|across tissues/i.test(card.scope)) return "Across tissues";
  if (held.test(card.scope) && /patient/i.test(card.scope)) return "Unseen patients";
  if (/(?:another|other|new|different|unseen) donors?\b|donors? (?:it|the model) never saw/i.test(text)) return "Unseen donors";
  if (/separate experiment|tested on run \d|separate run/i.test(text)) return "Separate experiment";
  return "";
}

function chartView(card: GeneratedCard, override: CardOverride): ChartView | null {
  const bars = (card.chart?.bars ?? []).filter((b): b is GeneratedBar & { num: number } => b.num !== null);
  if (bars.length < 2) return null;
  const nums = bars.map((b) => b.num);
  const lowest = Math.min(...nums);
  const min = override.chartMin ?? Math.max(0, Math.floor((lowest - 0.1) * 10) / 10);
  const max = Math.max(1, ...nums);
  return {
    title: card.chart?.label ?? "",
    min,
    max,
    highlightFirst: bars[0].us && !bars.every((b) => b.us),
    bars,
  };
}

function panelView(card: GeneratedCard, featured: boolean, config: DemoConfig): PanelView {
  const o = config.cards[card.id] ?? {};
  const metric = o.headline ?? card.headline ?? "";
  const metricLabel = o.metricLabel ?? card.scope;
  // the artifact's own explanatory line, without repeating what the card already shows below
  const lines = (card.keyLines.length ? [card.keyLines[0]] : card.bullets.length ? card.bullets.slice(0, 2) : [card.scope]).filter(
    (l) => l !== metricLabel
  );
  return {
    id: card.id,
    href: card.href,
    featured,
    tag: card.tag,
    title: card.title,
    badge: o.badge ?? deriveBadge(card),
    metric,
    metricLabel,
    source: card.sources.join(" · "),
    chart: chartView(card, o),
    fallback: { title: card.chart?.label ?? card.tag, lines },
  };
}

// The featured cards: pinned ids that still exist (in the pinned order), topped up with the
// first cards in artifact order until featuredCount is reached.
export function pickFeatured(visible: GeneratedCard[], config: DemoConfig): GeneratedCard[] {
  const count = Math.max(0, config.featuredCount);
  const byId = new Map(visible.map((c) => [c.id, c]));
  const picked: GeneratedCard[] = [];
  for (const id of config.featured) {
    const c = byId.get(id);
    if (c && !picked.includes(c)) picked.push(c);
  }
  for (const c of visible) {
    if (picked.length >= count) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked.slice(0, count);
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, "").replace(/\.$/, ""));

// One stat tile value computed over every visible card; "" when the artifact has no such data.
export function statValue(rule: StatRule, visible: GeneratedCard[], page: GeneratedDemo["page"]): string {
  switch (rule) {
    case "cardCount":
      return visible.length ? String(visible.length) : "";
    case "updated":
      return page.updated ? dateOnly(page.updated) : "";
    case "bestAuc": {
      const aucs = visible.map((c) => c.metric).filter((m) => m.kind === "AUC" && m.num !== null).map((m) => m.num as number);
      return aucs.length ? `AUC ${fmt(Math.max(...aucs))}` : "";
    }
    case "mostMethodsBeaten": {
      const counts = visible.map((c) => methodsBeaten(c.chart)).filter((n) => n >= 2);
      return counts.length ? String(Math.max(...counts)) : "";
    }
  }
}

export function buildDemoView(generated: GeneratedDemo, config: DemoConfig): DemoView {
  const visible = generated.cards.filter((c) => !config.hidden.includes(c.id));
  const featured = pickFeatured(visible, config);
  const rest = visible.filter((c) => !featured.includes(c));

  const stats = config.stats.map(({ from, label }) => ({ value: statValue(from, visible, generated.page), label })).filter((s) => s.value);

  return {
    label: config.label || generated.page.eyebrow,
    title: config.title || generated.page.title,
    description: config.description || generated.page.legend.find((l) => /every score/i.test(l)) || "",
    updated: generated.page.updated,
    src: config.src,
    openLabel: config.openLabel,
    stats,
    featured: featured.map((c) => panelView(c, true, config)),
    rest: rest.map((c) => panelView(c, false, config)),
  };
}
