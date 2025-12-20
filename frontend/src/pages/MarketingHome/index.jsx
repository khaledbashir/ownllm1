import React from "react";
import { Link } from "react-router-dom";
import paths from "@/utils/paths";
import {
  ArrowRight,
  CheckCircle,
  Cloud,
  Database,
  FileText,
  Lock,
  Plug,
  Rocket,
  ShieldCheck,
  Workflow,
  Wrench,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Workflow", href: "#workflow" },
  { label: "Core AI", href: "#ai" },
  { label: "Agents", href: "#agents" },
  { label: "Security", href: "#security" },
  { label: "Developer", href: "#developer" },
];

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-sans overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-theme-bg-primary/70 backdrop-blur-md border-b border-theme-sidebar-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            to={paths.marketing()}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-lg bg-theme-bg-secondary border border-theme-sidebar-border flex items-center justify-center">
              <span className="font-semibold">P</span>
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">PAID Platform</div>
              <div className="text-xs text-theme-text-secondary">
                Proposals And Invoices Delivered
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm text-theme-text-secondary">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hover:text-theme-text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              to={paths.login()}
              className="text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              to={paths.login()}
              className="px-4 py-2 rounded-lg bg-primary-button text-theme-bg-primary text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-36 pb-16 md:pt-44 md:pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-theme-sidebar-border bg-theme-bg-secondary">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-primary-button/10 blur-[90px]" />
              <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-purple-500/10 blur-[90px]" />
            </div>

            <div className="relative p-8 md:p-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-bg-primary border border-theme-sidebar-border text-xs text-theme-text-secondary">
                <span className="w-2 h-2 rounded-full bg-primary-button animate-pulse" />
                Paid platform features (white-label + enterprise)
              </div>

              <div className="mt-6 grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                    Turn scope into{" "}
                    <span className="text-primary-button">proposals</span>.
                    <br />
                    Turn work into{" "}
                    <span className="text-primary-button">invoices</span>.
                  </h1>
                  <p className="mt-6 text-lg text-theme-text-secondary leading-relaxed max-w-xl">
                    The PAID Platform combines a collaborative creation studio,
                    high-fidelity PDF export, model-agnostic AI, and workflow
                    automation to ship Proposals And Invoices Delivered.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link
                      to={paths.login()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-button text-theme-bg-primary font-bold"
                    >
                      <Rocket size={18} />
                      Launch Workspace
                    </Link>
                    <a
                      href="#workflow"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-theme-sidebar-border bg-theme-bg-primary text-theme-text-primary hover:bg-theme-bg-container transition-colors"
                    >
                      Explore features
                      <ArrowRight size={16} />
                    </a>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
                    <HeroStat label="Creation Studio" value="BlockSuite" />
                    <HeroStat label="PDF Export" value="Playwright" />
                    <HeroStat label="Models" value="Cloud + Local" />
                    <HeroStat label="Automation" value="Agents + API" />
                  </div>
                </div>

                <div className="rounded-2xl border border-theme-sidebar-border bg-theme-bg-primary p-4">
                  <div className="rounded-xl border border-theme-sidebar-border bg-theme-bg-secondary overflow-hidden">
                    <div className="px-4 py-3 border-b border-theme-sidebar-border flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        Proposal Generator
                      </div>
                      <div className="text-xs text-theme-text-secondary">
                        PAID Studio
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <PreviewRow
                        title="RFP → Proposal"
                        desc="Extract requirements, build scope, generate a branded PDF."
                      />
                      <PreviewRow
                        title="Timesheet → Invoice"
                        desc="Calculate line items, apply tax/discounts, export in batch."
                      />
                      <PreviewRow
                        title="Artifacts"
                        desc="Reuse code snippets, assets, and templates across projects."
                      />
                      <div className="pt-1">
                        <div className="h-10 rounded-lg border border-theme-sidebar-border bg-theme-bg-container" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Workflow */}
      <section id="workflow" className="py-16 px-6">
        <SectionHeader
          title="The P.A.I.D. Workflow"
          subtitle="Create, export, and automate proposals/invoices with a studio-grade document system."
          icon={<Workflow size={18} className="text-primary-button" />}
        />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Wrench size={18} className="text-primary-button" />}
            title="Creation Studio (BlockSuite Editor)"
            items={[
              "Rich text canvas (blocks, headers, lists, quotes, dividers)",
              "Real-time collaboration (multi-user editing)",
              "Specialized blocks: tables, images, code (syntax highlighting)",
              "Interactive code with Sandpack (React + HTML previews)",
            ]}
          />
          <FeatureCard
            icon={<FileText size={18} className="text-primary-button" />}
            title="Professional PDF Export"
            items={[
              "High-fidelity rendering via Playwright",
              "Branding control: headers, footers, logos, colors, CSS overrides",
              "Batch processing for multiple documents",
              "Built for RFP→Proposal and Timesheet→Invoice automation",
            ]}
          />
          <FeatureCard
            icon={<Plug size={18} className="text-primary-button" />}
            title="AI-Powered Template Builder"
            items={[
              "Chat-to-Design: describe a template, get HTML/CSS",
              "Visual editor to refine the output",
              "Reusable templates across teams and clients",
            ]}
          />
        </div>

        <div className="max-w-7xl mx-auto mt-6">
          <FeatureCard
            wide
            icon={<Database size={18} className="text-primary-button" />}
            title="Artifact Library"
            items={[
              "Save + categorize reusable snippets and assets",
              "Search and import/export artifacts",
              "Standardize deliverables across the org",
            ]}
          />
        </div>
      </section>

      {/* Core AI */}
      <section
        id="ai"
        className="py-16 px-6 bg-theme-bg-secondary/40 border-y border-theme-sidebar-border"
      >
        <SectionHeader
          title="Core AI & Intelligence"
          subtitle="Model-agnostic, RAG-native, built for citations and multiple chat modes."
          icon={<Cloud size={18} className="text-primary-button" />}
        />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          <FeatureCard
            icon={<Cloud size={18} className="text-primary-button" />}
            title="Model-Agnostic (Talk to Everything)"
            items={[
              "Cloud: OpenAI, Anthropic, Google Gemini, AWS Bedrock, Azure OpenAI",
              "Local privacy: Ollama, LM Studio, LocalAI, KoboldCPP",
              "Specialized providers: Perplexity, Groq, Mistral, DeepSeek",
            ]}
          />
          <FeatureCard
            icon={<FileText size={18} className="text-primary-button" />}
            title="Chat System"
            items={[
              "Citations in responses (link back to sources)",
              "Chat modes: Workspace Chat, Direct Chat, Agent Chat",
              "Slash commands, streaming, temperature control",
            ]}
          />
        </div>

        <div className="max-w-7xl mx-auto mt-6">
          <FeatureCard
            wide
            icon={<Database size={18} className="text-primary-button" />}
            title="Vector Databases"
            items={[
              "Connect to 10+ vector stores (Pinecone, Chroma, Weaviate, etc.)",
              "Supports local options like LanceDB",
              "Built for retrieval-augmented generation at scale",
            ]}
          />
        </div>
      </section>

      {/* Ingestion + Agents */}
      <section id="agents" className="py-16 px-6">
        <SectionHeader
          title="Ingestion, Agents & Automation"
          subtitle="Bring in anything, then automate the work with drag-and-drop agents."
          icon={<Workflow size={18} className="text-primary-button" />}
        />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<FileText size={18} className="text-primary-button" />}
            title="Universal Ingestion"
            items={[
              "Files: PDF, DOCX, CSV, JSON, XML, code",
              "Audio via Whisper; OCR for images",
              "Web scraping (URLs, site depth, YouTube transcripts)",
            ]}
          />
          <FeatureCard
            icon={<Database size={18} className="text-primary-button" />}
            title="Processing Engine"
            items={[
              "Intelligent chunking and duplicate detection",
              "Connectors: Obsidian, Confluence, GitLab, Paperless-ngx",
              "Reliable embeddings + vector search pipeline",
            ]}
          />
          <FeatureCard
            icon={<Workflow size={18} className="text-primary-button" />}
            title="Agents"
            items={[
              "Visual agent builder (drag-and-drop flow editor)",
              "Skills: SQL, chart generation, memory management",
              "Automation built for deliverables and ops",
            ]}
          />
        </div>
      </section>

      {/* Security */}
      <section
        id="security"
        className="py-16 px-6 bg-theme-bg-secondary/40 border-y border-theme-sidebar-border"
      >
        <SectionHeader
          title="Security & Administration"
          subtitle="Paranoid-level security with local-first data control and role-based access."
          icon={<ShieldCheck size={18} className="text-primary-button" />}
        />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          <FeatureCard
            icon={<Lock size={18} className="text-primary-button" />}
            title="Local-First"
            items={[
              "Keep data and API keys on local hardware",
              "Avoid pasting sensitive data into public tools",
              "Deploy private cloud when needed",
            ]}
          />
          <FeatureCard
            icon={<ShieldCheck size={18} className="text-primary-button" />}
            title="Administration"
            items={[
              "Multi-tenant workspaces with granular permissions",
              "Roles: Admin, Manager, User",
              "Audit logs, authentication flows, simple SSO",
            ]}
          />
        </div>
      </section>

      {/* Developer */}
      <section id="developer" className="py-16 px-6">
        <SectionHeader
          title="Enterprise & Developer Tools"
          subtitle="Embed, integrate, and measure."
          icon={<Plug size={18} className="text-primary-button" />}
        />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Workflow size={18} className="text-primary-button" />}
            title="CRM System"
            items={[
              "Customer management",
              "Lead tracking",
              "Interaction history",
            ]}
          />
          <FeatureCard
            icon={<Plug size={18} className="text-primary-button" />}
            title="Developer API"
            items={[
              "REST API + WebSockets + Webhooks",
              "Embeddable chat widgets with branding controls",
            ]}
          />
          <FeatureCard
            icon={<Database size={18} className="text-primary-button" />}
            title="Analytics"
            items={[
              "Usage behavior and system performance",
              "Template usage and export statistics",
              "Operational visibility for admins",
            ]}
          />
        </div>

        <div className="max-w-7xl mx-auto mt-10">
          <div className="rounded-2xl border border-theme-sidebar-border bg-theme-bg-secondary p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Ready to ship PAID?
              </h2>
              <p className="mt-2 text-theme-text-secondary leading-relaxed max-w-2xl">
                Launch your first workspace and start generating deliverables
                with a secure, model-agnostic AI platform.
              </p>
            </div>
            <Link
              to={paths.login()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-button text-theme-bg-primary font-bold"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 text-center text-xs text-theme-text-secondary">
            © {new Date().getFullYear()} PAID Platform. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="rounded-xl border border-theme-sidebar-border bg-theme-bg-primary p-4">
      <div className="text-xs text-theme-text-secondary">{label}</div>
      <div className="mt-1 text-sm font-semibold text-theme-text-primary">
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="max-w-7xl mx-auto mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-bg-secondary border border-theme-sidebar-border text-xs text-theme-text-secondary">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-3 text-theme-text-secondary text-lg leading-relaxed max-w-3xl">
        {subtitle}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, items, wide = false }) {
  return (
    <div
      className={`rounded-2xl border border-theme-sidebar-border bg-theme-bg-secondary p-6 ${
        wide ? "" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-theme-bg-primary border border-theme-sidebar-border flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-theme-text-secondary">
        {items.map((text) => (
          <li key={text} className="flex items-start gap-2">
            <CheckCircle size={16} className="text-primary-button mt-0.5" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewRow({ title, desc }) {
  return (
    <div className="rounded-xl border border-theme-sidebar-border bg-theme-bg-container p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-theme-text-secondary leading-relaxed">
        {desc}
      </div>
    </div>
  );
}
