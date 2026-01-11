import React, { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import CRM from "@/models/crm";
import { 
  Hotel, 
  FileText, 
  Activity, 
  Search, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import paths from "@/utils/paths";

export default function HotelRatesPage() {
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    extracted: 0,
    verified: 0,
    live: 0
  });

  useEffect(() => {
    async function loadHotelPipeline() {
      try {
        const { pipelines } = await CRM.pipelines();
        const hotelPipeline = pipelines.find(p => p.name === "Contract Processing");
        if (hotelPipeline) {
          setPipeline(hotelPipeline);
          // Calculate stats from cards
          const { cards } = await CRM.cards(hotelPipeline.id);
          const newStats = {
            total: cards.length,
            extracted: cards.filter(c => c.stage === 'glm_extracted').length,
            verified: cards.filter(c => c.stage === 'verified').length,
            live: cards.filter(c => c.stage === 'live').length
          };
          setStats(newStats);
        }
      } catch (e) {
        console.error("Failed to load hotel pipeline:", e);
      } finally {
        setLoading(false);
      }
    }
    loadHotelPipeline();
  }, []);

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#141414] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Hotel size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">HotelOS Intelligence</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Hotel Rate Management
              </h1>
              <p className="text-white/40 mt-1">Manage and verify AI-extracted hotel contract rates.</p>
            </div>
            
            <a 
              href={paths.settings.crm()} 
              className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl transition-all flex items-center gap-2 font-medium"
            >
              <Activity size={18} />
              Open Full Pipeline
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8">
          <StatCard 
            title="Total Contracts" 
            value={stats.total} 
            icon={<FileText className="text-blue-400" />} 
            description="All processed documents"
          />
          <StatCard 
            title="AI Extracted" 
            value={stats.extracted} 
            icon={<TrendingUp className="text-amber-400" />} 
            description="Waiting for human review"
            alert={stats.extracted > 0}
          />
          <StatCard 
            title="Verified" 
            value={stats.verified} 
            icon={<CheckCircle2 className="text-emerald-400" />} 
            description="Approved by team"
          />
          <StatCard 
            title="Live in System" 
            value={stats.live} 
            icon={<Activity className="text-purple-400" />} 
            description="Syncing with pricing engine"
          />
        </div>

        {/* Action Section */}
        <div className="px-8 pb-8">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-white/10 rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-emerald-500/10 transition-colors duration-500">
              <Hotel size={240} />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">Launch Z.ai Extraction</h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                Upload a hotel contract PDF or paste the text in any workspace chat. 
                Use the <span className="text-emerald-400 font-mono">/hotel-rates</span> command or 
                Smart Actions to trigger the GLM-4.7 extraction engine.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <a 
                  href={paths.home()}
                  className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-xl shadow-emerald-500/10"
                >
                  Go to Workspace
                  <ChevronRight size={18} />
                </a>
                <button 
                  onClick={() => window.location.href = paths.settings.crm()}
                  className="px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2"
                >
                  <Search size={18} />
                  Find a Contract
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Preview */}
        <div className="px-8 pb-12">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-amber-400" />
            Standard Extraction Workflow
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <WorkflowStep 
              number="01" 
              title="Inbox" 
              desc="Raw contract uploaded to thread notes or chat context."
            />
            <WorkflowStep 
              number="02" 
              title="Processing" 
              desc="Z.ai analyzes text, extracts rates, and inserts BlockSuite rows."
            />
            <WorkflowStep 
              number="03" 
              title="Verification" 
              desc="Manager reviews rates in the Hotel Rate Block for accuracy."
            />
            <WorkflowStep 
              number="04" 
              title="Sync" 
              desc="Verified rates become available for live proposal generation."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, alert = false }) {
  return (
    <div className={`bg-[#1a1a1a] border ${alert ? 'border-amber-500/30' : 'border-white/5'} p-6 rounded-2xl hover:border-white/20 transition-all group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {alert && (
          <div className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase rounded-lg border border-amber-500/20">
            Action Needed
          </div>
        )}
      </div>
      <div className="text-4xl font-bold mb-1 tabular-nums">{value}</div>
      <div className="text-sm font-bold text-white/80 mb-1">{title}</div>
      <div className="text-xs text-white/40 leading-relaxed">{description}</div>
    </div>
  );
}

function WorkflowStep({ number, title, desc }) {
  return (
    <div className="bg-[#1a1a1a]/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:bg-[#1a1a1a] transition-all">
      <div className="text-5xl font-black text-white/5 absolute -bottom-2 -right-2 transition-all group-hover:text-emerald-500/10 tracking-tighter">
        {number}
      </div>
      <div className="font-bold mb-2 group-hover:text-emerald-400 transition-colors uppercase tracking-widest text-[10px]">Step {number}</div>
      <div className="font-bold text-white/90 mb-2">{title}</div>
      <div className="text-xs text-white/40 leading-relaxed">{desc}</div>
    </div>
  );
}
