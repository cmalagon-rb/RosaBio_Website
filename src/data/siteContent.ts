// =============================================================================
// SITE CONTENT - Edit text here without touching component code
// =============================================================================
//
// HOW TO EDIT:
// 1. Find the section you want to edit (hero, valueProps, technology, etc.)
// 2. Change the text inside the quotes
// 3. Save and commit - the site will auto-deploy
//
// IMPORTANT:
// - The Single Cell Demo cards are generated from the artifact export, not typed here
//   (see the singleCellDemo section below and README "Single Cell Demo")
// - Don't delete quotes "" or commas ,
// - Don't change iconKey values unless instructed
// - Multi-line text uses backticks ` instead of quotes
//
// =============================================================================

export const siteContent = {
  // ===========================================================================
  // HERO SECTION
  // ===========================================================================
  hero: {
    title: {
      part1: "Stratification of",
      highlight: "Genomic Sequence Complexity",
      part2: "and Phenotypes for Precision Medicine",
    },
    subtitle: [
      "Statistics-first.",
      "No reference genome required.",
      "Unbiased discovery.",
    ],
    primaryButton: "Benefits of Rosa Bio Technology",
    updateNotice: {
      text: "The website is being updated with additional content.",
      contactPrefix: "Please contact:",
      email: "BD@rosabio.com",
      contactSuffix: "for more information.",
    },
  },

  // ===========================================================================
  // BENEFITS SECTION
  // ===========================================================================
  benefits: {
    title: "Benefits of Rosa Bio Technology",
    items: [
      "ROSA's \"statistics first\" Semore platform allows detection of genomic complexity missed by other methods",
      "Allows faster, cheaper, smarter genomics analysis",
      "Readily scalable",
      "Agnostic to nucleic acid type: DNA (WGS and targeted), RNA, short and long read, exome, non-coding regions, ctDNA, bisulfite, etc.",
      "Detects structure-based changes, not based on gene panels",
      "Can be used with tissue sample or liquid biopsy (plasma cfDNA)",
      "Software = AI ready",
      "Diverse applications: Dx, Tx, other",
    ],
  },

  // ===========================================================================
  // VALUE PROPS SECTION (Smarter. Better. Faster.)
  // ===========================================================================
  valueProps: {
    title: {
      part1: "Panoptic.",
      highlight: "Faster. Cheaper.",
    },
    subtitle: "",
    items: [
      {
        iconKey: "zap",
        title: "Speed",
        description: "Faster processing, lower overhead.",
      },
      {
        iconKey: "target",
        title: "Accuracy",
        description: "Assess all sequence variation in a sample with no bias.",
      },
      {
        iconKey: "trendingDown",
        title: "Cost",
        description: "High-efficiency analysis tools.",
      },
    ],
  },

  // ===========================================================================
  // TECHNOLOGY SECTION
  // ===========================================================================
  technology: {
    title: {
      part1: "A",
      highlight: "Statistics-First",
      part2: "Approach.",
    },
    paragraphs: [
      "A new paradigm for analysis of nucleic acid sequence information. Unlike traditional methods, we require no reference genome for sequence alignment.",
      "Our approach enables truly unbiased discovery, identifying patterns and variations that conventional tools simply cannot detect.",
    ],
    techSummary: [
      {
        title: "Why Statistics First",
        description: "Our statistics-first approach analyzes raw data directly, eliminating reference genome bias and enabling detection of all genomic complexity.",
      },
      {
        title: "White Papers",
        description: "Read our white papers on the benefits of a statistics-first approach to genomic analysis.",
        papers: [
          {
            title: "Benefits of a Statistics-first Approach to Analyzing Nucleic Acid Sequence Data",
            file: "/whitepapers/rosabio-benefits-of-statistics-first-approach.pdf",
          },
          {
            title: "Statistics-First Genomic Analysis: Expanding Detection beyond the Limits of Reference Alignment in Precision Medicine",
            file: "/whitepapers/rosabio-statistics-first-genomic-analysis-oct-2026.pdf",
          },
          {
            title: "Novel Algorithms for Interpretable, Ultra-Efficient Precision Medicine",
            file: "/whitepapers/rosabio-novel-algorithms-precision-medicine.pdf",
          },
        ],
      },
      {
        title: "Precision Medicine Applications",
        description: "Patient stratification using sequence variation that predicts treatment response and disease progression.",
      },
    ],
    slides: {
      pdfPath: "/slides/techsummary.pdf",
      items: [
        { title: "Enhanced Measurement of Genomic Complexity", subtitle: "To Drive Clinical Breakthroughs" },
        { title: "Old Paradigm, New Reality", subtitle: "NGS technologies generating massive amounts of genomic data" },
        { title: "Reference Genomes Poorly Represent Biology", subtitle: "Current methods are dependent on comparisons to reference genomes" },
        { title: "Legacy Genomics Workflows", subtitle: "Complex, time and resource intensive, with unavoidable data loss" },
        { title: "ROSA Changes the Paradigm", subtitle: "A statistics-first approach" },
        { title: "ROSA's Semore Platform", subtitle: "Smarter, faster, cheaper genomic analysis" },
        { title: "Comparison of Approaches", subtitle: "Traditional Alignment vs Statistics-First" },
        { title: "ROSA Semore Software Accuracy", subtitle: "Ability to detect all genetic features" },
        { title: "ROSA Semore Software Overview", subtitle: "Statistics-first detection of genomic complexity" },
        { title: "ROSA BIO Intellectual Property", subtitle: "Differentiated and protectable approach" },
      ],
    },
  },

  // ===========================================================================
  // SINGLE CELL DEMO SECTION (shown right under the hero)
  //
  // The cards, their numbers, charts and sources are NOT edited here. They come from
  // the p2single artifact export in public/highlights/ (parsed at build time into
  // src/data/singleCellDemo.generated.json). To update them, run /sync-demo in
  // Claude Code (see README). Only presentation choices live here:
  //   featured: card ids shown large on the top row, in this order
  //   hidden:   card ids to leave off the homepage (they stay in the full demo)
  //   stats:    the strip under the header. from = "cardCount", "updated", or a card id
  //             (shows that card's headline number)
  //   cards:    optional per-card overrides: badge, headline, metricLabel, chartMin
  //   label / title / description: "" = use the artifact's own text
  // ===========================================================================
  singleCellDemo: {
    artifactUrl: "https://claude.ai/artifact/CcKXrB5KSXn2khh9pR5Y4X",
    label: "p2single results",
    title: "Single Cell Demo",
    description: "Sequence-level models, tested on cells they never saw. Every score is on cells, patients or experiments kept out of training.",
    src: "/highlights/index.html",
    openLabel: "Open the full demo",
    featured: ["c6", "c1"],
    hidden: [] as string[],
    stats: [
      { from: "cardCount", label: "public studies" },
      { from: "c1", label: "on patients the model never saw" },
      { from: "c6", label: "published pancreas results beaten" },
      { from: "updated", label: "artifact last updated" },
    ],
    cards: {
      c6: { badge: "Top of 17 methods" },
      c1: { badge: "Unseen patients" },
    } as Record<string, { badge?: string; headline?: string; metricLabel?: string; chartMin?: number }>,
  },

  // ===========================================================================
  // LEADERSHIP SECTION
  // ===========================================================================
  leadership: {
    title: "Leadership",
    subtitle: "",
    team: [
      {
        initials: "JS",
        name: "Julia Salzman",
        title: "Founder",
        description: `Associate Professor in the Department of Biomedical Data Science, and by courtesy in Biology and Statistics at Stanford University. A.B. in Mathematics from Princeton University magna cum laude and Ph.D. from Stanford University in Statistics. Developed statistical algorithms that discovered circular RNA and statistics-first genomic algorithms. Research funded by NIH, NSF, CZI. Recognized with Alfred P. Sloan Fellowship, McCormick-Gabilan Fellowship, and NSF CAREER Award.`,
      },
      {
        initials: "MR",
        name: "Michael Rabson",
        title: "Co-Founder & CEO",
        description: `More than 25 years of experience in life sciences. Former partner at Wilson Sonsini Goodrich & Rosati for 15 years. Served as General Counsel of Maxygen (MAXY) and Cytokinetics (CYTK). Former patent examiner at USPTO focused on biotechnology. Member of the patent bar. Author of scientific publications in Science, Nature, PNAS. Ph.D. from Yale University and J.D. from Yale Law School.`,
      },
    ],
  },

  // ===========================================================================
  // NAVBAR / NAVIGATION
  // ===========================================================================
  navbar: {
    logo: {
      part1: "Rosa",
      part2: "Bio",
    },
    links: [
      { href: "#home", label: "Home" },
      { href: "#technology", label: "Technology" },
      { href: "#demo", label: "Single Cell Demo" },
      { href: "#leadership", label: "About" },
      { href: "#contact", label: "Contact" },
    ],
  },

  // ===========================================================================
  // FOOTER / CONTACT
  // ===========================================================================
  footer: {
    logo: {
      part1: "Rosa",
      part2: "Bio",
    },
    contactText: "For corporate partnerships and business development:",
    email: "BD@rosabio.com",
    copyright: "RosaBio. All rights reserved.",
  },
};