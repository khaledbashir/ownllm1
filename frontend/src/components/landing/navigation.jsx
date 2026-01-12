import React from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Brain, Menu, X, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"

export function Navigation() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                isScrolled
                    ? "bg-background/80 backdrop-blur-md border-white/10 py-4"
                    : "bg-transparent border-transparent py-6"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Brain className="size-6 text-white" />
                    </div>
                    <div className="flex flex-col -gap-1">
                        <span className="text-xl font-bold tracking-tight uppercase">P.A.I.D.S</span>
                        <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-zinc-500">Systems Architecture</span>
                    </div>
                </Link>

                <nav className="hidden lg:flex items-center gap-10">
                    {[
                        { name: "The Platform", href: "/#vprop" },
                        { name: "AI Editor", href: "/#editor" },
                        { name: "Agents", href: "/#agents" },
                        { name: "Pricing", href: "/pricing" },
                    ].map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
                        >
                            {item.name}
                        </a>
                    ))}
                </nav>

                <div className="hidden lg:flex items-center gap-4">
                    <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100">
                        Sign In
                    </Button>
                    <Button className="h-11 px-6 rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-[10px]">
                        Deploy Now <ArrowRight className="ml-2 size-3" />
                    </Button>
                </div>

                <button
                    className="lg:hidden text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 bg-zinc-950 border-b border-white/10 p-6 flex flex-col gap-6 lg:hidden"
                >
                    {[
                        { name: "The Platform", href: "/#vprop" },
                        { name: "AI Editor", href: "/#editor" },
                        { name: "Agents", href: "/#agents" },
                        { name: "Pricing", href: "/pricing" },
                    ].map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className="text-sm font-bold uppercase tracking-widest text-muted-foreground"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {item.name}
                        </a>
                    ))}
                    <Button className="w-full bg-white text-black font-black uppercase tracking-widest text-xs h-12">
                        Get Started
                    </Button>
                </motion.div>
            )}
        </motion.header>
    )
}
