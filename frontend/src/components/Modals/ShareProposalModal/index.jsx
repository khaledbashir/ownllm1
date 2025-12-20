import React, { useState } from "react";
import { X, Copy, Check, Lock, Calendar } from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import Workspace from "@/models/workspace";

export default function ShareProposalModal({
  show,
  onClose,
  workspaceSlug,
  getHtmlContent, // Now a function that returns Promise<string>
}) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!show) return null;

  const handleGenerateValues = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      // Get HTML content on-demand
      const htmlContent = getHtmlContent ? await getHtmlContent() : null;

      if (!htmlContent) {
        showToast("Document content is empty", "error");
        setLoading(false);
        return;
      }

      const { url, error } = await Workspace.createPublicProposal(
        workspaceSlug,
        htmlContent,
        {
          password,
          expiresAt,
        }
      );

      if (error) {
        showToast(error, "error");
      } else {
        const fullUrl = `${window.location.origin}${url}`;
        setGeneratedUrl(fullUrl);
        showToast("Public link generated!", "success");
      }
    } catch (err) {
      showToast("Failed to generate link", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    showToast("Link copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-theme-bg-secondary w-full max-w-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white">
            Share Proposal via Public Link
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!generatedUrl ? (
            <form
              onSubmit={handleGenerateValues}
              className="flex flex-col gap-4"
            >
              <p className="text-sm text-white/70">
                Create a secure, read-only link for your client. This captures a
                snapshot of the current document.
              </p>

              <div className="space-y-4">
                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                    Access Password (Optional)
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave empty for public access"
                      className="w-full bg-theme-bg-primary border border-white/10 rounded-lg px-9 py-2.5 text-sm text-white focus:outline-none focus:border-primary-button/50 transition-colors placeholder:text-white/20"
                    />
                  </div>
                </div>

                {/* Expiry Input */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                    Expires At (Optional)
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-theme-bg-primary border border-white/10 rounded-lg px-9 py-2.5 text-sm text-white focus:outline-none focus:border-primary-button/50 transition-colors scheme-dark"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-button hover:bg-primary-button/90 text-white font-medium px-6 py-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                >
                  {loading ? "Generating..." : "Create Link"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-2">
                <Check size={32} weight="bold" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  Link Ready!
                </h3>
                <p className="text-white/60 text-sm max-w-xs mx-auto">
                  Share this link with your client. They can view, comment, and
                  sign this proposal.
                </p>
              </div>

              <div className="w-full bg-theme-bg-primary border border-white/10 rounded-lg p-3 flex items-center gap-3">
                <input
                  readOnly
                  value={generatedUrl}
                  className="flex-1 bg-transparent text-sm text-white/90 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-md transition-all ${copied
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <div className="w-full pt-4 border-t border-white/10 flex justify-center">
                <button
                  onClick={() => {
                    setGeneratedUrl(null);
                    onClose();
                  }}
                  className="text-white/50 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
