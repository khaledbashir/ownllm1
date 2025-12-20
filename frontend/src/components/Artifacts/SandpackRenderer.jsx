import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import {
  FloppyDisk,
  Code,
  Eye,
  ArrowsOut,
  X,
  Check,
  FileArrowUp,
} from "@phosphor-icons/react";
import Artifacts from "../../models/artifacts";
import showToast from "@/utils/toast";
import { useEditorContext } from "@/components/WorkspaceChat/ThreadNotes/EditorContext";

export default function SandpackRenderer({ code, language, workspace }) {
  const isReact = language === "react";
  const isStatic = language === "html";
  const supported = isReact || isStatic;
  const template = isReact ? "react" : "static";
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [artifactName, setArtifactName] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("preview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const splitPct = 52;

  // Get editor context for inserting into Doc editor
  const editorContext = useEditorContext();

  const handleSave = async () => {
    if (!artifactName) {
      showToast("Please enter a name for the artifact", "error");
      return;
    }

    const workspaceSlug = workspace?.slug;
    if (!workspaceSlug) {
      showToast("Could not identify workspace. Please try again.", "error");
      console.error("Workspace object:", workspace);
      return;
    }

    setLoading(true);

    const response = await Artifacts.save(workspaceSlug, {
      name: artifactName,
      code,
      language,
    });

    setLoading(false);
    if (response.success) {
      setShowSaveModal(false);
      setArtifactName("");
      showToast("Artifact saved to library!", "success");
    } else {
      showToast(
        "Failed to save: " + (response.error || "Unknown error"),
        "error"
      );
    }
  };

  const handleInsertToEditor = () => {
    if (!editorContext || !editorContext.isReady()) {
      showToast(
        "Doc editor is not active. Please open the Doc tab first.",
        "warning"
      );
      return;
    }

    try {
      // Determine the language for the code block
      const codeLanguage = isReact ? "javascript" : "html";

      // Insert the code as a code block
      editorContext.injectCode(code, codeLanguage);

      showToast("Code inserted into Doc editor!", "success");
    } catch (error) {
      console.error("Failed to insert code:", error);
      showToast("Failed to insert code: " + error.message, "error");
    }
  };

  const shellClass = isFullscreen
    ? "fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm p-4"
    : "my-4";

  const frameClass = isFullscreen
    ? "h-[calc(100vh-2rem)] rounded-xl overflow-hidden border border-theme-border bg-theme-bg-secondary shadow-2xl"
    : "h-[520px] rounded-xl overflow-hidden border border-theme-border bg-theme-bg-secondary shadow-xl";

  const primaryFile = isReact ? "/App.js" : "/index.html";

  const sandpackTheme = useMemo(
    () => ({
      colors: {
        surface1: "var(--theme-bg-secondary)",
        surface2: "var(--theme-bg-primary)",
        surface3: "rgba(255,255,255,0.06)",
        clickable: "rgba(255,255,255,0.55)",
        base: "var(--theme-text-primary)",
        disabled: "rgba(255,255,255,0.35)",
        hover: "rgba(255,255,255,0.8)",
        accent: "#60a5fa",
        error: "#ef4444",
        errorSurface: "rgba(239,68,68,0.18)",
      },
      syntax: {
        plain: "rgba(255,255,255,0.92)",
        comment: { color: "rgba(255,255,255,0.35)", fontStyle: "italic" },
        keyword: "#60a5fa",
        tag: "#f472b6",
        punctuation: "rgba(255,255,255,0.55)",
        definition: "#a78bfa",
        property: "#93c5fd",
        static: "#f59e0b",
        string: "#34d399",
      },
      font: {
        body: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        size: "13px",
        lineHeight: "20px",
      },
    }),
    []
  );

  const segmentedButtonClass = (active) =>
    `px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${active
      ? "bg-white/10 text-theme-text-primary border-white/10"
      : "bg-transparent text-theme-text-secondary border-transparent hover:text-theme-text-primary hover:bg-white/5"
    }`;

  const actionButtonClass =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-theme-text-primary transition-colors";

  if (!supported) {
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-theme-border bg-theme-bg-secondary p-4">
        <div className="text-sm text-theme-text-primary">
          Preview not available
        </div>
        <div className="text-xs text-theme-text-secondary mt-1">
          Sandpack preview supports <span className="font-mono">react</span> and{" "}
          <span className="font-mono">html</span> blocks.
        </div>
      </div>
    );
  }

  if (typeof code === "string" && code.length > 120_000) {
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-theme-border bg-theme-bg-secondary p-4">
        <div className="text-sm text-theme-text-primary">Preview skipped</div>
        <div className="text-xs text-theme-text-secondary mt-1">
          Code is too large to safely render in Sandpack.
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className={frameClass}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-3 py-2 border-b border-theme-border bg-theme-bg-secondary/80">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-theme-bg-primary border border-white/10 flex items-center justify-center">
                {viewMode === "preview" ? (
                  <Eye size={16} className="text-theme-text-secondary" />
                ) : (
                  <Code size={16} className="text-theme-text-secondary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-theme-text-primary truncate">
                  Live Sandbox
                </div>
                <div className="text-[11px] text-theme-text-secondary truncate">
                  {primaryFile}
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={segmentedButtonClass(viewMode === "split")}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className={segmentedButtonClass(viewMode === "code")}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={segmentedButtonClass(viewMode === "preview")}
              >
                Preview
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setViewMode((v) => (v === "preview" ? "code" : "preview"))
                }
                className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-theme-text-primary transition-colors"
                title={viewMode === "preview" ? "Show code" : "Show preview"}
              >
                {viewMode === "preview" ? (
                  <Code size={14} />
                ) : (
                  <Eye size={14} />
                )}
                {viewMode === "preview" ? "Code" : "Preview"}
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={actionButtonClass}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <X size={14} /> : <ArrowsOut size={14} />}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </button>

              <button
                type="button"
                onClick={handleInsertToEditor}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                title="Insert code into Doc editor"
              >
                <FileArrowUp size={14} />
                Insert
              </button>

              {workspace && (
                <button
                  type="button"
                  onClick={() => setShowSaveModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  <FloppyDisk size={14} />
                  Save
                </button>
              )}
            </div>
          </div>

          {/* Save Modal */}
          {showSaveModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-theme-bg-secondary p-6 rounded-xl shadow-2xl w-[400px] border border-theme-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <FloppyDisk size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-theme-text-primary">
                      Save to Artifacts
                    </h3>
                    <p className="text-xs text-theme-text-secondary">
                      Save this code to your library
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Artifact Name (e.g. Landing Page V1)"
                  value={artifactName}
                  onChange={(e) => setArtifactName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-theme-bg-primary text-theme-text-primary border border-theme-border mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-theme-text-secondary/50"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-primary rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || !artifactName}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sandpack */}
          <SandpackProvider
            template={template}
            theme={sandpackTheme}
            files={{
              [primaryFile]: code,
            }}
            options={{
              activeFile: primaryFile,
              visibleFiles: [primaryFile],
              editorWidthPercentage:
                viewMode === "preview"
                  ? 0
                  : viewMode === "code"
                    ? 100
                    : splitPct,
              editorHeight: "100%",
            }}
            customSetup={{
              dependencies: {
                recharts: "2.12.7",
                clsx: "2.1.1",
                "tailwind-merge": "1.14.0",
              },
            }}
          >
            <div className="flex-1 min-h-0 [&_.sp-wrapper]:h-full [&_.sp-layout]:h-full [&_.sp-layout]:min-h-0 [&_.sp-preview-container]:h-full [&_.sp-preview-container]:min-h-0 [&_.sp-preview-container]:flex [&_.sp-preview-container]:flex-col [&_.sp-preview]:h-full [&_.sp-preview]:min-h-0 [&_.sp-code-editor]:h-full [&_.sp-code-editor]:min-h-0 [&_.sp-stack]:h-full [&_.sp-stack]:min-h-0">
              <SandpackLayout style={{ height: "100%" }}>
                <SandpackCodeEditor
                  showTabs={false}
                  showLineNumbers={true}
                  showInlineErrors={true}
                  wrapContent={true}
                  style={{
                    height: "100%",
                    display: viewMode === "preview" ? "none" : "block",
                  }}
                />
                <SandpackPreview
                  showNavigator={false}
                  showRefreshButton={true}
                  showOpenInCodeSandbox={false}
                  style={{
                    height: "100%",
                    display: viewMode === "code" ? "none" : "block",
                  }}
                />
              </SandpackLayout>
            </div>
          </SandpackProvider>
        </div>
      </div>
    </div>
  );
}
