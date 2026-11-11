import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { SingleCellDemo } from "@/components/sections/SingleCellDemo";
import { LiquidBiopsyDemo } from "@/components/sections/LiquidBiopsyDemo";
import { Benefits } from "@/components/sections/Benefits";
import { ValueProps } from "@/components/sections/ValueProps";
import { Technology } from "@/components/sections/Technology";
import { Leadership } from "@/components/sections/Leadership";

export default function Home() {
  return (
    <main className="min-h-screen bg-navy-darkest">
      <Navbar />
      <Hero />
      <SingleCellDemo />
      <LiquidBiopsyDemo />
      <Benefits />
      <ValueProps />
      <Technology />
      <Leadership />
      <Footer />
    </main>
  );
}
