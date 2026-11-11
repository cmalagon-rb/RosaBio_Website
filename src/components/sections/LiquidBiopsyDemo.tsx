"use client";

import { Droplet } from "lucide-react";
import { siteContent } from "@/data/siteContent";
import generated from "@/data/liquidBiopsyDemo.generated.json";
import { buildDemoView, type GeneratedDemo } from "@/lib/demo";
import { DemoSection } from "./DemoSection";

// Cards, numbers, charts and sources come from the P2G liquid biopsy artifact
// (src/data/liquidBiopsyDemo.generated.json, rebuilt on every dev/build by
// scripts/extract-liquid-biopsy.mjs). siteContent.liquidBiopsyDemo only holds presentation
// choices. Same layout and behaviour as the Single Cell Demo. See README "Liquid Biopsy Demo".
const view = buildDemoView(generated as unknown as GeneratedDemo, siteContent.liquidBiopsyDemo);

export function LiquidBiopsyDemo() {
  return <DemoSection view={view} id="liquid-biopsy" icon={Droplet} className="border-t border-slate-dark/60" />;
}
