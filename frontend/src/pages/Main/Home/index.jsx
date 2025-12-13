import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Database,
  Brain,
  PiggyBank,
  Activity,
  FileText,
  Globe,
  MessageSquare,
  Clock,
  ChevronRight,
  Zap,
  FolderOpen,
  Bot,
  TrendingUp,
  CheckCircle,
  Layers,
  Wand2,
  Command,
  TerminalSquare
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import paths from "@/utils/paths";
import Workspace from "@/models/workspace";
import { useTranslation } from "react-i18next";

// Dummy data for demo
const RECENT_WORKSPACES = [
  { name: "Client Proposal Bot", lastActive: "2m ago", documents: 24, icon: "📋" },
  { name: "HR Policy Assistant", lastActive: "1h ago", documents: 156, icon: "👥" },
  { name: "Codebase Debugger", lastActive: "3h ago", documents: 89, icon: "🐛" },
];

const ACTIVITY_FEED = [
  { action: "AI created 'Landing Page Wireframe'", time: "2 min ago", type: "create" },
  { action: "Document 'Q3_Report.pdf' embedded", time: "5 min ago", type: "embed" },
  { action: "Agent searched the web for pricing data", time: "12 min ago", type: "search" },
  { action: "New workspace 'Sales Deck' created", time: "1h ago", type: "workspace" },
  { action: "Flow 'Lead Notifier' executed", time: "2h ago", type: "flow" },
  { action: "3 documents synced from upload", time: "3h ago", type: "sync" },
];

const SPARKLINE_DATA = [40, 55, 45, 70, 65, 80, 75, 90, 85, 95, 88, 100];

// Mini sparkline component
function MiniSparkline({ data, color = "#3b82f6" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Status indicator
function StatusDot({ status = "online" }) {
  const colors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    connecting: "bg-yellow-500",
  };
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75`}></span>
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`}></span>
    </span>
  );
}

// Activity icon based on type
function ActivityIcon({ type }) {
  const icons = {
    create: <Sparkles size={14} className="text-purple-400" />,
    embed: <FileText size={14} className="text-blue-400" />,
    search: <Globe size={14} className="text-green-400" />,
    workspace: <FolderOpen size={14} className="text-yellow-400" />,
    flow: <Zap size={14} className="text-orange-400" />,
    sync: <Database size={14} className="text-cyan-400" />,
  };
  return icons[type] || <Activity size={14} className="text-gray-400" />;
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Good morning");
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Navigation Actions
  const chatWithAgent = async () => {
    const workspaces = await Workspace.all();
    if (workspaces.length > 0) {
      navigate(paths.workspace.chat(workspaces[0].slug, { search: { action: "set-agent-chat" } }));
    }
  };

  const setSlashCommand = async () => {
    const workspaces = await Workspace.all();
    if (workspaces.length > 0) {
      navigate(paths.workspace.chat(workspaces[0].slug, { search: { action: "open-new-slash-command-modal" } }));
    }
  };

  const setSystemPrompt = async () => {
    const workspaces = await Workspace.all();
    if (workspaces.length > 0) {
      navigate(paths.workspace.settings.chatSettings(workspaces[0].slug, { search: { action: "focus-system-prompt" } }));
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{username}</span>
          </h1>
          <p className="text-slate-400 mt-1">Your AI command center is ready.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <StatusDot status="online" />
            <span className="text-sm text-slate-300">System Online</span>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">

        {/* Hero Card - App Builder */}
        <div className="col-span-12 lg:col-span-6 row-span-2">
          <div className="h-full p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-slate-900 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all duration-300 group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                  <Wand2 size={32} className="text-white" />
                </div>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  NEW
                </span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                Custom AI Agents
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Build powerful AI Agents and automations with no code. Just describe what you want.
              </p>

              <div className="flex gap-3">
                <Link
                  to={paths.agents.builder()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40"
                >
                  <Sparkles size={20} />
                  Build Agent Flow
                </Link>
                <button
                  onClick={chatWithAgent}
                  className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 hover:text-white transition-all duration-300 border border-slate-700"
                >
                  Chat with Agent
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Replaces Usage Metrics */}
        <div className="col-span-12 lg:col-span-6 grid grid-cols-2 gap-4">

          {/* Slash Commands */}
          <button
            onClick={setSlashCommand}
            className="col-span-1 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800 transition-all duration-300 group text-left"
          >
            <div className="p-3 w-fit rounded-xl bg-purple-500/20 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Command size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Slash Commands</h3>
            <p className="text-sm text-slate-400">Save time and inject prompts.</p>
          </button>

          {/* System Prompts */}
          <button
            onClick={setSystemPrompt}
            className="col-span-1 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-green-500/50 hover:bg-slate-800 transition-all duration-300 group text-left"
          >
            <div className="p-3 w-fit rounded-xl bg-green-500/20 text-green-400 mb-4 group-hover:scale-110 transition-transform">
              <TerminalSquare size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">System Prompts</h3>
            <p className="text-sm text-slate-400">Customize AI personality.</p>
          </button>

          {/* Chat */}
          <Link
            to={paths.home()}
            className="col-span-1 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 group"
          >
            <div className="p-3 w-fit rounded-xl bg-blue-500/20 text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Live Chat</h3>
            <p className="text-sm text-slate-400">Start new conversation.</p>
          </Link>

          {/* Knowledge Base */}
          <div className="col-span-1 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 w-fit rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
              <MiniSparkline data={SPARKLINE_DATA} color="#22d3ee" />
            </div>
            <div className="text-2xl font-bold text-white">1,240</div>
            <div className="text-sm text-slate-400">Documents Indexed</div>
          </div>
        </div>

        {/* Recent Workspaces */}
        <div className="col-span-12 lg:col-span-6 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers size={20} className="text-blue-400" />
              Recent Workspaces
            </h3>
            <Link to={paths.home()} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_WORKSPACES.map((workspace, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{workspace.icon}</span>
                  <div>
                    <div className="text-white font-medium group-hover:text-blue-400 transition-colors">
                      {workspace.name}
                    </div>
                    <div className="text-xs text-slate-500">{workspace.documents} documents</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={14} />
                  {workspace.lastActive}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-span-12 lg:col-span-6 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={20} className="text-green-400" />
              Activity Feed
            </h3>
            <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <StatusDot status="online" />
              Live
            </span>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {ACTIVITY_FEED.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-slate-800 shrink-0">
                  <ActivityIcon type={item.type} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-sm text-white truncate font-medium">{item.action}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Custom scrollbar style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
