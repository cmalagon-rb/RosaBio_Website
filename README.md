# RosaBio Website

Dark theme with particle effects background.

## Getting Started

Open [https://www.rosabio.com/](https://www.rosabio.com/)

## Editing Site Content

All site text is centralized in a single file for easy editing:

**`src/data/siteContent.ts`**

### Editable Sections

| Section      | What You Can Edit                                                   |
| ------------ | ------------------------------------------------------------------- |
| `hero`       | Main title, highlighted text, subtitle, button label                |
| `valueProps` | "Smarter. Better. Faster." section - title, subtitle, 3 value cards |
| `technology` | Technology section title, paragraphs, external link                 |
| `singleCellDemo` | Presentation only: featured cards, badges, stats strip, section copy (card data is generated, see below) |
| `liquidBiopsyDemo` | Same as `singleCellDemo`, for the Liquid Biopsy Demo (see "Liquid Biopsy Demo" below) |
| `leadership` | Section title, subtitle, team member cards (name, title, bio)       |
| `navbar`     | Logo text, navigation links                                         |
| `footer`     | Logo text, contact text, email, copyright                           |

### How to Edit

1. Open `src/data/siteContent.ts`
2. Find the section you want to edit
3. Change the text inside the quotes
4. Save the file

### Important Rules

- **Don't delete quotes `""`** or commas `,`
- **Don't change `iconKey` values** unless instructed
- **Multi-line text** uses backticks `` ` `` instead of quotes

### Example

To change the hero subtitle:

```typescript
hero: {
  // ...
  subtitle: "Your new subtitle text here.",
  // ...
},
```

## Single Cell Demo

The "Single Cell Demo" section and the full demo at `/highlights/` mirror the public
Claude artifact `https://claude.ai/artifact/CcKXrB5KSXn2khh9pR5Y4X` (p2single highlights).

How it fits together:

- `public/highlights/` is the artifact's export (47 files). `public/highlights/.artifact-version.json`
  records which artifact version it is.
- `scripts/prepare-highlights.mjs` (runs before every dev/build) rewrites links to the private
  claude.ai study pages and retitles the page.
- `scripts/extract-demo.mjs` (also before every dev/build) parses the export into
  `src/data/singleCellDemo.generated.json`: page header, every card's tag, title, scope,
  headline number, chart rows, sources and link. The homepage renders from that file through
  `src/lib/demo.ts`. Never edit the generated file by hand.
- `siteContent.singleCellDemo` holds only presentation choices, and none of them name a card
  id, so the section follows the artifact on its own:
  - the featured (large) cards are the first `featuredCount` cards in the artifact's own order;
    every other study goes into the horizontal "More studies" strip, so the section stays the
    same height however many studies the artifact has
  - the stats strip is computed over all cards (study count, best AUC, most published methods
    beaten in one comparison chart, artifact last-updated date)
  - badges are derived from each card ("Top of N methods" for a comparison chart, "Unseen
    patients", "Across species", ...)
  - per-card overrides (`cards`, `featured`) exist for editorial exceptions and are empty
- Links from a card to its full study page: `prepare-highlights.mjs` maps claude.ai study
  links to the local pages under `public/highlights/s/`. A link it has not seen is matched to
  an unclaimed study page whose `<title>` starts with a token (accession or dataset name) found
  in the card's text or its detail panel, and the match is recorded in
  `public/highlights/.study-pages.json`, which the sync keeps and commits, so the mapping is
  permanent without a code change. A link with no matching page is dropped and its text kept.
  Both cases print a `prepare-highlights:` line during the build.

### Updating the demo when the artifact changes

claude.ai does not let servers fetch artifacts, so the sync is a Claude Code step. In this repo run:

```
/sync-demo
```

It downloads the artifact files, replaces `public/highlights/`, regenerates the card data,
builds, and commits on a `demo-sync-<date>` branch. Merge to `main` to deploy.
If `extract-demo` fails the artifact's markup changed; fix the parser before merging.

A daily Claude Code cloud routine does the same and opens a pull request when the artifact
changed: setup and the routine prompt are in `docs/demo-sync-routine.md`.

## Liquid Biopsy Demo

The "Liquid Biopsy Demo" section (nav tab of the same name, right under the Single Cell Demo)
and the full page at `/liquid-biopsy/index.html` mirror the Claude artifact
`https://claude.ai/artifact/GdVZhFeKtZ9uyrx1xFWiE6` (P2G liquid biopsy highlights). It works
like the Single Cell Demo, and both sections are drawn by the same component
(`src/components/sections/DemoSection.tsx`) from the same view rules (`src/lib/demo.ts`):

- `public/liquid-biopsy/index.html` is the artifact's page (it is a single page).
  `.artifact-version.json` records the artifact version; `.artifact-edits.json` holds the
  page's in-place text edits, which the artifact keeps in its database rather than in the page.
- `scripts/prepare-liquid-biopsy.mjs` (before every dev/build) writes those edits into the page,
  retitles it "Liquid Biopsy Demo", drops links to private claude.ai pages, and outlines the
  card a homepage link lands on (`index.html#<card id>`).
- `scripts/extract-liquid-biopsy.mjs` (also before every dev/build) parses the page into
  `src/data/liquidBiopsyDemo.generated.json`: header, every result card's tag, title, scope,
  headline number (from the card's own title), sources, and chart rows. The page draws its
  charts in the browser from embedded data, so the row charts (P2G vs the paper, sensitivity at
  95% specificity, untested questions, cross-center models) are read from that data, and a
  results table with an AUC column becomes a row chart. Scatter plots and heatmaps show the
  headline number and the card's note instead. Never edit the generated file by hand.
- `siteContent.liquidBiopsyDemo` holds only presentation choices, with the same rules as the
  Single Cell Demo (first `featuredCount` cards in artifact order are featured, the rest go into
  the "More results" strip). The stats strip uses two extra rules: `paperComparisons`
  (comparisons where P2G is within 0.02 of the paper's AUC or higher, as the artifact colours
  them) and `questionCount` (study questions scored on held-out samples). Badges are derived
  from each card ("Beats the paper", "Matches the paper", "Known answer", "Another lab", ...).

### Updating the demo when the artifact changes

In this repo run:

```
/sync-liquid-biopsy
```

It reads the artifact version and its in-page edits, downloads the page if anything changed,
replaces `public/liquid-biopsy/`, regenerates the card data, builds, and commits on a
`liquid-biopsy-sync-<date>` branch. Merge to `main` to deploy.

A daily Claude Code cloud routine does the same and opens a pull request when the artifact or
its edits changed: the routine prompt is in `docs/liquid-biopsy-sync-routine.md`.

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Particles**: tsparticles

## Deployment

Deployed on [Vercel](https://vercel.com).
