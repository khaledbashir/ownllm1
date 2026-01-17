import React, { useState } from "react";
import {
  EnvelopeSimple,
  CircleNotch,
  Check,
  Warning,
} from "@phosphor-icons/react";
import { API_BASE } from "@/utils/constants";

export default function ClientPortalLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/v1/auth/magic-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to send magic link");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
            <Check size={32} weight="bold" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Check your email
          </h2>
          <p className="text-gray-400 mb-6">
            We sent a magic sign-in link to{" "}
            <span className="text-white font-medium">{email}</span>. Click the
            link to access your portal.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Client Portal
            </h1>
            <p className="text-gray-400">
              Sign in to view your proposals and projects
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <EnvelopeSimple size={20} />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-[#141414] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-sans"
                  placeholder="name@company.com"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <Warning size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              {loading ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : (
                "Send Magic Link"
              )}
            </button>

            {/* DEV BYPASS */}
            <div className="pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(
                    "anythingllm_client_auth",
                    "dev-bypass-token"
                  );
                  window.location.href = "/portal/dashboard";
                }}
                className="w-full py-2 text-xs font-mono text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
              >
                [DEV] Bypass Identity Check
              </button>
            </div>
          </form>
        </div>
        <div className="px-8 py-4 bg-white/5 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">
            Powered by <span className="text-gray-300 font-medium">OwnLLM</span>
          </p>
        </div>
      </div>
    </div>
  );
}
