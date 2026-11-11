"use client";

import { Section } from "@/components/ui/Section";
import { ArrowUpRight, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ChartView, DemoView, PanelView } from "@/lib/demo";
import { cn } from "@/lib/utils";

// The artifact-driven demo sections ("Single Cell Demo", "Liquid Biopsy Demo"). Both render
// a DemoView built by src/lib/demo.ts from a generated JSON file (see SingleCellDemo.tsx and
// LiquidBiopsyDemo.tsx), so they look and behave the same.
//
// Layout: the featured cards sit on top; every other study goes into a horizontal,
// scroll-snapping strip, so any number of studies fits without growing the page.

function ArrowCircle({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-medium text-slate-lighter transition-colors duration-200",
        "group-hover:border-electric-blue group-hover:bg-electric-blue group-hover:text-white",
        className
      )}
    >
      <ArrowUpRight className="h-4 w-4" />
    </span>
  );
}

function Badge({ badge }: { badge: string }) {
  if (!badge) return null;
  return (
    <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300">{badge}</span>
  );
}

function Chart({ chart, badge, large }: { chart: ChartView; badge: string; large: boolean }) {
  const span = chart.max - chart.min || 1;
  return (
    <div className={cn("flex grow flex-col justify-center gap-2 rounded-xl bg-navy-darkest", large ? "p-6 md:p-7" : "p-[18px]")}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-lighter">{chart.title}</span>
        <Badge badge={badge} />
      </div>
      {chart.bars.map((bar, i) => {
        const hi = !chart.highlightFirst || i === 0;
        const strong = chart.highlightFirst && i === 0;
        const width = Math.min(100, Math.max(0, ((bar.num - chart.min) / span) * 100));
        return (
          <div
            key={`${i}-${bar.label}`}
            className={cn(
              "grid items-center text-xs",
              large ? "grid-cols-[120px_minmax(0,1fr)_52px] gap-3 md:text-[13px]" : "grid-cols-[minmax(0,5fr)_minmax(0,6fr)_48px] gap-2.5"
            )}
          >
            <span
              className={cn("line-clamp-2 leading-tight", strong ? "font-semibold text-white" : "text-slate-lighter")}
              title={bar.sub ? `${bar.label} (${bar.sub})` : bar.label}
            >
              {bar.label}
            </span>
            <span className={cn("overflow-hidden rounded-full bg-navy-medium", large && chart.bars.length < 4 ? "h-3" : "h-2")}>
              <span
                className={cn("block h-full rounded-full", hi ? "bg-electric-blue" : "bg-slate-medium")}
                style={{ width: `${width}%` }}
              />
            </span>
            <span className={cn("text-right tabular-nums", strong ? "font-semibold text-white" : "text-slate-lighter")}>
              {bar.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// For cards whose artifact chart is not a row chart (ROC curve, scatter plot):
// the headline number and the artifact's own explanatory line.
function Summary({ panel, large }: { panel: PanelView; large: boolean }) {
  return (
    <div className={cn("flex grow flex-col justify-center gap-3 rounded-xl bg-navy-darkest", large ? "p-6 md:p-7" : "p-[18px]")}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-lighter">{panel.fallback.title}</span>
        <Badge badge={panel.badge} />
      </div>
      <span className={cn("tracking-tight text-white", large ? "text-5xl" : "text-[34px]")}>{panel.metric}</span>
      {panel.fallback.lines.map((line) => (
        <p key={line} className="text-[13px] leading-relaxed text-slate-lighter">
          {line}
        </p>
      ))}
    </div>
  );
}

function DemoCard({ panel, className }: { panel: PanelView; className?: string }) {
  const large = panel.featured;
  return (
    <a
      href={panel.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex flex-col rounded-2xl border border-slate-dark/50 bg-navy-medium/40 transition-all duration-200",
        "hover:-translate-y-1 hover:border-electric-blue/40 hover:bg-navy-medium/70 hover:shadow-lg hover:shadow-electric-blue/10",
        large ? "gap-6 p-5 md:p-6" : "gap-5 p-4 md:p-5",
        className
      )}
    >
      <div className={cn("flex grow flex-col", !large && "min-h-[150px]")}>
        {panel.chart ? <Chart chart={panel.chart} badge={panel.badge} large={large} /> : <Summary panel={panel} large={large} />}
      </div>
      <div className={cn("flex flex-col", large ? "gap-3 px-2 pb-2" : "grow gap-2.5 px-1 pb-1")}>
        <span className="self-start rounded-full bg-electric-blue/15 px-2.5 py-1 text-xs text-electric-blue-light">
          {panel.tag}
        </span>
        <h3
          className={cn(
            "font-normal tracking-tight text-white",
            large ? "text-2xl leading-snug md:text-[28px]" : "text-[19px] leading-snug"
          )}
        >
          {panel.title}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-4 pt-2">
          <div className="flex min-w-0 flex-col gap-1">
            <span className={cn("tracking-tight text-electric-blue", large ? "text-4xl md:text-[40px]" : "text-[28px]")}>
              {panel.metric}
            </span>
            {large && (
              <span className="line-clamp-2 text-[15px] text-slate-lighter" title={panel.metricLabel}>
                {panel.metricLabel}
              </span>
            )}
            <span className="truncate text-xs text-slate-light" title={large ? panel.source : `${panel.metricLabel} · ${panel.source}`}>
              {panel.source}
            </span>
          </div>
          <ArrowCircle className={cn(!large && "h-10 w-10")} />
        </div>
      </div>
    </a>
  );
}

function ArrowButton({ onClick, disabled, label, children }: { onClick: () => void; disabled: boolean; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border border-slate-medium text-slate-300 transition-colors duration-200",
        "hover:border-electric-blue hover:bg-electric-blue hover:text-white",
        "disabled:cursor-default disabled:opacity-35 disabled:hover:border-slate-medium disabled:hover:bg-transparent disabled:hover:text-slate-300"
      )}
    >
      {children}
    </button>
  );
}

// Horizontal, scroll-snapping row of the non-featured studies. Native scrolling (drag,
// trackpad, swipe) plus arrow buttons; the dots show which "page" of cards is in view.
function StudyStrip({ panels, heading }: { panels: PanelView[]; heading: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ page: 0, pages: 1, atStart: true, atEnd: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    const page = max > 0 ? Math.min(pages - 1, Math.round((el.scrollLeft / max) * (pages - 1))) : 0;
    setPos({ page, pages, atStart: el.scrollLeft <= 2, atEnd: el.scrollLeft >= max - 2 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (!panels.length) return null;

  return (
    <div className="mt-11">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-[22px] tracking-tight text-white">{heading}</span>
          <span className="text-sm text-slate-lighter">
            {panels.length} further results · <span className="hidden sm:inline">drag or use the arrows</span>
            <span className="sm:hidden">swipe</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: pos.pages }, (_, i) => (
              <span
                key={i}
                className={cn("block h-1.5 rounded-full transition-all duration-300", i === pos.page ? "w-7 bg-electric-blue" : "w-2 bg-slate-dark")}
              />
            ))}
          </span>
          <ArrowButton onClick={() => scrollBy(-1)} disabled={pos.atStart} label="Previous studies">
            <ChevronLeft className="h-4 w-4" />
          </ArrowButton>
          <ArrowButton onClick={() => scrollBy(1)} disabled={pos.atEnd} label="Next studies">
            <ChevronRight className="h-4 w-4" />
          </ArrowButton>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={measure}
        className={cn(
          "-mx-6 mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 scroll-pl-6 md:-mx-8 md:px-8 md:scroll-pl-8 lg:-mx-12 lg:px-12 lg:scroll-pl-12",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          !pos.atEnd && "md:[mask-image:linear-gradient(90deg,#000_0,#000_calc(100%-96px),transparent)]"
        )}
      >
        {panels.map((panel) => (
          <DemoCard key={panel.id} panel={panel} className="w-[300px] shrink-0 snap-start sm:w-[340px]" />
        ))}
      </div>
    </div>
  );
}

export function DemoSection({ view, id, icon: Icon, className }: { view: DemoView; id: string; icon: LucideIcon; className?: string }) {
  const { label, title, description, updated, src, openLabel, moreLabel, stats, featured, rest } = view;

  return (
    <Section id={id} className={cn("bg-navy-dark", className)}>
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-3xl flex-col gap-6">
          <div className="flex items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-light text-slate-lighter">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex h-8 items-center rounded-full border border-slate-light px-4 text-sm text-slate-lighter">
              {label}
            </span>
          </div>
          <h2 className="text-5xl font-normal tracking-tight text-white md:text-6xl">{title}</h2>
          <p className="text-lg leading-relaxed text-slate-lighter md:text-xl">{description}</p>
          {updated && <p className="text-sm text-slate-light">Results last updated {updated}</p>}
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex shrink-0 items-center self-start md:self-auto"
        >
          <span className="flex h-12 items-center rounded-full bg-electric-blue px-6 font-medium text-white transition-[padding] duration-[1200ms] ease-[cubic-bezier(0.175,1.4,0.32,1)] group-hover:pr-[72px]">
            {openLabel}
          </span>
          {/* On hover the circle slides into the pill and the arrow turns from ↗ to →.
              pr-[72px] = px-6 + the circle's 48px, so the button keeps its width */}
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-electric-blue text-electric-blue-light transition-[margin,background-color,color] duration-[1200ms] ease-[cubic-bezier(0.175,1.4,0.32,1)] group-hover:-ml-12 group-hover:bg-electric-blue group-hover:text-white">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-[1200ms] ease-[cubic-bezier(0.175,1.4,0.32,1)] group-hover:rotate-45" />
          </span>
        </a>
      </div>

      {stats.length > 0 && (
        <div className="mt-12 grid grid-cols-2 border-y border-slate-dark/70 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 py-6 pr-4">
              <span className="whitespace-nowrap text-2xl tracking-tight text-white md:text-3xl">{stat.value}</span>
              <span className="text-sm text-slate-lighter">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {featured.length > 0 && (
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {featured.map((panel) => (
            <DemoCard key={panel.id} panel={panel} />
          ))}
        </div>
      )}

      <StudyStrip panels={rest} heading={moreLabel} />
    </Section>
  );
}
