import React from "react"
import { motion } from "framer-motion"
import {
    FileText,
    Terminal,
    Calculator,
    ShieldCheck,
    Layout
} from "lucide-react"

const PIPELINE_FEATURES = [
    {
        title: "OCR & Document Intelligence",
        desc: "Convert messy PDFs, handwritten site notes, and technical schematics into searchable data. Our Tesseract.js engine enables full-text search across 5 years of historical files.",
        icon: Layout,
        auditDetail: "Tesseract.js OCR + 512–2048 Intelligent Chunking"
    },
    {
        title: "Universal Web & YouTube Crawler",
        desc: "Automate competitive research. Crawl entire domain sitemaps for pricing data or transcribe 1-hour YouTube venue walkthroughs in seconds to extract installation details.",
        icon: Terminal,
        auditDetail: "Cheerio Scraper + YouTube Transcript API + Metadata Extraction"
    },
    {
        title: "Auto-Math Estimator Engine",
        desc: "Conversational CPQ that actually does math. Adjust margins, calculate LED pixel density, and apply tax logic automatically without touching a spreadsheet.",
        icon: Calculator,
        auditDetail: "Financial Logic Node + Real-time Margin Control + Currency Support"
    },
    {
        title: "Branded PDF Architect",
        desc: "Generate production-ready proposals in 5 minutes. Full CSS-print control allows for custom headers, footers, and legal disclaimers directly from the chat interface.",
        icon: FileText,
        auditDetail: "WeasyPrint Engine + Playwright Render + Blob Storage"
    }
]

export function IntelligentPipeline() {
    return (
        <section id="editor" className="py-32 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-3xl mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-6"
                    >
                        P.A.I.D.S <br />
                        <span className="text-zinc-500 uppercase">Architecture.</span>
                    </motion.h2>
                    <p className="text-lg text-zinc-300 font-normal leading-relaxed">
                        The <strong className="text-white font-semibold">Proposals And Invoices Deployment System</strong> is not just a tool. It's an entire logic ecosystem designed to get you paid.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5">
                    {PIPELINE_FEATURES.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-10 bg-zinc-950 hover:bg-zinc-900/50 transition-colors relative group"
                        >
                            <div className="size-12 rounded bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                                <feature.icon className="size-6" />
                            </div>

                            <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{feature.title}</h3>
                            <p className="text-sm text-zinc-300 font-normal leading-relaxed mb-10">
                                {feature.desc}
                            </p>

                            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/10">
                                <ShieldCheck className="size-4 text-cyan-400 shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 leading-tight">
                                    Audit Verified: {feature.auditDetail}
                                </span>
                            </div>

                            <div className="absolute top-4 right-4 text-zinc-800 text-xs font-black uppercase tracking-widest group-hover:text-white/20 transition-colors">
                                Module_0{i + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />
        </section>
    )
}
