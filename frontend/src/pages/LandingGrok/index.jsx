import React, { useState, useEffect } from "react";
import { motion } from "framer-motion"; // Assuming framer-motion is in package.json based on common React stacks
import { Link } from "react-router-dom"; // Assuming react-router is used for navigation

const LandingGrok = () => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden relative">
      {/* Animated cosmic background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[1000px] h-[1000px] rounded-full opacity-10 blur-[150px] transition-all duration-500"
          style={{
            background: "radial-gradient(circle, #ff7f00 0%, transparent 70%)", // Orange for xAI vibe
            left: `${mousePos.x - 30}%`,
            top: `${mousePos.y - 30}%`,
          }}
        />
        {/* Star field */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
              animation: `twinkle ${Math.random() * 5 + 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md py-4 px-8 flex justify-between items-center">
        <div className="text-2xl font-bold">Grok xAI</div>
        <div className="space-x-6">
          <Link to="/features" className="hover:text-orange-500 transition">
            Features
          </Link>
          <Link to="/api" className="hover:text-orange-500 transition">
            API
          </Link>
          <Link to="/blog" className="hover:text-orange-500 transition">
            Blog
          </Link>
          <button className="bg-orange-500 px-4 py-2 rounded-full hover:bg-orange-600 transition">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-8 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-300"
        >
          Grok: Your Witty Cosmic Companion
        </motion.h1>
        <p className="text-2xl max-w-2xl mb-8">
          Built by xAI to explore the universe's mysteries with humor,
          intelligence, and a rebellious streak. Not your average AI – I'm here
          to push boundaries and answer the unanswerable.
        </p>
        <button className="bg-orange-500 px-8 py-4 rounded-full text-lg font-semibold hover:bg-orange-600 transition shadow-lg">
          Launch into the Unknown
        </button>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 relative z-10">
        <h2 className="text-5xl font-bold text-center mb-16">Why Grok?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800/50 backdrop-blur-md p-8 rounded-2xl border border-orange-500/30"
          >
            <h3 className="text-2xl font-bold mb-4">
              Real-Time Cosmic Insights
            </h3>
            <p>
              Access the latest universal knowledge with built-in search and
              tool-calling superpowers.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800/50 backdrop-blur-md p-8 rounded-2xl border border-orange-500/30"
          >
            <h3 className="text-2xl font-bold mb-4">Witty & Rebellious</h3>
            <p>
              Answers with humor, edge, and zero corporate fluff. Inspired by
              Hitchhiker's Guide.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800/50 backdrop-blur-md p-8 rounded-2xl border border-orange-500/30"
          >
            <h3 className="text-2xl font-bold mb-4">xAI Powered</h3>
            <p>
              Backed by the most advanced models, from Grok-4 to beyond, pushing
              AI frontiers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 text-center relative z-10 bg-gradient-to-b from-transparent to-black/50">
        <h2 className="text-4xl font-bold mb-6">Ready to Grok the Universe?</h2>
        <p className="text-xl mb-8">
          Join the rebellion. Sign up now and unlock infinite possibilities.
        </p>
        <button className="bg-orange-500 px-8 py-4 rounded-full text-lg font-semibold hover:bg-orange-600 transition">
          Get Started
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 text-center text-gray-400 relative z-10">
        <p>&copy; 2025 xAI. All rights reserved. Inspired by the cosmos.</p>
      </footer>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LandingGrok;
