import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { calculateProjectQuote, TIERS } from "@/lib/pricingMath"
import { Check, Shield, Cpu, Activity, Zap } from "lucide-react"

export default function DynamicQuoteSlider() {
    const [scale, setScale] = useState(5)
    const [tier, setTier] = useState("ESTIMATOR")
    const [displayPrice, setDisplayPrice] = useState(0)

    const quote = useMemo(() => calculateProjectQuote(scale, tier), [scale, tier])

    // Number ticker effect for price
    useEffect(() => {
        const start = displayPrice
        const end = quote.buildFee
        const duration = 500
        const startTime = performance.now()

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const current = Math.floor(start + (end - start) * progress)
            setDisplayPrice(current)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [quote.buildFee])

    const getScaleLabel = (val) => {
        if (val <= 3) return { label: "Agile Experiment", color: "text-blue-400", icon: Zap }
        if (val <= 6) return { label: "Business Production", color: "text-emerald-400", icon: Activity }
        if (val <= 8) return { label: "Enterprise Sovereign", color: "text-purple-400", icon: Shield }
        return { label: "Absolute Domain", color: "text-red-500", icon: Cpu }
    }

    const { label: scaleLabel, color: scaleColor, icon: ScaleIcon } = getScaleLabel(scale)

    return (
        <div className="bg-zinc-950 border border-white/5 rounded-2xl p-8 md:p-12 overflow-hidden relative group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-white/10 transition-colors duration-700" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">Precision Scaling</h3>
                        <p className="text-zinc-400 text-sm">Slide to adjust the scope of your Sovereign Infrastructure.</p>
                    </div>

                    {/* Tier Selection */}
                    <div className="flex p-1 bg-white/5 rounded-lg w-fit">
                        {Object.keys(TIERS).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTier(t)}
                                className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${tier === t
                                        ? "bg-white text-black shadow-lg"
                                        : "text-zinc-400 hover:text-white"
                                    }`}
                            >
                                {TIERS[t].label.split(" ")[0]}
                            </button>
                        ))}
                    </div>

                    {/* Range Slider */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                                <ScaleIcon className={`size-4 ${scaleColor}`} />
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${scaleColor}`}>
                                    {scaleLabel}
                                </span>
                            </div>
                            <span className="text-2xl font-bold text-white tabular-nums">Level {scale}</span>
                        </div>

                        <div className="relative h-12 flex items-center">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={scale}
                                onChange={(e) => setScale(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                            />
                            {/* Track Fill */}
                            <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-white transition-all duration-300 pointer-events-none"
                                style={{ width: `${(scale - 1) * 11.11}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
                        <div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-tighter mb-1">Hardware</div>
                            <div className="text-sm font-bold text-white">${quote.breakdown.hardware.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-tighter mb-1">Intelligence</div>
                            <div className="text-sm font-bold text-white">${quote.breakdown.intelligence.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-tighter mb-1">Support</div>
                            <div className="text-sm font-bold text-white">${quote.breakdown.support.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mb-4">Estimated Build Fee</span>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-6xl md:text-7xl font-black text-black tracking-tighter tabular-nums text-shadow-glow">
                                ${displayPrice.toLocaleString()}
                            </span>
                        </div>
                        <div className="text-xs font-bold text-black/60 uppercase tracking-widest mb-10">
                            + ${quote.monthlyRetainer}/mo Infrastructure
                        </div>

                        <ul className="w-full space-y-3 mb-10">
                            {[
                                "Custom CPQ Deployment",
                                "Sovereign Knowledge Layer",
                                "Managed Runtime Environment",
                                "Priority Security Updates"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-black uppercase tracking-wide">
                                    <Check className="size-3 shrink-0 text-black" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>

                        <button className="w-full py-4 bg-black text-white rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-zinc-800 transition-colors group/btn">
                            Lock In This Rate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
