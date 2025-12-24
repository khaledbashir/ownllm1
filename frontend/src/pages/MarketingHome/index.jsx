import React, { useState, useEffect } from "react";
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
  Zap,
  Users,
  Globe,
  Code,
  BarChart3,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  FileCheck,
  TrendingUp,
  Award,
  Sparkles,
  Target,
  Layers,
  Puzzle,
  Cpu,
  HardDrive,
  Network,
  Zap as Lightning,
  Eye,
  GitBranch,
  Layout,
  Palette,
  Download,
  Share2,
  Search,
  Filter,
  Tag,
  Calendar,
  MapPin,
  Phone,
  Mail,
  HelpCircle,
  X,
  Menu,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Workflow", href: "#workflow" },
  { label: "Core AI", href: "#ai" },
  { label: "Agents", href: "#agents" },
  { label: "Security", href: "#security" },
  { label: "Developer", href: "#developer" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const USE_CASES = [
  {
    icon: <Briefcase className="text-primary-button" />,
    title: "Consulting Firms",
    description: "Generate proposals with custom rates, create branded PDFs from AI conversations, and track notes per client meeting.",
    features: ["Custom Rate Cards", "Branded PDFs", "Client Workspaces"],
  },
  {
    icon: <Palette className="text-primary-button" />,
    title: "Marketing Agencies",
    "description": "Manage client workspaces separately, build proposals with hourly rates, and export delivery specifications.",
    features: ["Multi-Client Management", "Proposal Templates", "Delivery Tracking"],
  },
  {
    icon: <Code className="text-primary-button" />,
    title: "Freelancers",
    description: "Quick proposal generation from chat, branded PDF exports, and organized note-taking per project.",
    features: ["Quick Proposals", "Project Notes", "Time Tracking"],
  },
  {
    icon: <Layout className="text-primary-button" />,
    title: "Product Managers",
    description: "Document specifications in notes, export to PDF for stakeholders, and archive conversations with artifacts.",
    features: ["Spec Documents", "Stakeholder Reports", "Artifact Library"],
  },
];

const PRICING_PLANS = [
  {
    name: "Starter",
    description: "Perfect for individuals and small teams getting started.",
    price: "Free",
    period: "forever",
    features: [
      "Up to 3 workspaces",
      "10 documents per workspace",
      "Basic AI models (GPT-3.5, Claude Haiku)",
      "Standard PDF export",
      "Community support",
      "1 user account",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing teams that need more power and flexibility.",
    price: "$29",
    period: "/month",
    features: [
      "Unlimited workspaces",
      "Unlimited documents",
      "Premium AI models (GPT-4, Claude Opus)",
      "Custom PDF templates with branding",
      "Products & Rate Card managers",
      "Smart Plugins (up to 5)",
      "Priority email support",
      "5 user accounts",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For organizations with advanced security and compliance needs.",
    price: "Custom",
    period: "pricing",
    features: [
      "Everything in Professional",
      "Unlimited users",
      "SSO/SAML authentication",
      "Advanced audit logging",
      "Custom integrations",
      "Dedicated success manager",
      "SLA guarantee",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Consultant",
    company: "Chen & Partners",
    avatar: "SC",
    content: "I used to spend hours every week searching through old proposals and contracts. Now I can just ask my AI assistant and get exactly what I need in seconds. It's like having a research assistant who never forgets anything.",
    rating: 5,
  },
  {
    name: "Mike Rodriguez",
    role: "Agency Owner",
    company: "Creative Pulse",
    avatar: "MR",
    content: "The PDF export feature has transformed how we create proposals. We can now generate branded, professional documents in minutes instead of hours. Our clients are impressed with the quality and speed.",
    rating: 5,
  },
  {
    name: "Alex Kim",
    role: "Software Engineer",
    company: "TechFlow",
    avatar: "AK",
    content: "As a developer, the code execution feature is incredible. I can test snippets directly in my documentation and share working examples with my team. It's made our technical documentation so much more useful.",
    rating: 5,
  },
];

const FAQS = [
  {
    question: "Is my data secure?",
    answer: "Yes! We use enterprise-grade encryption and give you the option to process documents locally. Your data is never used to train AI models, and you maintain full control over your information.",
  },
  {
    question: "What file formats do you support?",
    answer: "We support 20+ formats including PDF, Word, Excel, PowerPoint, text files, Markdown, CSV, JSON, XML, code files, and more. We also support audio files via Whisper and images with OCR.",
  },
  {
    question: "Can I use this with my existing tools?",
    answer: "Absolutely! We integrate with popular tools like Obsidian, Confluence, GitLab, and Paperless-ngx. We also offer a comprehensive REST API and WebSockets for custom integrations.",
  },
  {
    question: "Do I need technical knowledge to use this?",
    answer: "Not at all! If you can chat, you can use our platform. No technical expertise required. Our intuitive interface makes it easy for anyone to get started.",
  },
  {
    question: "What happens to my documents if I cancel?",
    answer: "You can export all your data at any time. Nothing is locked in or held hostage. We believe in data portability and your right to access your information.",
  },
  {
    question: "Can I host this myself?",
    answer: "Yes! PAID Platform is fully self-hostable. You can deploy it using Docker, Kubernetes, or on your own infrastructure. We provide comprehensive deployment guides for various platforms.",
  },
];

const KEY_STATS = [
  { value: "25+", label: "AI Model Providers" },
  { value: "10+", label: "Vector Databases" },
  { value: "20+", label: "File Formats" },
  { value: "150+", label: "API Endpoints" },
  { value: "40+", label: "Database Tables" },
  { value: "500+", label: "Configuration Options" },
];

export default function MarketingHome() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector("nav");
      if (nav) {
        if (window.scrollY > 50) {
          nav.classList.add("shadow-lg");
        } else {
          nav.classList.remove("shadow-lg");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-theme-bg-primary/90 backdrop-blur-md border-b border-theme-sidebar-border transition-shadow duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link
            to={paths.marketing()}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-button to-purple-600 flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-lg">P</span>
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight text-lg">PAID Platform</div>
              <div className="text-xs text-theme-text-secondary">
                Proposals And Invoices Delivered
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 text-sm text-theme-text-secondary">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hover:text-theme-text-primary transition-colors font-medium"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link
              to={paths.login()}
              className="text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              to={paths.login()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-button to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-theme-bg-secondary transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-theme-sidebar-border bg-theme-bg-primary">
            <div className="px-4 py-4 space-y-3">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="block py-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-4 border-t border-theme-sidebar-border space-y-3">
                <Link
                  to={paths.login()}
                  className="block py-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to={paths.login()}
                  className="block py-3 px-4 rounded-xl bg-gradient-to-r from-primary-button to-purple-600 text-white text-sm font-bold text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-theme-sidebar-border bg-gradient-to-br from-theme-bg-secondary to-theme-bg-primary">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full bg-primary-button/10 blur-[90px]" />
              <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-purple-500/10 blur-[90px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
            </div>

            <div className="relative p-8 md:p-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg-primary/80 border border-theme-sidebar-border text-sm text-theme-text-secondary backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-primary-button animate-pulse" />
                <span className="font-medium">Paid platform features (white-label + enterprise)</span>
              </div>

              <div className="mt-8 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
                    Turn scope into{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-button to-purple-600">
                      proposals
                    </span>
                    .
                    <br />
                    Turn work into{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-button to-purple-600">
                      invoices
                    </span>
                    .
                  </h1>
                  <p className="mt-6 text-lg text-theme-text-secondary leading-relaxed max-w-xl">
                    The PAID Platform combines a collaborative creation studio,
                    high-fidelity PDF export, model-agnostic AI, and workflow
                    automation to ship Proposals And Invoices Delivered.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Link
                      to={paths.login()}
                      className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary-button to-purple-600 text-white font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Rocket size={20} />
                      Launch Workspace
                    </Link>
                    <a
                      href="#workflow"
                      className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-theme-sidebar-border bg-theme-bg-primary text-theme-text-primary hover:bg-theme-bg-container transition-colors"
                    >
                      Explore features
                      <ArrowRight size={18} />
                    </a>
                  </div>

                  <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
                    <HeroStat label="Creation Studio" value="BlockSuite" />
                    <HeroStat label="PDF Export" value="Playwright" />
                    <HeroStat label="Models" value="Cloud + Local" />
                    <HeroStat label="Automation" value="Agents + API" />
                  </div>
                </div>

                <div className="rounded-2xl border border-theme-sidebar-border bg-theme-bg-primary/80 backdrop-blur-sm p-4 shadow-2xl">
                  <div className="rounded-xl border border-theme-sidebar-border bg-theme-bg-secondary overflow-hidden">
                    <div className="px-4 py-3 border-b border-theme-sidebar-border flex items-center justify-between bg-gradient-to-r from-theme-bg-secondary to-theme-bg-primary">
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles size={16} className="text-primary-button" />
                        Proposal Generator
                      </div>
                      <div className="text-xs text-theme-text-secondary px-2 py-1 rounded-full bg-theme-bg-primary border border-theme-sidebar-border">
                        PAID Studio
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <PreviewRow
                        title="RFP → Proposal"
                        desc="Extract requirements, build scope, generate a branded PDF."
                        icon={<FileCheck size={16} className="text-primary-button" />}
                      />
                      <PreviewRow
                        title="Timesheet → Invoice"
                        desc="Calculate line items, apply tax/discounts, export in batch."
                        icon={<TrendingUp size={16} className="text-primary-button" />}
                      />
                      <PreviewRow
                        title="Artifacts"
                        desc="Reuse code snippets, assets, and templates across projects."
                        icon={<Layers size={16} className="text-primary-button" />}
                      />
                      <div className="pt-1">
                        <div className="h-10 rounded-lg border border-theme-sidebar-border bg-theme-bg-container animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Key Stats Section */}
      <section className="py-12 px-6 bg-gradient-to-r from-theme-bg-secondary/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {KEY_STATS.map((stat, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-xl bg-theme-bg-secondary border border-theme-sidebar-border hover:border-primary-button/50 transition-colors"
              >
                <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-button to-purple-600">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs md:text-sm text-theme-text-secondary">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Built for Your Workflow"
            subtitle="Whether you're a consultant, agency, freelancer, or product manager, PAID Platform adapts to your needs."
            icon={<Target size={18} className="text-primary-button" />}
          />

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {USE_CASES.map((useCase, index) => (
              <UseCaseCard key={index} {...useCase} />
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-6 bg-gradient-to-b from-theme-bg-secondary/30 to-transparent">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </section>

      {/* Core AI Section */}
      <section
        id="ai"
        className="py-20 px-6 bg-theme-bg-secondary/40 border-y border-theme-sidebar-border"
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

      {/* Ingestion + Agents Section */}
      <section id="agents" className="py-20 px-6">
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

      {/* Security Section */}
      <section
        id="security"
        className="py-20 px-6 bg-gradient-to-b from-theme-bg-secondary/40 to-transparent border-y border-theme-sidebar-border"
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

      {/* Developer Section */}
      <section id="developer" className="py-20 px-6">
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
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-theme-bg-secondary/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="What Our Users Say"
            subtitle="See how teams are transforming their workflows with PAID Platform."
            icon={<Star size={18} className="text-primary-button" />}
          />

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {TESTIMONIALS.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Simple, Transparent Pricing"
            subtitle="Choose the plan that fits your needs. Start free, scale as you grow."
            icon={<Tag size={18} className="text-primary-button" />}
          />

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {PRICING_PLANS.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-gradient-to-b from-theme-bg-secondary/30 to-transparent">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about PAID Platform."
            icon={<HelpCircle size={18} className="text-primary-button" />}
          />

          <div className="mt-12 space-y-4">
            {FAQS.map((faq, index) => (
              <FaqItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === index}
                onToggle={() => toggleFaq(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-theme-sidebar-border bg-gradient-to-br from-primary-button/10 to-purple-600/10 p-8 md:p-16 text-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-[400px] h-[400px] rounded-full bg-primary-button/10 blur-[80px]" />
              <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[80px]" />
            </div>

            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Ready to Ship PAID?
              </h2>
              <p className="mt-4 text-lg text-theme-text-secondary leading-relaxed max-w-2xl mx-auto">
                Launch your first workspace and start generating deliverables
                with a secure, model-agnostic AI platform.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={paths.login()}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-button to-purple-600 text-white font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#faq"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-theme-sidebar-border bg-theme-bg-primary text-theme-text-primary hover:bg-theme-bg-container transition-colors"
                >
                  Learn More
                </a>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-theme-text-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary-button" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary-button" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary-button" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-theme-sidebar-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-button to-purple-600 flex items-center justify-center">
                  <span className="font-bold text-white text-sm">P</span>
                </div>
                <div className="font-bold tracking-tight">PAID Platform</div>
              </div>
              <p className="text-sm text-theme-text-secondary">
                Proposals And Invoices Delivered. Transform your workflow with AI-powered document intelligence.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-theme-text-secondary">
                <li><a href="#workflow" className="hover:text-theme-text-primary transition-colors">Workflow</a></li>
                <li><a href="#ai" className="hover:text-theme-text-primary transition-colors">Core AI</a></li>
                <li><a href="#agents" className="hover:text-theme-text-primary transition-colors">Agents</a></li>
                <li><a href="#pricing" className="hover:text-theme-text-primary transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-theme-text-secondary">
                <li><a href="#faq" className="hover:text-theme-text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-theme-text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-theme-text-primary transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-theme-text-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-theme-text-secondary">
                <li><a href="#" className="hover:text-theme-text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-theme-text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-theme-text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-theme-text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-theme-sidebar-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-theme-text-secondary">
              © {new Date().getFullYear()} PAID Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-theme-text-secondary hover:text-theme-text-primary transition-colors">
                <Globe size={20} />
              </a>
              <a href="#" className="text-theme-text-secondary hover:text-theme-text-primary transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-theme-text-secondary hover:text-theme-text-primary transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components

function HeroStat({ label, value }) {
  return (
    <div className="rounded-xl border border-theme-sidebar-border bg-theme-bg-primary/80 backdrop-blur-sm p-4 hover:border-primary-button/50 transition-colors">
      <div className="text-xs text-theme-text-secondary">{label}</div>
      <div className="mt-1 text-sm font-semibold text-theme-text-primary">
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="max-w-7xl mx-auto mb-8 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg-secondary border border-theme-sidebar-border text-sm text-theme-text-secondary">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-3 text-theme-text-secondary text-lg leading-relaxed max-w-3xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, items, wide = false }) {
  return (
    <div
      className={`rounded-2xl border border-theme-sidebar-border bg-theme-bg-secondary p-6 hover:border-primary-button/50 transition-all hover:shadow-lg ${
        wide ? "" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-theme-bg-primary border border-theme-sidebar-border flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-theme-text-secondary">
        {items.map((text) => (
          <li key={text} className="flex items-start gap-2">
            <CheckCircle size={16} className="text-primary-button mt-0.5 flex-shrink-0" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewRow({ title, desc, icon }) {
  return (
    <div className="rounded-xl border border-theme-sidebar-border bg-theme-bg-container p-4 hover:border-primary-button/30 transition-colors">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="mt-1 text-sm text-theme-text-secondary leading-relaxed">
        {desc}
      </div>
    </div>
  );
}

function UseCaseCard({ icon, title, description, features }) {
  return (
    <div className="rounded-2xl border border-theme-sidebar-border bg-theme-bg-secondary p-6 hover:border-primary-button/50 transition-all hover:shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-button/10 to-purple-600/10 border border-theme-sidebar-border flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-bold text-xl tracking-tight">{title}</h3>
      </div>
      <p className="text-theme-text-secondary leading-relaxed mb-4">
        {description}
      </p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-theme-text-secondary">
            <CheckCircle size={14} className="text-primary-button" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestimonialCard({ name, role, company, avatar, content, rating }) {
  return (
    <div className="rounded-2xl border border-theme-sidebar-border bg-theme-bg-secondary p-6 hover:border-primary-button/50 transition-all hover:shadow-lg">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-theme-text-secondary leading-relaxed mb-6">
        "{content}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-button to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          {avatar}
        </div>
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-theme-text-secondary">
            {role} at {company}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, description, price, period, features, cta, popular }) {
  return (
    <div className={`relative rounded-2xl border p-6 transition-all hover:shadow-xl ${
      popular 
        ? "border-primary-button bg-gradient-to-b from-primary-button/5 to-theme-bg-secondary scale-105" 
        : "border-theme-sidebar-border bg-theme-bg-secondary hover:border-primary-button/50"
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary-button to-purple-600 text-white text-xs font-bold">
          Most Popular
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="font-bold text-xl tracking-tight">{name}</h3>
        <p className="mt-2 text-sm text-theme-text-secondary">{description}</p>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-theme-text-secondary ml-1">{period}</span>}
        </div>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <CheckCircle size={16} className="text-primary-button mt-0.5 flex-shrink-0" />
            <span className="text-theme-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to={paths.login()}
        className={`block w-full py-3 rounded-xl text-center font-bold transition-all ${
          popular
            ? "bg-gradient-to-r from-primary-button to-purple-600 text-white hover:opacity-90 shadow-lg"
            : "border border-theme-sidebar-border bg-theme-bg-primary text-theme-text-primary hover:bg-theme-bg-container"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function FaqItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="rounded-xl border border-theme-sidebar-border bg-theme-bg-secondary overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-theme-bg-container transition-colors"
      >
        <span className="font-semibold">{question}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-theme-text-secondary leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

// Additional icon components
function Briefcase(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function Github(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function Twitter(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
