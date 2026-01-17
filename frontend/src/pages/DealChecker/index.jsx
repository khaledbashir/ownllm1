import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  DollarSign,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useParams } from "react-router-dom";
import paths from "@/utils/paths";
import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

export default function DealChecker() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("buyer"); // buyer or seller
  const [listingText, setListingText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checksRemaining, setChecksRemaining] = useState(3);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Simulate fingerprinting/limit check on mount
  useEffect(() => {
    // In a real implementation, we'd call an API to get the remaining checks for this fingerprint
    const saved = localStorage.getItem("isgooddeal_checks");
    if (saved) {
      setChecksRemaining(parseInt(saved));
    }
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (checksRemaining <= 0) {
      setShowSignupModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get or create a fingerprint for anonymous users
      let fingerprint = localStorage.getItem("isgooddeal_fingerprint");
      if (!fingerprint) {
        fingerprint = Math.random().toString(36).substring(2, 15);
        localStorage.setItem("isgooddeal_fingerprint", fingerprint);
      }

      const response = await fetch(`${API_BASE}/deal-checker/analyze`, {
        method: "POST",
        headers: baseHeaders(),
        body: JSON.stringify({
          mode,
          listingText,
          fingerprint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setShowSignupModal(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to analyze");
      }

      setResult(data.result);
      // Update local count for UI purposes
      const newCount = checksRemaining - 1;
      setChecksRemaining(newCount);
      localStorage.setItem("isgooddeal_checks", newCount.toString());
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to analyze listing. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-900 flex">
      <Sidebar />
      <div className="flex-1 h-full overflow-y-auto p-4 md:p-10 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              IsGoodDeal.com
            </h1>
            <p className="text-zinc-400">AI-Powered Apple Deal Checker</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-zinc-800 p-1 rounded-xl mb-8 w-64 mx-auto border border-zinc-700">
            <button
              onClick={() => setMode("buyer")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === "buyer" ? "bg-blue-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"}`}
            >
              I&apos;m Buying
            </button>
            <button
              onClick={() => setMode("seller")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === "seller" ? "bg-blue-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"}`}
            >
              I&apos;m Selling
            </button>
          </div>

          {/* Progress Tracker */}
          <div className="mb-6 flex justify-between items-center px-2">
            <div className="text-sm font-medium text-zinc-400">
              Free checks remaining:{" "}
              <span
                className={
                  checksRemaining > 0 ? "text-green-400" : "text-red-400"
                }
              >
                {checksRemaining}
              </span>
            </div>
            {checksRemaining <= 0 && (
              <button
                onClick={() => setShowSignupModal(true)}
                className="text-xs font-bold text-blue-400 underline hover:text-blue-300 transition-colors"
              >
                Get unlimited checks
              </button>
            )}
          </div>

          {/* Input Form */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 shadow-2xl mb-10">
            <form onSubmit={handleAnalyze}>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                {mode === "buyer"
                  ? "Paste Listing Text (eBay, Facebook Marketplace, etc.)"
                  : "Tell us what you are selling (Model, Storage, Condition)"}
              </label>
              <textarea
                value={listingText}
                onChange={(e) => setListingText(e.target.value)}
                placeholder={
                  mode === "buyer"
                    ? "Example: iPhone 15 Pro Max 256GB Blue Titanium... $450"
                    : "Example: MacBook Pro M2 2022, 16GB RAM, 512GB SSD, Mint condition..."
                }
                className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600 mb-4 resize-none"
                required
              />
              <button
                type="submit"
                disabled={loading || !listingText}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "buyer"
                      ? "Is This A Good Deal?"
                      : "What Should I Price This At?"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Section */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-xl mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-500">
              {error}
            </div>
          )}

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              {mode === "buyer" ? (
                <BuyerResultCard result={result} />
              ) : (
                <SellerResultCard result={result} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl scale-in-center">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              You&apos;ve hit the limit!
            </h2>
            <p className="text-zinc-400 mb-8">
              Sign up for free to get{" "}
              <span className="text-white font-bold">
                5 more checks per day
              </span>{" "}
              and save your history.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => (window.location.href = paths.register())}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"
              >
                Sign Up Now
              </button>
              <button
                onClick={() => setShowSignupModal(false)}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 rounded-xl transition-all"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BuyerResultCard({ result }) {
  const isGood = result.recommendation === "yes";
  const isFair = result.recommendation === "maybe";

  const bgColor = isGood
    ? "bg-green-500/10"
    : isFair
      ? "bg-yellow-500/10"
      : "bg-red-500/10";
  const borderColor = isGood
    ? "border-green-500"
    : isFair
      ? "border-yellow-500"
      : "border-red-500";
  const textColor = isGood
    ? "text-green-500"
    : isFair
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div
      className={`border-2 ${borderColor} ${bgColor} rounded-3xl overflow-hidden shadow-2xl`}
    >
      <div
        className={`p-6 ${borderColor} border-b flex justify-between items-center`}
      >
        <div className="flex items-center gap-3">
          {isGood ? (
            <CheckCircle className={`w-8 h-8 ${textColor}`} />
          ) : isFair ? (
            <AlertTriangle className={`w-8 h-8 ${textColor}`} />
          ) : (
            <XCircle className={`w-8 h-8 ${textColor}`} />
          )}
          <h3
            className={`text-2xl font-black uppercase tracking-tight ${textColor}`}
          >
            {result.recommendation === "yes"
              ? "YES - GOOD DEAL!"
              : result.recommendation === "maybe"
                ? "MAYBE - FAIR PRICE"
                : "NO - OVERPRICED"}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Confidence
          </div>
          <div className={`text-2xl font-black ${textColor}`}>
            {result.confidence_score}%
          </div>
        </div>
      </div>

      <div className="p-8 grid md:grid-cols-2 gap-8 bg-zinc-900/50">
        <div>
          <div className="mb-6">
            <div className="text-zinc-400 text-sm font-medium mb-1 uppercase tracking-wider">
              Analysis Summary
            </div>
            <p className="text-white leading-relaxed">{result.reasoning}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-zinc-500 font-medium italic">
                Asking Price
              </span>
              <span className="text-white text-xl font-bold">
                {result.asking_price}
              </span>
            </div>
            <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
              <span className="text-zinc-500 font-medium italic">
                Estimated Value
              </span>
              <span className="text-blue-400 text-xl font-bold">
                ${result.estimated_value}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-zinc-500 font-medium italic underline decoration-blue-500/30">
                Potential Savings
              </span>
              <span className="text-green-400 text-xl font-black">
                $
                {result.estimated_value -
                  parseInt(result.asking_price.replace(/\D/g, ""))}{" "}
                (Save{" "}
                {Math.round(
                  (1 -
                    parseInt(result.asking_price.replace(/\D/g, "")) /
                      result.estimated_value) *
                    100
                )}
                %)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-sm font-bold text-green-500 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> GREEN FLAGS
            </div>
            <ul className="space-y-2">
              {result.green_flags.map((flag, i) => (
                <li
                  key={i}
                  className="text-zinc-300 text-sm flex items-start gap-2"
                >
                  <span className="text-green-500 mt-1">✓</span> {flag}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> RED FLAGS
            </div>
            <ul className="space-y-2">
              {result.red_flags.map((flag, i) => (
                <li
                  key={i}
                  className="text-zinc-300 text-sm flex items-start gap-2"
                >
                  <span className="text-red-500 mt-1">!</span> {flag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerResultCard({ result }) {
  return (
    <div className="border border-zinc-700 bg-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8" />
          <h3 className="text-2xl font-black uppercase tracking-tight">
            Optimal Price: {result.optimal_price}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-blue-200 uppercase tracking-widest">
            Market Demand
          </div>
          <div className="text-2xl font-black">
            {result.market_demand.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="p-8 grid md:grid-cols-2 gap-8">
        <div>
          <div className="mb-8 bg-zinc-900 rounded-2xl p-6 border border-zinc-700">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Pricing Targets
            </h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-bold">Quick Sale</div>
                  <div className="text-xs text-zinc-500">Fast (1-2 days)</div>
                </div>
                <div className="text-xl font-bold text-zinc-300">
                  {result.quick_sale_price}
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-600/10 rounded-xl outline outline-1 outline-blue-600/30 shadow-inner">
                <div>
                  <div className="text-blue-400 font-black">
                    Optimal Balance ⭐
                  </div>
                  <div className="text-xs text-blue-300/60">3-5 days</div>
                </div>
                <div className="text-2xl font-black text-white">
                  {result.optimal_price}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-bold">Max Realistic</div>
                  <div className="text-xs text-zinc-500">7-10+ days</div>
                </div>
                <div className="text-xl font-bold text-zinc-300">
                  {result.max_price}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/30 rounded-2xl">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
              STRATEGY_NOTES.txt
            </h4>
            <p className="text-zinc-300 italic leading-relaxed text-sm">
              &quot;{result.pricing_strategy}&quot;
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-sm font-bold text-yellow-500 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" /> PRO LISTING TIPS
            </h4>
            <ul className="space-y-3">
              {result.listing_tips.map((tip, i) => (
                <li
                  key={i}
                  className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-zinc-300 text-sm shadow-sm hover:border-blue-500/50 transition-colors"
                >
                  <span className="text-blue-500 font-bold mr-2">#{i + 1}</span>{" "}
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-700 rounded-3xl bg-zinc-900/20 group hover:border-blue-500/50 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Info className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="text-zinc-500 text-center text-sm">
              Connect to eBay API to automate this pricing or see real-time
              trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
