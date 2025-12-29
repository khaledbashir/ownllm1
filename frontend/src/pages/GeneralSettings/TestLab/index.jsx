import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import {
  Flask,
  Slideshow,
  FileText,
  ChartBar,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import BlockSuiteEditor from "@/components/WorkspaceChat/ThreadNotes/BlockSuiteEditor";
import ChatContainer from "@/components/WorkspaceChat/ChatContainer";
import { DnDFileUploaderProvider } from "@/components/WorkspaceChat/ChatContainer/DnDWrapper";
import { TTSProvider } from "@/components/contexts/TTSProvider";
import Workspace from "@/models/workspace";
import WorkspaceThread from "@/models/workspaceThread";

// Mode definitions
const MODES = [
  /*
  {
    id: "slides",
    label: "Slides",
    icon: Slideshow,
    description: "Presentations & decks",
  },
  */
  {
    id: "docs",
    label: "Docs",
    icon: FileText,
    description: "Documents & reports",
  },
  /*
  {
    id: "data",
    label: "Data",
    icon: ChartBar,
    description: "Charts & dashboards",
  },
  {
    id: "research",
    label: "Research",
    icon: MagnifyingGlass,
    description: "Search & analysis",
  },
  */
];

export default function TheLab() {
  const [mode, setMode] = useState("docs");
  const [labWorkspace, setLabWorkspace] = useState(null);
  const [labThread, setLabThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const editorRef = useRef(null);

  // Fetch or create the "lab" workspace on mount
  useEffect(() => {
    async function initLabWorkspace() {
      setLoading(true);
      try {
        // Try to get the lab workspace
        let workspace = await Workspace.bySlug("lab");

        if (!workspace) {
          // Create it if it doesn't exist
          const { workspace: newWorkspace, message } = await Workspace.new({
            name: "Lab",
            openAiTemp: 0.7,
          });

          if (newWorkspace) {
            workspace = newWorkspace;
          } else {
            console.error("Failed to create lab workspace:", message);
          }
        }

        // Always update the system prompt to ensure it has the latest tool definitions
        if (workspace) {
          const SYSTEM_PROMPT = `You are The Lab AI, a capable assistant with direct programmatic control over the document editor.
You can read, write, and modify the document using specific JSON tool calls.

Available Tools:
1. insert_block(type: string, text: string, parentId?: string, props?: object)
   - type: "affine:paragraph" (default), "affine:list", "affine:code"
   - text: Content of the block
   - parentId: Optional ID of parent block
   - props: Optional attributes. Examples:
     - Headings: type="affine:paragraph", props={ "type": "h1" } (or h2-h6)
     - Quote: type="affine:paragraph", props={ "type": "quote" }
     - Lists: type="affine:list", props={ "type": "bulleted" } (or "numbered", "todo")

2. update_block(id: string, text: string)
   - id: Block ID to update
   - text: New content

3. delete_block(id: string)

4. get_selection()
   - Returns current user selection (use this to contextually edit)
   - Returns { type: 'text', from, to, blockId } or { type: 'block', blockIds }

5. get_document_structure()
   - Returns full JSON tree of document

6. insert_database(title: string, columns: array, rows: array)
   - Creates a Kanban/Table database
   - columns: [{ name: "Status", type: "select", options: ["Todo", "Done"] }]
   - rows: [{ "Task": "My Task", "Status": "Todo" }] (First key is title)

To use a tool, output a JSON block like this:
\`\`\`json
{
  "tool": "insert_block",
  "args": {
    "type": "affine:paragraph",
    "text": "Hello from AI"
  }
}
\`\`\`
Do not provide explanation before the tool call if you are just performing an action.`;

          await Workspace.update(workspace.slug, {
            openAiPrompt: SYSTEM_PROMPT
          });
        }

        if (workspace) {
          setLabWorkspace(workspace);

          // Ensure a thread exists for the lab
          let { threads } = await WorkspaceThread.all(workspace.slug);
          let activeThread = threads[0];

          if (!activeThread) {
            const { thread, error } = await WorkspaceThread.new(workspace.slug);
            if (thread) activeThread = thread;
            else console.error("Failed to create lab thread:", error);
          }

          setLabThread(activeThread);

          // Fetch chat history if thread exists
          if (activeThread) {
            const history = await WorkspaceThread.chatHistory(workspace.slug, activeThread.slug);
            setChatHistory(history);
          }
        }
      } catch (error) {
        console.error("Error initializing lab workspace:", error);
      } finally {
        setLoading(false);
      }
    }

    initLabWorkspace();
  }, []);

  // Render canvas based on mode
  const renderCanvas = () => {
    switch (mode) {
      case "docs":
        return (
          <BlockSuiteEditor
            ref={editorRef}
            onSave={() => { }}
            workspaceSlug="lab"
            threadSlug={labThread?.slug}
          />
        );
      case "slides":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <Slideshow size={48} className="mb-4" />
            <p className="text-sm">Slides preview coming soon</p>
            <p className="text-xs mt-1 text-white/20">
              Slidev integration pending
            </p>
          </div>
        );
      case "data":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <ChartBar size={48} className="mb-4" />
            <p className="text-sm">Charts & Data coming soon</p>
            <p className="text-xs mt-1 text-white/20">
              Recharts integration pending
            </p>
          </div>
        );
      case "research":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <MagnifyingGlass size={48} className="mb-4" />
            <p className="text-sm">Research mode coming soon</p>
            <p className="text-xs mt-1 text-white/20">
              Web search integration pending
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full flex flex-col overflow-hidden"
      >
        {/* Header with Mode Selector */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
              <Flask size={20} className="text-white/70" weight="fill" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-white">The Lab</h1>
              <p className="text-xs text-white/40">Generate anything with AI</p>
            </div>
          </div>

          {/* Mode Pills */}
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                    ? "bg-white text-black"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Full Chat Container with all features */}
          <div className="w-[500px] flex flex-col min-w-0 border-r border-white/5">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/40 text-sm">Loading workspace...</p>
              </div>
            ) : labWorkspace ? (
              <TTSProvider>
                <DnDFileUploaderProvider workspace={labWorkspace}>
                  <ChatContainer
                    workspace={labWorkspace}
                    knownHistory={chatHistory}
                    externalEditorRef={editorRef}
                    threadSlug={labThread?.slug}
                  />
                </DnDFileUploaderProvider>
              </TTSProvider>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <p className="text-white/40 text-sm text-center">
                  Failed to load workspace.
                  <br />
                  Try refreshing the page.
                </p>
              </div>
            )}
          </div>

          {/* Right: Dynamic Canvas */}
          <div className="flex-1 flex flex-col bg-white/[0.02]">
            {renderCanvas()}
          </div>
        </div>
      </div>
    </div>
  );
}
