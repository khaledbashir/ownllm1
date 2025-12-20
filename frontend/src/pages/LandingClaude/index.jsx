import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import paths from "@/utils/paths";
import {
  ArrowRight,
  Lightning,
  Brain,
  Rocket,
  Star,
  Play,
  Check,
  Sparkle,
} from "@phosphor-icons/react";

/**
 * LandingClaude - A premium, creative landing page design
 * Features: Animated gradients, glassmorphism, micro-interactions
 */
export default function LandingClaude() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  // Track mouse for gradient effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Brain size={28} weight="duotone" />,
      title: "Context-Aware Intelligence",
      description:
        "Your AI understands your business, remembers context, and learns from every interaction.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: <Lightning size={28} weight="duotone" />,
      title: "Instant Document Generation",
      description:
        "From proposals to contracts—professionally formatted documents in seconds, not hours.",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: <Rocket size={28} weight="duotone" />,
      title: "Workflow Automation",
      description:
        "Build complex automations with a visual interface. Connect APIs, trigger actions, scale infinitely.",
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  const stats = [
    { value: "10x", label: "Faster Proposals" },
    { value: "99%", label: "Accuracy Rate" },
    { value: "500+", label: "Integrations" },
    { value: "24/7", label: "AI Available" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[120px] transition-all duration-1000"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
            left: `${mousePos.x - 20}%`,
            top: `${mousePos.y - 20}%`,
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-10 blur-[100px] bg-gradient-to-br from-cyan-500 to-blue-600 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px] bg-gradient-to-br from-pink-500 to-rose-600" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-theme-bg-secondary border border-theme-sidebar-border flex items-center justify-center shadow-lg shadow-primary-button/10">
            <span className="font-bold text-primary-button text-xl">P</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              P.A.I.D.
            </span>
            <span className="text-emerald-400 font-black"> Platform</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/features"
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            Features
          </Link>
          <a
            href="#pricing"
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            Pricing
          </a>
          <a
            href="https://docs.anythingllm.com"
            target="_blank"
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            Documentation
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to={paths.login()}
            className="text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link
            to={paths.login()}
            className="px-5 py-2.5 rounded-full bg-primary-button text-black text-sm font-bold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary-button/20"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32"
      >
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 group hover:border-emerald-500/50 transition-colors cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-white/70">
              New: P.A.I.D. Advanced Template Studio
            </span>
            <ArrowRight
              size={14}
              className="text-white/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
            />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              Your Business,
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-primary-button to-emerald-600">
              Supercharged by P.A.I.D.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            The intelligent operations platform that transforms how you create
            proposals, manage documents, and automate workflows. Built for teams
            that move fast.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to={paths.login()}
              className="group flex items-center gap-3 px-8 py-4 rounded-full bg-primary-button text-black font-bold text-lg hover:shadow-xl hover:shadow-primary-button/30 transition-all hover:scale-105"
            >
              Start Free Trial
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <button className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all">
              <Play size={20} weight="fill" className="text-emerald-400" />
              Watch Demo
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/30 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 border-2 border-[#0a0a0f]"
                  />
                ))}
              </div>
              <span>5,000+ teams</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  weight="fill"
                  className="text-amber-400"
                />
              ))}
              <span className="ml-2">4.9/5 Rating</span>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative mt-20 mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            {/* Mock Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-full bg-white/5 text-xs text-white/40">
                  app.paid.ai
                </div>
              </div>
            </div>
            {/* Mock App Content */}
            <div className="bg-gradient-to-br from-[#12121a] to-[#0a0a0f] p-8 aspect-video flex flex-col">
              <div className="flex gap-6 flex-1">
                {/* Sidebar */}
                <div className="w-48 bg-white/5 rounded-xl p-4 space-y-3">
                  {["Dashboard", "Proposals", "Documents", "Workflows"].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`px-3 py-2 rounded-lg text-sm ${i === 1 ? "bg-violet-500/20 text-violet-300" : "text-white/40"}`}
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
                {/* Main Content */}
                <div className="flex-1 bg-white/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-lg font-semibold text-white/80">
                      Recent Proposals
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-sm">
                      + New
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Enterprise SaaS Partnership",
                      "Q4 Marketing Campaign",
                      "Product Launch Strategy",
                    ].map((name, i) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div>
                          <div className="text-white/70 text-sm">{name}</div>
                          <div className="text-white/30 text-xs mt-1">
                            Updated 2h ago
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs ${i === 0 ? "bg-green-500/20 text-green-300" : i === 1 ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"}`}
                        >
                          {i === 0 ? "Sent" : i === 1 ? "Draft" : "Review"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                  {stat.value}
                </div>
                <div className="text-white/40 mt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Everything you need to
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                scale your operations
              </span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              A unified platform that brings AI-powered automation to every
              aspect of your business operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-violet-500/30 transition-all hover:bg-white/[0.05]"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/40 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-3xl p-12 text-center overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your workflow?
            </h2>
            <p className="text-white/50 mb-8 max-w-xl mx-auto">
              Join thousands of teams already using NexusAI to automate their
              operations and close deals faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all hover:scale-105 shadow-lg shadow-white/20">
                Start Your Free Trial
              </button>
              <button className="px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-all">
                Schedule a Demo
              </button>
            </div>
            <p className="text-white/30 text-sm mt-6">
              <Check size={16} className="inline mr-1" /> No credit card
              required
              <span className="mx-3">•</span>
              <Check size={16} className="inline mr-1" /> 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-theme-bg-secondary border border-theme-sidebar-border flex items-center justify-center">
                <span className="font-bold text-primary-button">P</span>
              </div>
              <span className="text-white/60 text-sm">
                © 2025 P.A.I.D. Platform. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-white/40 text-sm">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
