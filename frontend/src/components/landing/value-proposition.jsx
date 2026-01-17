import React from "react";
import { motion } from "framer-motion";
import { Palette, Users, Globe } from "lucide-react";

const VALUE_PROPS = [
  {
    title: "Complete White-Labeling",
    desc: "Your platform, your identity. Upload your own logo (48x48px), choose your primary brand colors, and set custom display names across the entire interface.",
    icon: Palette,
    details: [
      "Custom Logos & Assets",
      "Themable UI Components",
      "Personalized System Prompts",
    ],
  },
  {
    title: "Unlimited Scale",
    desc: "No per-seat tax. Create as many workspaces and invite as many users as your business requires. Scalability is built into the core architecture.",
    icon: Users,
    details: [
      "Infinite Workspaces",
      "Multi-Tenant Isolation",
      "Admin & Member Roles",
    ],
  },
  {
    title: "25+ Model Aggregator",
    desc: "Stop switching tabs. Access OpenAI, Anthropic, Gemini, Azure, and local models like Llama 3 from a single unified workspace.",
    icon: Globe,
    details: [
      "GPT-4o & Claude 3.5 Ready",
      "Local Model Support (Ollama)",
      "Enterprise-Grade Security",
    ],
  },
];

export function ValueProposition() {
  return (
    <section id="vprop" className="py-32 bg-zinc-950">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-6"
          >
            The Business <br />
            <span className="text-zinc-500 uppercase">OS for AI.</span>
          </motion.h2>
          <p className="text-lg text-zinc-300 font-normal leading-relaxed">
            P.A.I.D.S isn't just a chatbot—it's your private, branded
            infrastructure. Scale your intelligence across every department
            without the enterprise premium.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {VALUE_PROPS.map((prop, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-10 bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group"
            >
              <div className="size-12 rounded bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                <prop.icon className="size-6 text-white" />
              </div>

              <h3 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
                {prop.title}
              </h3>
              <p className="text-sm text-zinc-400 font-normal leading-relaxed mb-8">
                {prop.desc}
              </p>

              <div className="space-y-3 border-t border-white/5 pt-6">
                {prop.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="size-1 bg-white/20 rounded-full" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">
                      {detail}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
