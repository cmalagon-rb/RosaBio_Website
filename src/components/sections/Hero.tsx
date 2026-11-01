"use client";

import { Button } from "@/components/ui/Button";
import { ParticlesBackground } from "@/components/particles/ParticlesBackground";
import { motion } from "framer-motion";
import { ArrowDown, Info } from "lucide-react";
import { siteContent } from "@/data/siteContent";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export function Hero() {
  const scrollToBenefits = () => {
    const element = document.getElementById("benefits");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-darkest pb-12 pt-24 md:pb-16 md:pt-28"
    >
      {/* Particles Background */}
      <div className="absolute inset-0">
        <ParticlesBackground />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-darkest/50 via-transparent to-navy-darkest" />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-5xl px-6 text-center md:px-8"
      >
        {/* Fluid type: grows with width but is capped by viewport height, so the whole hero
            (headline, subtitle, button, notice) fits above the fold on 1280x720 / 1366x768 laptops */}
        <motion.h1
          variants={itemVariants}
          className="text-[clamp(2.25rem,min(5vw,7.2vh),4.5rem)] font-bold leading-tight tracking-tight"
        >
          {siteContent.hero.title.part1}{" "}
          <span className="text-electric-blue">{siteContent.hero.title.highlight}</span>{" "}
          {siteContent.hero.title.part2}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-[clamp(1rem,3vh,2rem)] max-w-2xl text-[clamp(1.125rem,2.4vh,1.5rem)] text-slate-lighter"
        >
          {Array.isArray(siteContent.hero.subtitle)
            ? siteContent.hero.subtitle.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))
            : siteContent.hero.subtitle}
        </motion.p>

        <motion.div variants={itemVariants} className="mt-[clamp(1.5rem,4vh,3rem)]">
          <Button size="lg" onClick={scrollToBenefits}>
            {siteContent.hero.primaryButton}
            <ArrowDown className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Site update notice */}
        <motion.div
          variants={itemVariants}
          className="mx-auto mt-[clamp(1.5rem,4vh,2.5rem)] flex max-w-xl items-start gap-3 rounded-xl border border-electric-blue/30 bg-navy-dark/70 px-5 py-4 text-left text-sm text-slate-lighter backdrop-blur-sm md:text-base"
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-electric-blue" />
          <p>
            {siteContent.hero.updateNotice.text}{" "}
            {siteContent.hero.updateNotice.contactPrefix}{" "}
            <a
              href={`mailto:${siteContent.hero.updateNotice.email}`}
              className="font-semibold text-electric-blue transition-colors hover:text-electric-blue-light"
            >
              {siteContent.hero.updateNotice.email}
            </a>{" "}
            {siteContent.hero.updateNotice.contactSuffix}
          </p>
        </motion.div>
      </motion.div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-darkest to-transparent" />
    </section>
  );
}
