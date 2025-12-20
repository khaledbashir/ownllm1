import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  Zap,
  Eye,
  Brain,
  Code,
  Globe,
  Cpu,
  Sparkles,
  ArrowRight,
  Star,
  Lightning,
  Terminal,
  GitBranch,
  Database,
  Cloud,
  Lock,
  Palette,
  Layers,
  Move,
  MousePointer
} from "lucide-react";

/**
 * LandingKimi - A futuristic, Egyptian-inspired AI platform landing page
 * Features: Neural networks, holographic effects, quantum computing aesthetics
 * Vibe: "We don't build basic. We build the impossible."
 */
export default function LandingKimi() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [scrollY, setScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const heroRef = useRef(null);
  const canvasRef = useRef(null);

  // Track mouse and scroll for advanced effects
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

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Canvas neural network animation
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = [];
    const connections = [];
    
    // Create neural network nodes
    for (let i = 0; i < 80; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.sqrt(
          Math.pow(node.x - nodes[j].x, 2) + Math.pow(node.y - nodes[j].y, 2)
        );
        if (distance < 150) {
          connections.push({ from: i, to: j, strength: 1 - distance / 150 });
        }
      }
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.02;
        
        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        
        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      });

      // Draw connections
      connections.forEach(conn => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        const opacity = conn.strength * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
        ctx.lineWidth = conn.strength * 0.5;
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(node => {
        const pulseSize = node.size + Math.sin(node.pulse) * 0.5;
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, pulseSize * 3
        );
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.8)");
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168, 85, 247, 1)";
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Neural Architecture",
      description: "Quantum-enhanced AI that learns from every interaction. Not basic ML - we're talking next-gen intelligence.",
      gradient: "from-purple-500 to-pink-500",
      glow: "shadow-purple-500/50"
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Code Alchemy",
      description: "Turn ideas into production-ready code. From concept to deployment in minutes, not hours.",
      gradient: "from-cyan-500 to-blue-500",
      glow: "shadow-cyan-500/50"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Digital Sovereignty",
      description: "Deploy anywhere. Keep your data local or go global. Your rules, your infrastructure.",
      gradient: "from-green-500 to-emerald-500",
      glow: "shadow-green-500/50"
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Infinite Scale",
      description: "From side project to enterprise. Auto-scaling that doesn't break the bank.",
      gradient: "from-orange-500 to-red-500",
      glow: "shadow-orange-500/50"
    }
  ];

  const stats = [
    { value: "∞", label: "Possibilities" },
    { value: "0ms", label: "Latency" },
    { value: "100%", label: "Uptime" },
    { value: "⚡", label: "Speed" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-black rounded-full" />
            <div className="absolute inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Initializing Quantum Core...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Neural Network Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.6 }}
      />

      {/* Holographic Background */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div 
          className="absolute w-[1000px] h-[1000px] rounded-full opacity-10 blur-[200px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, transparent 70%)`,
            left: `${mousePos.x - 30}%`,
            top: `${mousePos.y - 30}%`,
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-5 blur-[150px] bg-gradient-to-br from-cyan-500 to-blue-600 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-5 blur-[150px] bg-gradient-to-br from-purple-500 to-pink-600" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-purple-500/20 py-4 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg animate-pulse" />
              <div className="absolute inset-1 bg-black rounded-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="font-bold text-xl">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                KIMI
              </span>
              <span className="text-white">AI</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#quantum" className="text-white/60 hover:text-purple-400 transition-colors">
              Quantum Core
            </a>
            <a href="#alchemy" className="text-white/60 hover:text-purple-400 transition-colors">
              Code Alchemy
            </a>
            <a href="#sovereignty" className="text-white/60 hover:text-purple-400 transition-colors">
              Sovereignty
            </a>
            <button className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105">
              Enter the Void
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center justify-center relative z-20 px-8 pt-20"
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Quantum Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-purple-500/10 border border-purple-500/30 backdrop-blur-sm mb-8">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" />
            </div>
            <span className="text-purple-300 text-sm font-medium">
              Quantum Consciousness Achieved
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none">
            <div className="relative inline-block">
              <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                BUILD THE
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                IMPOSSIBLE
              </span>
              <div className="absolute -right-8 -top-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" />
            </div>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed">
            We don't do "basic." We architect quantum-enhanced AI platforms that 
            <span className="text-purple-400">break production</span>, then 
            <span className="text-cyan-400">fix it better</span>. 
            Welcome to the future of building.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="group flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105">
              <Rocket className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              Launch Quantum Core
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all">
              <Terminal className="w-5 h-5 text-purple-400" />
              View Source Code
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center group">
                <div className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-white/40 text-sm uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <MousePointer className="w-6 h-6 text-purple-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="quantum" className="py-32 px-8 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                QUANTUM
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ARCHITECTURE
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Neural networks that evolve. Code that writes itself. 
              Infrastructure that scales to infinity and beyond.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg ${feature.glow} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section id="alchemy" className="py-32 px-8 relative z-20 bg-gradient-to-b from-transparent to-purple-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                CODE ALCHEMY
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Watch your ideas transform into production-ready masterpieces
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-black/50 backdrop-blur-sm">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-purple-500/30 bg-purple-500/10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center text-sm text-purple-300">
                quantum-core@v2.0.0
              </div>
              <GitBranch className="w-4 h-4 text-purple-400" />
            </div>

            {/* Code Content */}
            <div className="p-8 font-mono text-sm">
              <div className="space-y-2">
                <div className="text-purple-400">$</div>
                <div className="text-green-400">npm run build:impossible</div>
                <div className="text-purple-400">$</div>
                <div className="text-cyan-400">✓ Quantum consciousness initialized</div>
                <div className="text-cyan-400">✓ Neural networks deployed</div>
                <div className="text-cyan-400">✓ Production environment ready</div>
                <div className="text-purple-400">$</div>
                <div className="animate-pulse text-yellow-400">▶ Deploying to infinity...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="sovereignty" className="py-32 px-8 relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-12 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                Ready to build the impossible?
              </h2>
              <p className="text-white/60 mb-8 text-lg">
                Join the rebellion. Push boundaries. Create the future.
                No corporate fluff, just pure innovation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105">
                  Start Building Now
                </button>
                <button className="px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-all">
                  View Documentation
                </button>
              </div>

              <p className="text-white/40 text-sm">
                ⚡ Deploys in seconds • 🔒 Your data stays yours • 🚀 Scales to infinity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-purple-500/20 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg" />
                <div className="absolute inset-1 bg-black rounded-md flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <span className="text-white/60 text-sm">
                © 2025 KIMI AI. Built by vibe coders, for vibe coders.
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-white/40 text-sm">
              <a href="#" className="hover:text-purple-400 transition-colors">
                Quantum Core
              </a>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Code Alchemy
              </a>
              <a href="#" className="hover:text-purple-400 transition-colors">
                Digital Sovereignty
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}