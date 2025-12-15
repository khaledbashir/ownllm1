import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import paths from '@/utils/paths';
import {
    RocketLaunch,
    Users,
    ShieldCheck,
    CheckCircle,
    ArrowRight,
    Brain,
    Globe,
    Robot,
    Database,
    Lightning
} from '@phosphor-icons/react';

export default function MarketingHome() {
    const [activePersona, setActivePersona] = useState('entrepreneur');

    return (
        <div className="min-h-screen bg-[#0e0f0f] text-white selection:bg-blue-500 selection:text-white font-sans overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-[#0e0f0f]/80 backdrop-blur-md border-b border-white/5 top-0 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to={paths.marketing()} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-lg">O</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">OwnLLM</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#personas" className="hover:text-white transition-colors">Solutions</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to={paths.login()} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Log in
                        </Link>
                        <Link
                            to={paths.login()}
                            className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-all transform hover:scale-105"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 opacity-50" />

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-8 animate-fade-in">
                    <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                    v1.0 Now Available with Multi-Agent Support
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                    Your Brand. Your AI. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        Your Revenue.
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
                    The ultimate white-label AI platform. Launch your own ChatGPT-like SaaS in minutes,
                    fully branded, on your own domain.
                </p>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <Link
                        to={paths.login()}
                        className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <RocketLaunch size={20} weight="fill" />
                        Launch My Platform
                    </Link>
                    <a
                        href="#personas"
                        className="w-full md:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        Explore Use Cases
                        <ArrowRight size={16} />
                    </a>
                </div>

                {/* Dashboard Preview Image Placeholder */}
                <div className="mt-20 relative rounded-xl border border-white/10 bg-[#1b1b1e] p-2 shadow-2xl w-full max-w-5xl mx-auto aspect-video flex flex-col overflow-hidden group">
                    <div className="h-8 bg-[#25272c] w-full rounded-t-lg flex items-center px-4 gap-2 border-b border-white/5">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <div className="mx-auto w-1/3 h-4 bg-black/20 rounded-full" />
                    </div>
                    <div className="flex-1 bg-gradient-to-b from-[#1b1b1e] to-black relative p-8 flex items-center justify-center text-gray-600">
                        {/* Fake UI mockup */}
                        <div className="absolute inset-0 flex">
                            <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-3">
                                <div className="h-8 bg-white/5 rounded w-3/4 mb-4" />
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-6 bg-white/5 rounded w-full opacity-50" />)}
                            </div>
                            <div className="flex-1 p-8 flex flex-col">
                                <div className="flex-1" />
                                <div className="flex gap-4 mb-8">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-white/10 rounded w-1/4" />
                                        <div className="h-4 bg-white/10 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="h-16 border border-white/10 rounded-xl bg-black/40 p-4" />
                            </div>
                        </div>
                        <p className="z-10 opacity-50">App Preview</p>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-10 border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm font-medium text-gray-500 mb-8 uppercase tracking-wider">Trusted by innovative teams worldwide</p>
                    <div className="flex justify-center flex-wrap gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Simple text logos for now */}
                        <span className="text-xl font-bold opacity-50">CLIENT 1</span>
                        <span className="text-xl font-bold opacity-50">CLIENT 2</span>
                        <span className="text-xl font-bold opacity-50">CLIENT 3</span>
                        <span className="text-xl font-bold opacity-50">CLIENT 4</span>
                        <span className="text-xl font-bold opacity-50">CLIENT 5</span>
                    </div>
                </div>
            </section>

            {/* Personas Section */}
            <section id="personas" className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Who is OwnLLM for?</h2>
                    <p className="text-gray-400 text-lg">Choose your path to AI dominance.</p>
                </div>

                <div className="flex justify-center mb-12">
                    <div className="p-1 bg-white/5 rounded-full inline-flex border border-white/10">
                        {['entrepreneur', 'agency', 'enterprise'].map((persona) => (
                            <button
                                key={persona}
                                onClick={() => setActivePersona(persona)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activePersona === persona
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {persona.charAt(0).toUpperCase() + persona.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center min-h-[400px]">
                    <div className="space-y-6 animate-fade-in" key={activePersona}>
                        {activePersona === 'entrepreneur' && (
                            <>
                                <div className="inline-flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wide text-sm">
                                    <RocketLaunch size={20} /> Aspiring Entrepreneur
                                </div>
                                <h3 className="text-4xl font-bold">Start your own AI SaaS in 48 hours.</h3>
                                <p className="text-xl text-gray-400 leading-relaxed">
                                    Don't code from scratch. White-label our platform and start selling recurring revenue AI subscriptions to local businesses immediately.
                                </p>
                                <ul className="space-y-4 pt-4">
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-blue-500" size={20} />
                                        Done-for-you technical infrastructure
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-blue-500" size={20} />
                                        Set your own pricing & keep 100% of profits
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-blue-500" size={20} />
                                        Your custom domain & branding
                                    </li>
                                </ul>
                            </>
                        )}
                        {activePersona === 'agency' && (
                            <>
                                <div className="inline-flex items-center gap-2 text-purple-400 font-bold uppercase tracking-wide text-sm">
                                    <Users size={20} /> Agency CEO
                                </div>
                                <h3 className="text-4xl font-bold">Scale your service without scaling headcount.</h3>
                                <p className="text-xl text-gray-400 leading-relaxed">
                                    Give every client a branded AI portal trained on your strategies. Productize your expertise and turn one-off projects into monthly retainers.
                                </p>
                                <ul className="space-y-4 pt-4">
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-purple-500" size={20} />
                                        Client-specific knowledge bases
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-purple-500" size={20} />
                                        Automated reporting & deliverables
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-purple-500" size={20} />
                                        High-stickiness client portal
                                    </li>
                                </ul>
                            </>
                        )}
                        {activePersona === 'enterprise' && (
                            <>
                                <div className="inline-flex items-center gap-2 text-green-400 font-bold uppercase tracking-wide text-sm">
                                    <ShieldCheck size={20} /> Enterprise
                                </div>
                                <h3 className="text-4xl font-bold">ChatGPT power, inside your firewall.</h3>
                                <p className="text-xl text-gray-400 leading-relaxed">
                                    Stop employees from pasting sensitive data into public AI. Deploy OwnLLM on your private cloud for secure, compliant, department-level AI.
                                </p>
                                <ul className="space-y-4 pt-4">
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-green-500" size={20} />
                                        Self-hosted data sovereignty
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-green-500" size={20} />
                                        Role-based access controls
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle weight="fill" className="text-green-500" size={20} />
                                        Audit logs & compliance
                                    </li>
                                </ul>
                            </>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-white/10 to-transparent p-1 rounded-2xl border border-white/10">
                        <div className="bg-[#1b1b1e] rounded-xl p-8 h-full min-h-[400px] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20 transform rotate-12 scale-150"></div>
                            {/* Abstract Visual Representation */}
                            {activePersona === 'entrepreneur' && <RocketLaunch size={120} weight="thin" className="text-blue-500/50" />}
                            {activePersona === 'agency' && <Users size={120} weight="thin" className="text-purple-500/50" />}
                            {activePersona === 'enterprise' && <ShieldCheck size={120} weight="thin" className="text-green-500/50" />}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-left max-w-2xl mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything needed to dominate.</h2>
                        <p className="text-gray-400 text-lg">We built the hard stuff so you can focus on the selling stuff.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Brain size={32} className="text-pink-400" />}
                            title="33+ AI Models"
                            desc="Switch between GPT-4, Claude 3, Llama 3, and Gemini instantly. Offer the best model for every task."
                        />
                        <FeatureCard
                            icon={<Database size={32} className="text-blue-400" />}
                            title="RAG & Vector DBs"
                            desc="Chat with unlimited PDFs, Excel sheets, and websites. We handle the embeddings and vector search."
                        />
                        <FeatureCard
                            icon={<Robot size={32} className="text-purple-400" />}
                            title="Autonomous Agents"
                            desc="Visual flow builder lets you create agents that browse the web, scrape data, and execute tasks."
                        />
                        <FeatureCard
                            icon={<Globe size={32} className="text-green-400" />}
                            title="White-Label Ready"
                            desc="Your logo, your colors, your domain. Remove all traces of OwnLLM and make it yours."
                        />
                        <FeatureCard
                            icon={<Users size={32} className="text-yellow-400" />}
                            title="CRM & Multi-User"
                            desc="Manage thousands of users and workspaces. Track usage, conversations, and engagement."
                        />
                        <FeatureCard
                            icon={<Lightning size={32} className="text-cyan-400" />}
                            title="Smart Plugins"
                            desc="Connect to Zapier, Salesforce, and external APIs with built-in tool calling capabilities."
                        />
                    </div>
                </div>
            </section>

            {/* Marketing / Pricing Section */}
            <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Profitable Pricing Models</h2>
                    <p className="text-gray-400 text-lg">Pick the model that fits your business strategy.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <PricingCard
                        title="SaaS Model"
                        price="$29 - $99"
                        unit="/ user / mo"
                        desc="Perfect for volume. Sell seat-based access to your platform."
                        features={['Predictable revenue', 'Scales with headcount', 'Low touch']}
                    />
                    <PricingCard
                        title="Retainer Model"
                        price="$499+"
                        unit="/ client / mo"
                        desc="Bundle AI with your agency services to increase stickiness."
                        features={['High value', 'Increases retention', 'Service differentiator']}
                        highlight={true}
                    />
                    <PricingCard
                        title="Setup Model"
                        price="$5,000+"
                        unit="one-time setup"
                        desc="Charge for custom implementation and training."
                        features={['Upfront cashflow', 'Custom solutions', 'Maintenance fees']}
                    />
                </div>
            </section>

            {/* CTA Footer */}
            <footer className="py-20 border-t border-white/10 bg-[#050505] text-center">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to launch your empire?</h2>
                    <p className="text-xl text-gray-400 mb-10">
                        Stop planning and start selling. Your branded AI platform is waiting.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to={paths.login()}
                            className="px-10 py-4 bg-white text-black text-lg font-bold rounded-xl hover:bg-gray-200 transition-all hover:scale-105"
                        >
                            Get Started Now
                        </Link>
                    </div>
                    <p className="mt-12 text-sm text-gray-600">
                        © {new Date().getFullYear()} OwnLLM. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="mb-6 p-3 bg-white/5 rounded-xl inline-block">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">
                {desc}
            </p>
        </div>
    )
}

function PricingCard({ title, price, unit, desc, features, highlight = false }) {
    return (
        <div className={`p-8 rounded-2xl border ${highlight ? 'bg-blue-600/10 border-blue-500/50 relative overflow-hidden' : 'bg-white/5 border-white/5'}`}>
            {highlight && (
                <div className="absolute top-0 right-0 bg-blue-500 text-xs font-bold px-3 py-1 rounded-bl-xl text-white">
                    MOST POPULAR
                </div>
            )}
            <h3 className="text-lg font-bold mb-2 text-gray-300">{title}</h3>
            <div className="mb-4">
                <span className="text-4xl font-bold">{price}</span>
                <span className="text-sm text-gray-500">{unit}</span>
            </div>
            <p className="text-sm text-gray-400 mb-8 border-b border-white/10 pb-8 min-h-[80px]">
                {desc}
            </p>
            <ul className="space-y-3">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle size={16} className={highlight ? "text-blue-400" : "text-gray-500"} weight="fill" />
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    )
}
