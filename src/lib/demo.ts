// Builds what the "Single Cell Demo" section renders from
//   - src/data/singleCellDemo.generated.json  (parsed from the p2single artifact export by
//     scripts/extract-demo.mjs; regenerated on every dev/build, never hand-edited)
//   - siteContent.singleCellDemo               (presentation choices: featured cards, badges, copy)
// Everything the artifact states wins; the config only fills what the artifact does not have.

export type GeneratedBar = { label: string; sub: string; value: string; num: number | null; us: boolean };
export type GeneratedChart = { label: string; bars: GeneratedBar[] };
export type GeneratedCard = {
  id: string;
  n: number;
  tag: string;
  title: string;
  scope: string;
  bullets: string[];
  keyLines: string[];
  headline: string | null;
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
export type StatSource = "cardCount" | "updated" | (string & {}); // or a card id such as "c6"
export type DemoConfig = {
  artifactUrl: string;
  label: string;
  title: string;
  description: string;
  src: string;
  openLabel: string;
  featured: string[];
  hidden: string[];
  stats: { from: StatSource; label: string }[];
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

function panelView(card: GeneratedCard, config: DemoConfig): PanelView {
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
    featured: config.featured.includes(card.id),
    tag: card.tag,
    title: card.title,
    badge: o.badge ?? "",
    metric,
    metricLabel,
    source: card.sources.join(" · "),
    chart: chartView(card, o),
    fallback: { title: card.chart?.label ?? card.tag, lines },
  };
}

export function buildDemoView(generated: GeneratedDemo, config: DemoConfig): DemoView {
  const byId = new Map(generated.cards.map((c) => [c.id, c]));
  const visible = generated.cards.filter((c) => !config.hidden.includes(c.id));
  const featured = config.featured.map((id) => byId.get(id)).filter((c): c is GeneratedCard => !!c && !config.hidden.includes(c.id));
  const rest = visible.filter((c) => !config.featured.includes(c.id));

  const stats = config.stats
    .map(({ from, label }) => {
      if (from === "cardCount") return { value: String(visible.length), label };
      if (from === "updated") return { value: dateOnly(generated.page.updated), label };
      const card = byId.get(from);
      const value = config.cards[from]?.headline ?? card?.headline ?? "";
      return { value, label };
    })
    .filter((s) => s.value);

  return {
    label: config.label || generated.page.eyebrow,
    title: config.title || generated.page.title,
    description: config.description || generated.page.legend.find((l) => /every score/i.test(l)) || "",
    updated: generated.page.updated,
    src: config.src,
    openLabel: config.openLabel,
    stats,
    featured: featured.map((c) => panelView(c, config)),
    rest: rest.map((c) => panelView(c, config)),
  };
}
