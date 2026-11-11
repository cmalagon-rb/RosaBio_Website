"use client";

import { Microscope } from "lucide-react";
import { siteContent } from "@/data/siteContent";
import generated from "@/data/singleCellDemo.generated.json";
import { buildDemoView, type GeneratedDemo } from "@/lib/demo";
import { DemoSection } from "./DemoSection";

// Cards, numbers, charts and sources come from the p2single artifact export
// (src/data/singleCellDemo.generated.json, rebuilt on every dev/build by scripts/extract-demo.mjs).
// siteContent.singleCellDemo only holds presentation choices. See README "Single Cell Demo".
const view = buildDemoView(generated as unknown as GeneratedDemo, siteContent.singleCellDemo);

export function SingleCellDemo() {
  return <DemoSection view={view} id="demo" icon={Microscope} />;
}
