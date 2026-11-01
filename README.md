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
- `siteContent.singleCellDemo` holds only presentation choices (which cards are featured,
  badges, the stats strip, section copy). New cards in the artifact show up automatically:
  the featured cards sit on top and every other study goes into the horizontal "More studies"
  strip, so the section stays the same height however many studies the artifact has.

### Updating the demo when the artifact changes

claude.ai does not let servers fetch artifacts, so the sync is a Claude Code step. In this repo run:

```
/sync-demo
```

It downloads the artifact files, replaces `public/highlights/`, regenerates the card data,
builds, and commits on a `demo-sync-<date>` branch. Merge to `main` to deploy.
If `extract-demo` fails the artifact's markup changed; fix the parser before merging.

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Particles**: tsparticles

## Deployment

Deployed on [Vercel](https://vercel.com).
