import React from "react";
import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { ValueProposition } from "@/components/landing/value-proposition";
import { IntelligentPipeline } from "@/components/landing/intelligent-pipeline";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-zinc-950 font-sans text-foreground">
      <Navigation />
      <Hero />
      <ValueProposition />
      <IntelligentPipeline />
      <Pricing />
      <Footer />
    </main>
  );
}
