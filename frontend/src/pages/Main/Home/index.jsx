import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Database,
  Activity,
  FileText,
  Globe,
  MessageSquare,
  Clock,
  Zap,
  FolderOpen,
  Wand2,
  Command,
  TerminalSquare,
  Layers
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
function MiniSparkline({ data, color = "#9ca3af" }) { // Default to neutral gray
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
    <svg width={width} height={height} className="opacity-50">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
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
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`}></span>
    </span>
  );
}

// Activity icon based on type
function ActivityIcon({ type }) {
  const icons = {
    create: <Sparkles size={14} className="text-theme-text-secondary" />,
    embed: <FileText size={14} className="text-theme-text-secondary" />,
    search: <Globe size={14} className="text-theme-text-secondary" />,
    workspace: <FolderOpen size={14} className="text-theme-text-secondary" />,
    flow: <Zap size={14} className="text-theme-text-secondary" />,
    sync: <Database size={14} className="text-theme-text-secondary" />,
  };
  return icons[type] || <Activity size={14} className="text-theme-text-secondary" />;
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
    <div className="w-full h-full overflow-y-auto bg-theme-bg-container p-6 lg:p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-theme-text-primary tracking-tight">
            {greeting}, <span className="text-theme-text-secondary">{username}</span>
          </h1>
          <p className="text-theme-text-secondary text-sm mt-1">System operational.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-theme-border bg-theme-bg-secondary">
            <StatusDot status="online" />
            <span className="text-xs font-medium text-theme-text-secondary">System Online</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Hero Card - App Builder */}
        <div className="col-span-12 lg:col-span-8">
          <div className="h-full p-6 lg:p-8 rounded-xl bg-theme-bg-secondary border border-theme-border flex flex-col justify-between group hover:border-theme-text-secondary/20 transition-colors duration-200">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-theme-bg-primary border border-theme-border">
                  <Wand2 size={24} className="text-theme-text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-theme-text-primary mb-2">
                Custom AI Agents
              </h2>
              <p className="text-theme-text-secondary text-sm leading-relaxed max-w-xl">
                Configure autonomous agents to handle complex workflows. Define triggers, actions, and decision logic using the visual builder.
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to={paths.agents.builder()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-theme-text-primary text-theme-bg-primary font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <Sparkles size={16} />
                Build Agent Flow
              </Link>
              <button
                onClick={chatWithAgent}
                className="px-4 py-2 rounded-lg border border-theme-border text-theme-text-primary text-sm font-medium hover:bg-theme-bg-primary transition-colors"
              >
                Chat with Agent
              </button>
            </div>
          </div>
        </div>

        {/* Knowledge Base Stat */}
        <div className="col-span-12 lg:col-span-4">
          <div className="h-full p-6 rounded-xl bg-theme-bg-secondary border border-theme-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-theme-bg-primary border border-theme-border">
                  <Database size={20} className="text-theme-text-secondary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-theme-text-primary tracking-tight">1,240</div>
              <div className="text-sm text-theme-text-secondary">Indexed Documents</div>
            </div>
            <div className="mt-4">
              <MiniSparkline data={SPARKLINE_DATA} color="var(--theme-text-secondary)" />
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Slash Commands */}
          <button
            onClick={setSlashCommand}
            className="col-span-1 p-5 rounded-xl bg-theme-bg-secondary border border-theme-border hover:border-theme-text-secondary/30 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Command size={20} className="text-theme-text-secondary group-hover:text-theme-text-primary transition-colors" />
              <h3 className="font-semibold text-theme-text-primary text-sm">Slash Commands</h3>
            </div>
            <p className="text-xs text-theme-text-secondary">Inject pre-defined prompts and context.</p>
          </button>

          {/* System Prompts */}
          <button
            onClick={setSystemPrompt}
            className="col-span-1 p-5 rounded-xl bg-theme-bg-secondary border border-theme-border hover:border-theme-text-secondary/30 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <TerminalSquare size={20} className="text-theme-text-secondary group-hover:text-theme-text-primary transition-colors" />
              <h3 className="font-semibold text-theme-text-primary text-sm">System Prompts</h3>
            </div>
            <p className="text-xs text-theme-text-secondary">Configure base AI persona and behavior.</p>
          </button>

          {/* Live Chat */}
          <Link
            to={paths.home()}
            className="col-span-1 p-5 rounded-xl bg-theme-bg-secondary border border-theme-border hover:border-theme-text-secondary/30 transition-all duration-200 text-left group block"
          >
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare size={20} className="text-theme-text-secondary group-hover:text-theme-text-primary transition-colors" />
              <h3 className="font-semibold text-theme-text-primary text-sm">Live Chat</h3>
            </div>
            <p className="text-xs text-theme-text-secondary">Start a new conversation thread.</p>
          </Link>
        </div>

        {/* Bottom Row: Recent & Activity */}
        <div className="col-span-12 lg:col-span-6 p-6 rounded-xl bg-theme-bg-secondary border border-theme-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-theme-text-primary flex items-center gap-2">
              <Layers size={16} className="text-theme-text-secondary" />
              Recent Workspaces
            </h3>
          </div>
          <div className="space-y-2">
            {RECENT_WORKSPACES.map((workspace, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-theme-bg-primary transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg opacity-80">{workspace.icon}</span>
                  <div>
                    <div className="text-sm text-theme-text-primary font-medium">
                      {workspace.name}
                    </div>
                    <div className="text-[10px] text-theme-text-secondary">{workspace.documents} docs</div>
                  </div>
                </div>
                <div className="text-[10px] text-theme-text-secondary">
                  {workspace.lastActive}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 p-6 rounded-xl bg-theme-bg-secondary border border-theme-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-theme-text-primary flex items-center gap-2">
              <Activity size={16} className="text-theme-text-secondary" />
              System Activity
            </h3>
          </div>
          <div className="space-y-3 max-h-[240px] overflow-y-auto custom-scrollbar">
            {ACTIVITY_FEED.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2"
              >
                <div className="mt-0.5">
                  <ActivityIcon type={item.type} />
                </div>
                <div>
                  <div className="text-xs text-theme-text-primary">{item.action}</div>
                  <div className="text-[10px] text-theme-text-secondary mt-0.5">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
