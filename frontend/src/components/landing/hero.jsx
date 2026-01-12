import React from "react"
import { motion } from "framer-motion"
import { ArrowRight, ShieldCheck, Zap, Laptop, Brain, Users, Globe, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background Media */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950 z-10" />
                <img
                    src="/enterprise_ai_hero.png"
                    alt="P.A.I.D.S Enterprise"
                    className="w-full h-full object-cover opacity-60 scale-105"
                />
            </div>

            <div className="container relative z-20 mx-auto px-6">
                <div className="max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
                    >
                        <ShieldCheck className="size-4 text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/70">Fully Customizable White-Label AI v1.9.1</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.1] mb-8 text-white"
                    >
                        P.A.I.D.S <br />
                        <span className="text-zinc-500">Architecture.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-2xl text-zinc-400 max-w-3xl mb-12 leading-relaxed font-normal"
                    >
                        The **Proposals And Invoices Deployment System**. **Your Brand**, **Your Logo**, and **Unlimited Workspaces**.
                        Aggregate 25+ AI models including GPT-4o, Claude 3.5, and Gemini into one secure, deterministic hub.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center gap-6"
                    >
                        <Button size="lg" className="h-16 px-12 rounded-lg bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-[11px] group">
                            Start Your Workspace <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button size="lg" variant="outline" className="h-16 px-12 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 font-bold uppercase tracking-widest text-[11px]">
                            View Enterprise Demo
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 1 }}
                        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-12"
                    >
                        {[
                            { label: "AI Models", value: "25+ Providers", icon: Brain },
                            { label: "Workspaces", value: "Unlimited", icon: Layout },
                            { label: "Capacity", value: "Unlimited Users", icon: Users },
                            { label: "Data Safety", value: "100% Sovereign", icon: ShieldCheck },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <stat.icon className="size-3" />
                                    <span className="text-[9px] uppercase font-bold tracking-widest">{stat.label}</span>
                                </div>
                                <span className="text-xl font-bold text-white tracking-tighter">{stat.value}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </section>
    )
}
