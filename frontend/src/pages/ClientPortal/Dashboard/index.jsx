import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  Funnel,
  SortAscending,
} from "@phosphor-icons/react";
import { API_BASE } from "@/utils/constants";
// import StatusBadge from "@/components/ClientPortal/StatusBadge";

// Temporary StatusBadge if not shared yet
const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    signed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    expired: "bg-red-500/10 text-red-400 border-red-500/20",
    draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return (
    <div
      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles[status] || styles.draft}`}
    >
      {status}
    </div>
  );
};

export default function ClientDashboard() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, signed

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      // Get client email from localStorage (set during login)
      const clientEmail =
        localStorage.getItem("client_email") ||
        localStorage.getItem("anythingllm_client_email");

      if (!clientEmail) {
        console.error("No client email found in localStorage");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/client-portal/proposals?email=${encodeURIComponent(clientEmail)}`
      );
      const data = await response.json();

      if (data.success) {
        setProposals(data.proposals);
      } else {
        console.error("Failed to fetch proposals:", data.error);
      }
    } catch (err) {
      console.error("Failed to fetch proposals", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(
    (p) => filter === "all" || p.status === filter
  );

  // Update stats based on real data
  const activeCount = proposals.filter((p) => p.status === "active").length;
  const signedCount = proposals.filter((p) => p.status === "signed").length;
  const totalValue = proposals.reduce((sum, p) => {
    // Extract numeric value from amount string (e.g., "$12,000" -> 12000)
    const numeric = parseFloat(p.amount?.replace(/[^\d.]/g, "")) || 0;
    return sum + numeric;
  }, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back. Here is an overview of your projects.
          </p>
        </div>
        <div className="flex gap-3">{/* Actions if any */}</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText size={64} className="text-blue-500" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">
            Active Proposals
          </p>
          <p className="text-3xl font-bold text-white">1</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle size={64} className="text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">
            Signed Projects
          </p>
          <p className="text-3xl font-bold text-white">4</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={64} className="text-purple-500" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">
            Pending Actions
          </p>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex bg-[#0a0a0a] border border-white/10 rounded-xl p-1">
          {["all", "active", "signed", "expired"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm">Loading projects...</p>
          </div>
        ) : filteredProposals.length > 0 ? (
          <div className="divide-y divide-white/5">
            <div className="grid grid-cols-12 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
              <div className="col-span-6">Project Name</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-right">Value</div>
              <div className="col-span-2 text-right">Date</div>
            </div>
            {filteredProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="grid grid-cols-12 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer"
                onClick={() => {
                  /* Navigate to project */
                }}
              >
                <div className="col-span-6">
                  <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {proposal.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {proposal.workspace}
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <StatusBadge status={proposal.status} />
                </div>
                <div className="col-span-2 text-right text-gray-300 font-mono text-sm">
                  {proposal.amount}
                </div>
                <div className="col-span-2 text-right text-gray-500 text-sm flex items-center justify-end gap-2">
                  {proposal.date}
                  <ArrowRight
                    size={16}
                    className="text-gray-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText size={48} weight="thin" className="mb-4 opacity-50" />
            <p>No proposals found matching your filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
