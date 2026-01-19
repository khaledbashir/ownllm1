import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  DollarSign,
  Zap,
  Shield,
  Users,
  ChevronRight,
  CheckCircle,
  BarChart3,
  Clock,
  Globe,
  Lock,
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-black font-sans text-white overflow-x-hidden">
      <Nav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <Hero />
      <ValueProp />
      <Features />
      <Timeline />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}

function Nav({ mobileMenuOpen, setMobileMenuOpen }) {
  const navItems = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#timeline" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold">P.A.I.D.S</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-white text-black hover:bg-zinc-200 font-semibold">
                Get Started
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-6 border-t border-white/10"
          >
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block py-3 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="mt-6 space-y-3">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-white hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-white text-black hover:bg-zinc-200 font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Enterprise AI Platform v1.9.1
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-8 tracking-tight"
          >
            Proposals And
            <br />
            <span className="text-zinc-500">Invoices Deployment</span>
            <br />
            <span className="text-zinc-500">System</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed"
          >
            Your Brand, Your Logo, and Unlimited Workspaces. Aggregate 25+ AI
            models into one secure, deterministic hub for intelligent document
            processing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/register">
              <Button
                size="lg"
                className="h-14 px-8 bg-white text-black hover:bg-zinc-200 font-semibold group"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 border-white/20 bg-white/5 hover:bg-white/10 font-semibold"
              >
                View Demo
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12"
          >
            {[
              { label: "AI Models", value: "25+", icon: Zap },
              { label: "Workspaces", value: "Unlimited", icon: FileText },
              { label: "Capacity", value: "Unlimited", icon: Users },
              { label: "Data Safety", value: "100% Sovereign", icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-zinc-500">
                  <stat.icon className="w-3 h-3" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ValueProp() {
  return (
    <section className="py-32 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Transform Your Business Workflow
            </h2>
            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Stop wasting time on manual document processing. Let AI handle the
              heavy lifting while you focus on what matters most—growing your
              business.
            </p>
            <div className="space-y-4">
              {[
                "Generate professional proposals in minutes",
                "Automated invoice tracking and management",
                "AI-powered document intelligence",
                "Multi-tenant architecture for teams",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square bg-zinc-900 border border-white/10 rounded-2xl p-8">
              <div className="h-full flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="aspect-video bg-white/5 rounded-lg" />
                  <div className="aspect-video bg-white/5 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-zinc-800 border border-white/10 rounded-lg" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-zinc-800 border border-white/10 rounded-lg" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Smart Proposals",
      description: "AI-powered proposal generation with your branding and pricing",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Invoice Management",
      description: "Automated invoicing with real-time tracking and reporting",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI Integration",
      description: "Connect 25+ AI models including GPT-4, Claude, and Gemini",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Data Sovereignty",
      description: "Your data stays private with self-hosted deployment options",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Unlimited workspaces with role-based access control",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Track performance with comprehensive business metrics",
    },
  ];

  return (
    <section id="features" className="py-32 px-6 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Powerful Features
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Everything you need to streamline your business operations
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-6 bg-black border border-white/10 hover:border-white/20 rounded-xl transition-all"
            >
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Timeline() {
  const steps = [
    {
      step: "01",
      title: "Setup Your Workspace",
      description: "Configure your branding, products, and rate cards",
      icon: <Globe className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "Upload Documents",
      description: "Import your business documents and knowledge base",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Generate with AI",
      description: "Create proposals and documents using AI assistance",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      step: "04",
      title: "Export & Share",
      description: "Export professional PDFs and track client engagement",
      icon: <DollarSign className="w-5 h-5" />,
    },
  ];

  return (
    <section id="timeline" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            How It Works
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Get started in minutes with our streamlined workflow
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden md:block" />
          
          <div className="space-y-16">
            {steps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex items-center ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className="hidden md:block w-1/2 pr-12" />
                
                <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-black border-2 border-white/10 rounded-full flex items-center justify-center z-10">
                  <span className="text-sm font-bold">{item.step}</span>
                </div>

                <div className="w-full md:w-1/2 pl-12 md:pl-0 md:pr-12">
                  <div className="p-6 bg-zinc-900 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                  </div>
                </div>

                <div className="hidden md:block w-1/2 pl-12" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      quote: "P.A.I.D.S has transformed how we handle proposals. What used to take hours now takes minutes.",
      author: "Sarah Johnson",
      role: "CEO, Tech Solutions Inc.",
    },
    {
      quote: "The AI integration is seamless. We've increased our proposal acceptance rate by 40%.",
      author: "Michael Chen",
      role: "Director, Creative Agency",
    },
    {
      quote: "Finally, a platform that understands enterprise needs. The multi-tenant setup is perfect.",
      author: "Emily Rodriguez",
      role: "VP Operations, Enterprise Corp",
    },
  ];

  return (
    <section className="py-32 px-6 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Trusted by Teams
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            See what our customers are saying
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-black border border-white/10 rounded-xl"
            >
              <p className="text-zinc-300 mb-6 leading-relaxed">{item.quote}</p>
              <div>
                <p className="font-semibold text-sm">{item.author}</p>
                <p className="text-xs text-zinc-500">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      features: [
        "5 Team Members",
        "10 Workspaces",
        "Basic AI Models",
        "Email Support",
      ],
      cta: "Get Started",
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      features: [
        "25 Team Members",
        "Unlimited Workspaces",
        "Premium AI Models",
        "Priority Support",
        "Custom Branding",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: [
        "Unlimited Team Members",
        "Unlimited Workspaces",
        "All AI Models",
        "Dedicated Support",
        "Custom Integrations",
        "SLA Guarantee",
      ],
      cta: "Contact Sales",
    },
  ];

  return (
    <section id="pricing" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Simple Pricing
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-xl border ${plan.popular ? "border-white bg-white/5" : "border-white/10 bg-black"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-zinc-500 text-sm">{plan.period}</span>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${plan.popular ? "bg-white text-black hover:bg-zinc-200" : "bg-white/5 hover:bg-white/10"}`}
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 px-6 bg-zinc-950/50">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
        >
          Ready to Transform Your Business?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto"
        >
          Join thousands of teams already using P.A.I.D.S to streamline their
          operations
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register">
            <Button
              size="lg"
              className="h-14 px-8 bg-white text-black hover:bg-zinc-200 font-semibold group"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 border-white/20 bg-white/5 hover:bg-white/10 font-semibold"
            >
              Talk to Sales
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const links = [
    { name: "Product", items: ["Features", "Pricing", "Integrations"] },
    { name: "Resources", items: ["Documentation", "API", "Blog"] },
    { name: "Company", items: ["About", "Careers", "Contact"] },
    { name: "Legal", items: ["Privacy", "Terms", "Security"] },
  ];

  return (
    <footer className="py-16 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold">P.A.I.D.S</span>
            </div>
            <p className="text-sm text-zinc-500">
              Proposals And Invoices Deployment System
            </p>
          </div>
          {links.map((section) => (
            <div key={section.name}>
              <h4 className="font-semibold mb-4 text-sm">{section.name}</h4>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © 2026 P.A.I.D.S. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-zinc-500 hover:text-zinc-300">
              <Globe className="w-5 h-5" />
            </a>
            <a href="#" className="text-zinc-500 hover:text-zinc-300">
              <Users className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
