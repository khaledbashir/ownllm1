import React from "react"
import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const PLANS = [
    {
        name: "Estimator Engine",
        price: "2,500",
        desc: "Custom CPQ deployment for specific estimating workflows.",
        features: [
            "Smart Estimator Logic",
            "PDF Eater (File Ingestion)",
            "Geo-API Address Intelligence",
            "Auto-Math Pricing Engine",
            "Branded PDF Exports",
            "Managed Hosting Included"
        ],
        button: "Start 2-Week Build",
        featured: false
    },
    {
        name: "Sovereign Intelligence OS",
        price: "4,500",
        desc: "The complete AI operating system for enterprise-wide intelligence.",
        features: [
            "Everything in Estimator",
            "Full RAG Knowledge Base",
            "OCR (Tesseract) & YouTube Sync",
            "Universal Web Crawler",
            "SSO & Directory Sync",
            "Priority Vector DB"
        ],
        button: "Start 4-Week Deployment",
        featured: true
    }
]

export function Pricing() {
    return (
        <section id="pricing" className="py-32 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-4"
                    >
                        Managed <br />
                        <span className="text-zinc-500 uppercase">Sovereign Infrastructure.</span>
                    </motion.h2>
                    <p className="text-zinc-500 font-normal">One-time build fee. Standard $400/mo retainer for hosting, monitoring, and models.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {PLANS.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-10 border transition-all duration-500 ${plan.featured
                                ? "bg-white border-white text-black scale-105 z-10"
                                : "bg-zinc-950 border-white/10 text-white"
                                }`}
                        >
                            <div className="flex flex-col h-full">
                                <div className="mb-8">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-4 block ${plan.featured ? "text-black/50" : "text-zinc-500"}`}>
                                        {plan.name}
                                    </span>
                                    <div className="flex flex-col gap-1 items-start">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold leading-none">${plan.price}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${plan.featured ? "text-black/50" : "text-zinc-500"}`}>Build Fee</span>
                                        </div>
                                        <div className={`text-xs font-bold uppercase tracking-widest ${plan.featured ? "text-black/60" : "text-zinc-400"}`}>
                                            + $400/mo Infrastructure
                                        </div>
                                    </div>
                                </div>

                                <p className={`text-sm mb-10 min-h-[40px] ${plan.featured ? "text-black/60 font-medium" : "text-zinc-500 font-normal"}`}>
                                    {plan.desc}
                                </p>

                                <div className="space-y-4 mb-12 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <Check className={`size-4 shrink-0 ${plan.featured ? "text-black" : "text-zinc-500"}`} />
                                            <span className="text-xs font-bold uppercase tracking-wide">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button className={`w-full h-14 rounded-lg font-bold uppercase tracking-widest text-[10px] group ${plan.featured
                                    ? "bg-black text-white hover:bg-zinc-800"
                                    : "bg-white text-black hover:bg-zinc-200"
                                    }`}>
                                    {plan.button} <ArrowRight className="ml-2 size-3 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="mt-20 border-t border-white/5 pt-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-lg">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Support & Maintenance</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                                Post-launch, we ensure your infrastructure stays sharp. Choose between an active retainer for security and feature updates or pay-as-you-go hourly support.
                            </p>
                            <div className="flex gap-12">
                                <div>
                                    <div className="text-lg font-bold text-white">$400/mo</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Standard Retainer</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-lg">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">We Handle The Noise</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                                You own the data. We own the uptime.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Hosting</div>
                                    <div className="text-[11px] font-bold text-white">DigitalOcean / Hetzner (We Pay)</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Models</div>
                                    <div className="text-[11px] font-bold text-white">Mid-Tier Pack (Included)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
