import React from "react"
import { Brain, Twitter, Github, Linkedin } from "lucide-react"

export function Footer() {
    return (
        <footer className="py-20 bg-zinc-950 border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <Brain className="size-6 text-white" />
                            <span className="text-xl font-bold tracking-tight uppercase">P.A.I.D.S</span>
                        </div>
                        <p className="text-sm text-zinc-400 font-normal leading-relaxed">
                            Enterprise intelligence infrastructure for the modern age. Scale your AI capabilities while maintaining total sovereignty.
                        </p>
                    </div>

                    {[
                        {
                            title: "Product",
                            links: ["Features", "Security", "Roadmap", "Pricing"]
                        },
                        {
                            title: "Company",
                            links: ["About", "Blog", "Careers", "Contact"]
                        },
                        {
                            title: "Legal",
                            links: ["Privacy", "Terms", "Cookie Policy", "SLA"]
                        }
                    ].map((group, i) => (
                        <div key={i}>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white mb-6">
                                {group.title}
                            </h4>
                            <ul className="space-y-4">
                                {group.links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-12 gap-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        © 2026 P.A.I.D.S ARCHITECTURE. ALL RIGHTS RESERVED.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-zinc-400 hover:text-white transition-colors"><Twitter className="size-4" /></a>
                        <a href="#" className="text-zinc-400 hover:text-white transition-colors"><Github className="size-4" /></a>
                        <a href="#" className="text-zinc-400 hover:text-white transition-colors"><Linkedin className="size-4" /></a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
