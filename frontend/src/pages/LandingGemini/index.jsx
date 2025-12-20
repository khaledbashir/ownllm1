import React from "react";
import { Link } from "react-router-dom";
import paths from "@/utils/paths";
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  Lightning,
  Browser,
  Buildings,
  HardDrive,
  Users,
  Briefcase,
  CheckCircle,
} from "@phosphor-icons/react";

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="p-8 rounded-2xl bg-theme-bg-secondary border border-theme-sidebar-border hover:border-primary-button/50 transition-all group">
    <div className="w-12 h-12 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon size={24} weight="duotone" className="text-primary-button" />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-theme-text-secondary leading-relaxed">
      {description}
    </p>
  </div>
);

const Step = ({ number, title, description }) => (
  <div className="flex gap-6">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-button/10 border border-primary-button/20 flex items-center justify-center text-primary-button font-bold">
      {number}
    </div>
    <div>
      <h4 className="text-lg font-bold mb-1">{title}</h4>
      <p className="text-theme-text-secondary">{description}</p>
    </div>
  </div>
);

export default function LandingGemini() {
  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-sans selection:bg-primary-button/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-theme-bg-primary/80 backdrop-blur-xl border-b border-theme-sidebar-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-button to-purple-600 flex items-center justify-center shadow-lg shadow-primary-button/20">
              <FileText size={24} weight="bold" className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">OwnLLM</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-theme-text-secondary">
            <a href="#features" className="hover:text-theme-text-primary transition-colors">Features</a>
            <a href="#workflow" className="hover:text-theme-text-primary transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-theme-text-primary transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to={paths.login()} className="px-6 py-2.5 rounded-xl bg-theme-bg-secondary border border-theme-sidebar-border text-sm font-bold hover:bg-theme-sidebar-item-hover transition-colors">
              Log In
            </Link>
            <Link to={paths.login()} className="px-6 py-2.5 rounded-xl bg-primary-button text-black text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary-button/20">
              Start Building
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-button/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-bg-secondary border border-theme-sidebar-border text-[11px] font-bold uppercase tracking-widest text-primary-button mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-button opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-button"></span>
              </span>
              Next-Gen Document Intelligence
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8 tracking-tight">
              Don't just chat.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-button to-purple-400">Ship the document.</span>
            </h1>
            
            <p className="text-xl text-theme-text-secondary leading-relaxed mb-10 max-w-2xl">
              OwnLLM turns your raw conversations and data into professional, 
              ready-to-send proposals, contracts, and quotes. Fully private. Fully branded. Fully automated.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={paths.login()} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary-button text-black font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl shadow-primary-button/20">
                Get Started Free <ArrowRight weight="bold" />
              </Link>
              <a href="#workflow" className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-theme-bg-secondary border border-theme-sidebar-border font-bold text-lg hover:bg-theme-sidebar-item-hover transition-colors">
                See How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 border-y border-theme-sidebar-border bg-theme-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-between items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold text-xl"><HardDrive size={24} /> Self-Hosted</div>
            <div className="flex items-center gap-2 font-bold text-xl"><ShieldCheck size={24} /> Privacy First</div>
            <div className="flex items-center gap-2 font-bold text-xl"><Buildings size={24} /> White-Label</div>
            <div className="flex items-center gap-2 font-bold text-xl"><Users size={24} /> Multi-Tenant</div>
          </div>
        </div>
      </section>

      {/* Core Workflow */}
      <section id="workflow" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-theme-bg-secondary to-theme-bg-primary border border-theme-sidebar-border p-1">
                <div className="h-full w-full rounded-[1.4rem] bg-theme-bg-primary overflow-hidden flex flex-col p-6">
                  {/* Mock UI */}
                  <div className="flex gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 bg-theme-bg-secondary rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-theme-bg-secondary rounded animate-pulse delay-75" />
                    <div className="h-20 w-full bg-primary-button/5 border border-primary-button/10 rounded-xl flex items-center justify-center italic text-primary-button/50 text-sm">
                      Generating professional proposal...
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-theme-bg-secondary rounded" />
                      <div className="h-3 w-full bg-theme-bg-secondary rounded" />
                      <div className="h-3 w-2/3 bg-theme-bg-secondary rounded" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl -z-10" />
            </div>

            <div>
              <h2 className="text-4xl font-black mb-12">The Path to Done.</h2>
              <div className="space-y-12">
                <Step 
                  number="1"
                  title="Ingest Your Context"
                  description="Upload PDFs, docs, or sync with your CRM. OwnLLM understands your business data deeply and privately."
                />
                <Step 
                  number="2"
                  title="Intelligent Collaboration"
                  description="Chat with your documents to refine the scope, define rates, and structure the narrative."
                />
                <Step 
                  number="3"
                  title="Export Branded Assets"
                  description="One click to generate a professional, branded PDF proposal or contract ready for your client's inbox."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-theme-bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-black mb-4">Everything you need to scale.</h2>
            <p className="text-theme-text-secondary">Stop cobbling together AI tools. OwnLLM is a complete operating system for document-heavy businesses.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Browser}
              title="Template Builder"
              description="Create reusable AI-powered templates for any document type. Standardize your output across the entire team."
            />
            <FeatureCard 
              icon={Lightning}
              title="Artifact Library"
              description="Keep a persistent history of every generated proposal and contract. Never lose a draft or a version again."
            />
            <FeatureCard 
              icon={Buildings}
              title="White-Label Ready"
              description="Your logo, your colors, your domain. To your clients, it looks like a proprietary tool you built yourself."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="True Privacy"
              description="Run on your own infrastructure. Your sensitive business data never leaves your control."
            />
            <FeatureCard 
              icon={Users}
              title="Multi-Workspace"
              description="Organize clients or departments into isolated workspaces with granular permission controls."
            />
            <FeatureCard 
              icon={Briefcase}
              title="CRM Integration"
              description="Connect directly to your existing sales pipeline to pull products, rates, and lead information automatically."
            />
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-[3rem] bg-gradient-to-br from-theme-bg-secondary to-theme-bg-primary border border-theme-sidebar-border p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-button/10 rounded-full blur-[100px] -z-10" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-black mb-6">Built for growth.</h2>
                <p className="text-xl text-theme-text-secondary mb-8">
                  Start for free, then upgrade as your team scales. No hidden fees, no per-document tax.
                </p>
                <div className="space-y-4">
                  {[
                    "Unlimited Document Generation",
                    "Custom Brand Themes",
                    "API Access & Webhooks",
                    "Dedicated Support",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-lg font-medium">
                      <CheckCircle weight="fill" className="text-primary-button" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-theme-bg-primary rounded-3xl p-8 border border-theme-sidebar-border shadow-2xl">
                <div className="mb-8">
                  <span className="text-theme-text-secondary font-bold uppercase tracking-widest text-xs">The Professional Tier</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-5xl font-black">$29</span>
                    <span className="text-theme-text-secondary font-medium">/month</span>
                  </div>
                </div>
                
                <Link to={paths.login()} className="block w-full text-center py-4 rounded-2xl bg-primary-button text-black font-bold text-lg hover:scale-[1.02] transition-transform mb-6">
                  Get Started with Pro
                </Link>
                
                <p className="text-center text-sm text-theme-text-secondary">
                  Join 500+ businesses shipping better documents today.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl font-black mb-8">Stop chatting. Start shipping.</h2>
          <Link to={paths.login()} className="inline-flex items-center gap-3 px-12 py-6 rounded-2xl bg-primary-button text-black font-black text-2xl hover:scale-105 transition-transform shadow-2xl shadow-primary-button/30">
            Deploy OwnLLM Now <ArrowRight weight="bold" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-theme-sidebar-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-theme-text-secondary text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-theme-text-primary">OwnLLM</span>
            <span>&copy; 2025. All rights reserved.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-theme-text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-theme-text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-theme-text-primary transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
