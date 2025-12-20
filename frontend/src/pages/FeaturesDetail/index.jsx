import React, { useState } from "react";
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
  CaretRight,
  ChartBar,
  CloudArrowUp,
  Fingerprint,
} from "@phosphor-icons/react";

const FEATURES = [
  {
    id: "intelligence",
    icon: Lightning,
    title: "Document Intelligence",
    subtitle: "Beyond simple OCR",
    description: "OwnLLM doesn't just read text; it understands structure, intent, and context within your business documents.",
    content: (
      <div className="space-y-6">
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-button/20 to-purple-600/20 border border-primary-button/30 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 flex flex-col p-8 space-y-4">
              <div className="h-4 w-1/3 bg-primary-button/40 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-white/10 rounded" />
              <div className="h-4 w-1/2 bg-white/10 rounded" />
              <div className="mt-auto h-32 w-full bg-theme-bg-primary/50 rounded-xl border border-white/10 p-4">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] uppercase tracking-widest opacity-50">Analysis Complete</span>
                 </div>
                 <div className="text-sm font-mono text-primary-button">
                    > Extracted 14 line items<br/>
                    > Identified $4,200 in recurring value<br/>
                    > Risk factor: Low
                 </div>
              </div>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-sidebar-border">
            <h4 className="font-bold mb-2 flex items-center gap-2"><CheckCircle className="text-primary-button" /> Semantic Search</h4>
            <p className="text-xs text-theme-text-secondary">Find any clause or term across thousands of documents instantly.</p>
          </div>
          <div className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-sidebar-border">
            <h4 className="font-bold mb-2 flex items-center gap-2"><CheckCircle className="text-primary-button" /> Data Extraction</h4>
            <p className="text-xs text-theme-text-secondary">Automatically pull tables, dates, and amounts into structured formats.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Sovereign Privacy",
    subtitle: "Your data, your rules",
    description: "Built for industries where data leaks aren't an option. OwnLLM runs entirely within your perimeter.",
    content: (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-theme-bg-secondary border border-theme-sidebar-border relative">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border">
                  <HardDrive size={32} className="text-primary-button" />
               </div>
               <div>
                  <div className="font-bold">Private Node</div>
                  <div className="text-xs text-green-500 flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Encrypted & Active
                  </div>
               </div>
            </div>
            <div className="h-px flex-1 mx-8 bg-gradient-to-r from-primary-button/50 to-transparent" />
            <div className="opacity-20 grayscale">
               <Fingerprint size={48} />
            </div>
          </div>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm">
               <div className="w-5 h-5 rounded-md bg-primary-button/10 flex items-center justify-center text-primary-button">
                  <CheckCircle size={14} weight="bold" />
               </div>
               No training on customer data. Ever.
            </li>
            <li className="flex items-center gap-3 text-sm">
               <div className="w-5 h-5 rounded-md bg-primary-button/10 flex items-center justify-center text-primary-button">
                  <CheckCircle size={14} weight="bold" />
               </div>
               SOC2 & GDPR compliance ready architecture.
            </li>
            <li className="flex items-center gap-3 text-sm">
               <div className="w-5 h-5 rounded-md bg-primary-button/10 flex items-center justify-center text-primary-button">
                  <CheckCircle size={14} weight="bold" />
               </div>
               Air-gapped deployment support.
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: "automation",
    icon: Buildings,
    title: "Enterprise Scale",
    subtitle: "Multi-tenant by design",
    description: "Scale from a single team to an entire organization with deep white-labeling and workspace isolation.",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
           <div className="p-6 rounded-2xl bg-theme-bg-secondary border border-theme-sidebar-border group hover:border-primary-button/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <Users size={24} className="text-primary-button" />
                    <span className="font-bold">Workspace Isolation</span>
                 </div>
                 <span className="px-2 py-0.5 rounded bg-primary-button/10 text-primary-button text-[10px] font-bold uppercase">Active</span>
              </div>
              <p className="text-sm text-theme-text-secondary leading-relaxed">
                 Keep client data strictly separated with dedicated vector databases and encryption keys for every workspace.
              </p>
           </div>
           <div className="p-6 rounded-2xl bg-theme-bg-secondary border border-theme-sidebar-border group hover:border-primary-button/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <Briefcase size={24} className="text-primary-button" />
                    <span className="font-bold">Custom Branding</span>
                 </div>
                 <span className="px-2 py-0.5 rounded bg-primary-button/10 text-primary-button text-[10px] font-bold uppercase">Pro</span>
              </div>
              <p className="text-sm text-theme-text-secondary leading-relaxed">
                 Inject your brand into every touchpoint—from the dashboard colors to the final exported PDF proposal.
              </p>
           </div>
        </div>
      </div>
    )
  }
];

export default function FeaturesDetail() {
  const [activeTab, setActiveTab] = useState(FEATURES[0].id);
  const currentFeature = FEATURES.find(f => f.id === activeTab);

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-sans selection:bg-primary-button/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-theme-bg-primary/80 backdrop-blur-xl border-b border-theme-sidebar-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/landing-gemini" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-button to-purple-600 flex items-center justify-center shadow-lg shadow-primary-button/20">
              <FileText size={24} weight="bold" className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">OwnLLM</span>
          </Link>
          
          <Link to={paths.login()} className="px-6 py-2.5 rounded-xl bg-primary-button text-black text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary-button/20">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Powerful by default.<br/><span className="text-theme-text-secondary">Tailored by you.</span></h1>
            <p className="text-xl text-theme-text-secondary max-w-2xl">Explore the core engine that powers OwnLLM. Built for performance, designed for privacy.</p>
          </div>

          <div className="grid lg:grid-cols-[380px_1fr] gap-12 items-start">
            {/* Tab Selectors */}
            <div className="space-y-4">
              {FEATURES.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group ${
                    activeTab === feature.id 
                      ? "bg-theme-bg-secondary border-primary-button shadow-xl shadow-primary-button/5 scale-[1.02]" 
                      : "bg-transparent border-theme-sidebar-border hover:border-theme-text-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${
                      activeTab === feature.id ? "bg-primary-button text-black" : "bg-theme-bg-secondary text-primary-button group-hover:bg-primary-button/10"
                    }`}>
                      <feature.icon size={24} weight={activeTab === feature.id ? "fill" : "duotone"} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{feature.title}</h3>
                      <p className="text-xs text-theme-text-secondary uppercase tracking-widest mt-0.5">{feature.subtitle}</p>
                    </div>
                    <CaretRight 
                      size={20} 
                      className={`ml-auto transition-transform duration-300 ${activeTab === feature.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`} 
                    />
                  </div>
                </button>
              ))}

              <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-primary-button/10 to-purple-600/10 border border-primary-button/20">
                <h4 className="font-bold mb-4">Need a custom feature?</h4>
                <p className="text-sm text-theme-text-secondary mb-6 leading-relaxed">Our enterprise team can build custom modules tailored to your specific industry needs.</p>
                <Link to={paths.mailToMintplex()} className="text-sm font-bold text-primary-button flex items-center gap-2 hover:underline">
                  Contact Sales <ArrowRight />
                </Link>
              </div>
            </div>

            {/* Content Display */}
            <div className="min-h-[600px] rounded-[2.5rem] bg-theme-bg-secondary/50 border border-theme-sidebar-border p-8 md:p-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-button/5 rounded-full blur-3xl -z-10" />
               
               <div key={activeTab} className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="max-w-2xl">
                    <h2 className="text-3xl font-black mb-4">{currentFeature.title}</h2>
                    <p className="text-lg text-theme-text-secondary mb-12 leading-relaxed">
                      {currentFeature.description}
                    </p>
                    
                    {currentFeature.content}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-theme-sidebar-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-theme-text-secondary text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-theme-text-primary">OwnLLM</span>
            <span>&copy; 2025. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
