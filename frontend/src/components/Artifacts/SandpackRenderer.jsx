import React, { useState } from 'react';
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react';
import { FloppyDisk, Code, Eye, ArrowsOut, X, Check, Warning } from "@phosphor-icons/react";
import Artifacts from '../../models/artifacts';
import showToast from "@/utils/toast";

export default function SandpackRenderer({ code, language, workspace }) {
    const isReact = language === 'react';
    const isStatic = language === 'html';
    const supported = isReact || isStatic;
    const template = isReact ? 'react' : 'static';
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [artifactName, setArtifactName] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCode, setShowCode] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

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
            showToast("Failed to save: " + (response.error || "Unknown error"), "error");
        }
    };

    const containerClass = isFullscreen
        ? "fixed inset-0 z-[200] bg-theme-bg-primary p-4"
        : "my-4 rounded-lg overflow-hidden border border-theme-border relative group";

    if (!supported) {
        return (
            <div className="my-4 rounded-lg overflow-hidden border border-theme-border bg-theme-bg-secondary p-4">
                <div className="text-sm text-theme-text-primary">Preview not available</div>
                <div className="text-xs text-theme-text-secondary mt-1">
                    Sandpack preview supports <span className="font-mono">react</span> and <span className="font-mono">html</span> blocks.
                </div>
            </div>
        );
    }

    if (typeof code === 'string' && code.length > 120_000) {
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
        <div className={containerClass}>
            {/* Control Bar */}
            <div className="absolute top-2 right-2 z-50 flex gap-2">
                {/* Toggle Code Button */}
                <button
                    onClick={() => setShowCode(!showCode)}
                    className="flex items-center gap-1 bg-theme-bg-secondary hover:bg-theme-bg-primary text-theme-text-primary px-2 py-1 rounded text-xs border border-theme-border shadow-sm transition-all"
                    title={showCode ? "Hide Code" : "Show Code"}
                >
                    {showCode ? <Eye size={14} /> : <Code size={14} />}
                    {showCode ? "Preview" : "Code"}
                </button>

                {/* Fullscreen Button */}
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="flex items-center gap-1 bg-theme-bg-secondary hover:bg-theme-bg-primary text-theme-text-primary px-2 py-1 rounded text-xs border border-theme-border shadow-sm transition-all"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? <X size={14} /> : <ArrowsOut size={14} />}
                </button>

                {/* Save Button */}
                {workspace && (
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs shadow-sm transition-all"
                    >
                        <FloppyDisk size={14} />
                        Save
                    </button>
                )}
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
                                <h3 className="text-lg font-semibold text-theme-text-primary">Save to Artifacts</h3>
                                <p className="text-xs text-theme-text-secondary">Save this code to your library</p>
                            </div>
                        </div>

                        <input
                            type="text"
                            placeholder="Artifact Name (e.g. Landing Page V1)"
                            value={artifactName}
                            onChange={(e) => setArtifactName(e.target.value)}
                            className="w-full p-3 rounded-lg bg-theme-bg-primary text-theme-text-primary border border-theme-border mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-theme-text-secondary/50"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
                theme="dark"
                files={{
                    [isReact ? '/App.js' : '/index.html']: code
                }}
                customSetup={{
                    dependencies: {
                        "recharts": "2.12.7",
                        "clsx": "2.1.1",
                        "tailwind-merge": "1.14.0"
                    }
                }}
            >
                <SandpackLayout>
                    <div className={`flex flex-col w-full ${isFullscreen ? 'h-[calc(100vh-2rem)]' : 'h-[500px]'}`}>
                        <div className="flex h-full">
                            {/* Code Editor - conditionally shown */}
                            {showCode && (
                                <div className="w-1/2 h-full border-r border-theme-border">
                                    <SandpackCodeEditor
                                        showTabs={false}
                                        showLineNumbers={true}
                                        showInlineErrors={true}
                                        wrapContent={true}
                                        style={{ height: '100%' }}
                                    />
                                </div>
                            )}
                            {/* Preview - full width when code hidden */}
                            <div className={`${showCode ? 'w-1/2' : 'w-full'} h-full`}>
                                <SandpackPreview
                                    showNavigator={true}
                                    style={{ height: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}
