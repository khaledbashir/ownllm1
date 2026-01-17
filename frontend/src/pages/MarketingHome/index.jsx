import React from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { ValueProposition } from "@/components/landing/value-proposition";
import { IntelligentPipeline } from "@/components/landing/intelligent-pipeline";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-zinc-950 font-sans text-white">
      <Navigation />
      <Hero />
      <ValueProposition />
      <IntelligentPipeline />
      <Pricing />
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-6">
              Ready to Deploy Your Intelligence?
            </h2>
            <p className="text-lg text-zinc-400 font-normal mb-12">
              Get started with your sovereign AI infrastructure in minutes. No
              credit card required for initial consultation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register">
                <Button
                  size="lg"
                  className="h-16 px-12 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-[11px] group"
                >
                  Get Started Now{" "}
                  <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-12 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 font-bold uppercase tracking-widest text-[11px]"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
