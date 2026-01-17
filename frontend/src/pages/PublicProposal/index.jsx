// Client Hub Redesign - Premium, Noir-themed Portal
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  FilePdf,
  CircleNotch,
  Warning,
  Check,
  PencilSimple,
  ArrowRight,
  ChartLineUp,
  House,
  CurrencyDollar,
  ListChecks,
  Users,
  Briefcase,
  DownloadSimple,
} from "@phosphor-icons/react";
import { API_BASE } from "@/utils/constants";

// --- Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    signed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    expired: "bg-red-500/10 text-red-400 border-red-500/20",
    draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const labels = {
    active: "Active Proposal",
    signed: "Signed & Accepted",
    expired: "Expired",
    draft: "Draft Mode",
  };

  return (
    <div
      className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${styles[status] || styles.draft}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {labels[status] || status}
    </div>
  );
};

const NavItem = ({ id, label, icon: Icon, activeTab, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl group relative overflow-hidden ${
      activeTab === id
        ? "bg-white/10 text-white border border-white/10"
        : "text-gray-400 hover:text-white hover:bg-white/5"
    }`}
  >
    <div className="relative z-10 flex items-center gap-3">
      <Icon
        size={20}
        weight={activeTab === id ? "fill" : "regular"}
        className={`shrink-0 ${activeTab === id ? "text-blue-400" : "group-hover:text-blue-400 transition-colors"}`}
      />
      <span className="truncate">{label}</span>
    </div>
    {activeTab === id && (
      <div className="absolute left-0 bottom-0 top-0 w-1 bg-blue-500 rounded-l-xl" />
    )}
  </button>
);

const Sidebar = ({
  proposal,
  activeTab,
  setActiveTab,
  onSign,
  onDownload,
  isExporting,
  isEmbedded,
}) => {
  const sidebarWidth = "280px";
  const portalSidebarWidth = "256px"; // w-64

  return (
    <aside
      className={`bg-[#050505] border-r border-white/10 flex flex-col shrink-0 z-20 h-screen fixed top-0 bottom-0 transition-all duration-300`}
      style={{
        width: sidebarWidth,
        left: isEmbedded ? portalSidebarWidth : 0,
      }}
    >
      {/* Brand Header - Hide if embedded */}
      {!isEmbedded && (
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 shadow-lg shadow-black/50">
              <Briefcase size={22} className="text-white" weight="duotone" />
            </div>
            <div>
              <h2 className="text-white font-bold tracking-tight text-lg leading-tight font-serif">
                Client Hub
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Secure Portal
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar ${isEmbedded ? "pt-6" : ""}`}
      >
        <div className="px-4 py-2 mb-2">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            Documents
          </p>
        </div>
        <NavItem
          id="overview"
          label="Project Overview"
          icon={House}
          activeTab={activeTab}
          onClick={setActiveTab}
        />
        <NavItem
          id="scope"
          label="Scope of Work"
          icon={ListChecks}
          activeTab={activeTab}
          onClick={setActiveTab}
        />
        <NavItem
          id="commercials"
          label="Commercials"
          icon={CurrencyDollar}
          activeTab={activeTab}
          onClick={setActiveTab}
        />
        <NavItem
          id="team"
          label="Project Team"
          icon={Users}
          activeTab={activeTab}
          onClick={setActiveTab}
        />
      </div>

      {/* User/Proposal Context Footer */}
      <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
        {/* Proposal Owner Card - Hide if embedded (redundant with portal sidebar sometimes, but useful context) */}
        {!isEmbedded && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-lg border border-white/5 group hover:bg-white/10 transition-colors cursor-default">
            {proposal?.workspace?.pfpFilename ? (
              <img
                src={`${API_BASE}/assets/${proposal.workspace.pfpFilename}`}
                alt=""
                className="w-10 h-10 rounded-full object-cover border-2 border-white/10 grayscale group-hover:grayscale-0 transition-all"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white border-2 border-white/10">
                {proposal?.workspace?.name?.charAt(0) || "W"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-blue-200 transition-colors">
                {proposal?.workspace?.name || "Workspace"}
              </p>
              <p className="text-xs text-gray-500 truncate">Proposal Owner</p>
            </div>
          </div>
        )}

        <div className="grid gap-2">
          {proposal?.status === "active" ? (
            <button
              onClick={onSign}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded-lg transition-all shadow-lg shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5"
            >
              <PencilSimple size={18} weight="bold" />
              Sign Proposal
            </button>
          ) : proposal?.status === "signed" ? (
            <div className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold rounded-lg cursor-default">
              <Check size={18} weight="bold" />
              Signed & Accepted
            </div>
          ) : null}

          <button
            onClick={onDownload}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium rounded-lg transition-all border border-white/10 hover:border-white/20"
          >
            {isExporting ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <DownloadSimple size={18} />
            )}
            {isExporting ? "Exporting..." : "Download PDF"}
          </button>
        </div>
      </div>
    </aside>
  );
};

const SignatureModal = ({ proposalId, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSign = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/proposal/${proposalId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData: {
            name: name.trim(),
            date: new Date().toISOString(),
            ip: "client",
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || "Failed to sign");
      }
    } catch (e) {
      alert("Failed to sign proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/10 bg-[#0a0a0a]">
          <h2 className="text-xl font-bold text-white font-serif">
            Sign & Accept Proposal
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            By signing below, you accept the terms and conditions.
          </p>
        </div>

        <form onSubmit={handleSign} className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Legal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="p-4 bg-emerald-900/10 rounded-lg border border-emerald-500/20 mb-6">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Check size={16} className="text-emerald-500" weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1">
                  Digital Signature
                </p>
                <p className="text-xs text-emerald-600/80 leading-relaxed">
                  This records your IP address and timestamp as a binding
                  acceptance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-bold text-gray-400 bg-transparent border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-3 text-sm font-bold text-black bg-white rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
              {loading ? (
                <>
                  <CircleNotch className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PencilSimple className="w-4 h-4" weight="bold" />
                  Sign It
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function PublicProposalView() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showSignModal, setShowSignModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Detect if we are in the Portal
  const isEmbedded = window.location.pathname.includes("/portal/");
  const sidebarWidth = "280px";

  useEffect(() => {
    fetchProposal();
  }, [id]);

  // Content Extraction Logic
  const processedContent = useMemo(() => {
    if (!proposal?.htmlContent)
      return { overview: "", commercials: "", scope: "", team: "" };

    const parser = new DOMParser();
    const doc = parser.parseFromString(proposal.htmlContent, "text/html");

    // 1. Extract Commercials (Tables)
    const tables = Array.from(doc.querySelectorAll("table"));
    const commercialsHtml =
      tables.map((table) => table.outerHTML).join("<br/><br/>") ||
      "<div class='text-center p-8 text-gray-500 italic'>No pricing tables found in this document.</div>";

    // 2. Extract Scope (Lists + Preceding Headers)
    const scopeParts = [];
    doc.querySelectorAll("h2, h3").forEach((header) => {
      const next = header.nextElementSibling;
      if (next && (next.tagName === "UL" || next.tagName === "OL")) {
        scopeParts.push(header.outerHTML);
        scopeParts.push(next.outerHTML);
      }
    });
    if (scopeParts.length === 0) {
      doc
        .querySelectorAll("ul, ol")
        .forEach((list) => scopeParts.push(list.outerHTML));
    }
    const scopeHtml =
      scopeParts.join("<br/>") ||
      "<div class='text-center p-8 text-gray-500 italic'>No specifically structured scope items found. Check Overview.</div>";

    return {
      overview: proposal.htmlContent,
      commercials: `<div class='prose prose-invert prose-lg max-w-none text-gray-300'><h2>Commercials & Investment</h2>${commercialsHtml}</div>`,
      scope: `<div class='prose prose-invert prose-lg max-w-none text-gray-300'><h2>Scope of Work Details</h2>${scopeHtml}</div>`,
      team: `<div class='text-center p-12'><div class='bg-white/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-white/10'><Users size={32} className='text-gray-400'/></div><h3 class='text-lg font-bold text-white'>Project Team</h3><p class='text-gray-500'>Team members are not explicitly listed in this document structure.</p></div>`,
    };
  }, [proposal]);

  const fetchProposal = async () => {
    try {
      const response = await fetch(`${API_BASE}/proposal/${id}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Proposal not found");
      } else {
        setProposal(data.proposal);
      }
    } catch (e) {
      setError("Failed to load proposal");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`${API_BASE}/proposal/${id}/export-pdf`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposal-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin"></div>
          </div>
          <p className="text-gray-500 font-mono text-sm uppercase tracking-[0.2em] animate-pulse">
            Initializing Secure Hub...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full mx-auto p-8 border border-white/10 rounded-2xl bg-[#0a0a0a]">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Warning className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 font-serif">
            {error === "This proposal has expired."
              ? "Access Expired"
              : "Hub Not Found"}
          </h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRight size={16} className="mr-2 rotate-180" />
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-white/20 flex overflow-hidden">
      <Sidebar
        proposal={proposal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSign={() => setShowSignModal(true)}
        onDownload={handleDownloadPdf}
        isExporting={isExporting}
        isEmbedded={isEmbedded}
      />

      {/* MAIN CONTENT AREA */}
      <main
        className="flex-1 overflow-y-auto relative scroll-smooth h-screen bg-[#050505] transition-all duration-300"
        style={{
          marginLeft: isEmbedded ? 0 : sidebarWidth,
          paddingLeft: isEmbedded ? sidebarWidth : 0,
        }}
      >
        {/* Top Glass Bar */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10 px-8 py-5 flex items-center justify-between shadow-xl">
          <div>
            <h1 className="text-xl font-bold text-white font-serif tracking-tight flex items-center gap-3">
              {activeTab === "overview" && "Executive Overview"}
              {activeTab === "commercials" && "Commercials & Investment"}
              {activeTab === "scope" && "Scope of Work"}
              {activeTab === "team" && "Project Team"}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-gray-500 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                Secure Connection
              </span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-500">
                Last updated{" "}
                {new Date(
                  proposal.lastUpdatedAt || Date.now()
                ).toLocaleDateString()}
              </span>
            </div>
          </div>

          <StatusBadge status={proposal.status} />
        </div>

        <div className="p-8 max-w-5xl mx-auto pb-32">
          {/* PAPER CARD CONTAINER - Adjusted to Dark Mode Noir */}
          <div
            className={`bg-[#0a0a0a] text-gray-200 rounded-xl overflow-hidden min-h-[800px] relative transition-all duration-700 ease-out border border-white/10 relative group ${loading ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"}`}
          >
            {/* Subtle top gradient highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>

            {/* Content Render */}
            <div
              className="p-16 prose prose-invert prose-lg max-w-none 
                  prose-headings:font-serif prose-headings:font-bold prose-headings:text-white 
                  prose-h1:text-4xl prose-h1:mb-8 
                  prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-gray-100
                  prose-p:text-gray-400 prose-p:leading-relaxed 
                  prose-li:text-gray-400 
                  prose-strong:text-white prose-strong:font-bold
                  prose-blockquote:border-l-4 prose-blockquote:border-white/20 prose-blockquote:bg-white/5 prose-blockquote:px-4 prose-blockquote:py-1
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  prose-table:border-white/10 prose-th:bg-white/5 prose-th:text-white prose-td:border-white/10"
            >
              {/* Content Switcher */}
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    processedContent[activeTab] || processedContent.overview,
                }}
              />
            </div>
          </div>

          {/* Footer Credit */}
          <div className="text-center mt-12 mb-8 opacity-30 hover:opacity-100 transition-opacity">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              Powered by OwnLLM • Secure Client Portal
            </p>
          </div>
        </div>
      </main>

      {/* Sign Modal */}
      {showSignModal && (
        <SignatureModal
          proposalId={id}
          onClose={() => setShowSignModal(false)}
          onSuccess={() => {
            setShowSignModal(false);
            fetchProposal(); // Refresh to show signed status
          }}
        />
      )}
    </div>
  );
}
