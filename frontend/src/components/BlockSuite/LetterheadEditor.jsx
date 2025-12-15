import React, { useEffect, useRef, useState } from "react";
import { AffineEditorContainer } from "@blocksuite/presets";
import { Schema, DocCollection, Text } from "@blocksuite/store";
import { AffineSchemas } from "@blocksuite/blocks";
import "@blocksuite/presets/themes/affine.css";

// Static Header Component (NOT a BlockSuite block)
function LetterheadHeader() {
    return (
        <div style={{
            padding: "24px",
            borderBottom: "2px solid #e5e7eb",
            marginBottom: "0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            backgroundColor: "#fff",
            userSelect: "none",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#3b82f6",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                }}>
                    LOGO
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "bold", fontSize: "18px", color: "#111827" }}>Company Name</span>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>123 Business Rd, Tech City</span>
                </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "12px", color: "#6b7280" }}>
                <div>{new Date().toLocaleDateString()}</div>
                <div>Ref: TMP-001</div>
            </div>
        </div>
    );
}

// Static Footer Component (NOT a BlockSuite block)
function LetterheadFooter() {
    return (
        <div style={{
            padding: "24px",
            borderTop: "2px solid #e5e7eb",
            marginTop: "0",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "11px",
            width: "100%",
            backgroundColor: "#fff",
            userSelect: "none",
        }}>
            <p style={{ margin: "4px 0" }}>CONFIDENTIALITY NOTICE: The contents of this document are intended for the named addressee only.</p>
            <p style={{ margin: "4px 0" }}>© {new Date().getFullYear()} Company Name. All rights reserved.</p>
        </div>
    );
}

export default function LetterheadEditor() {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const initEditor = async () => {
            try {
                // Use ONLY standard Affine schemas - no custom blocks
                const schema = new Schema().register(AffineSchemas);

                const collection = new DocCollection({ schema });
                collection.meta.initialize();

                // Create a new document
                const doc = collection.createDoc({ id: "letterhead-template" });

                // Load empty doc first
                doc.load();

                // Build document structure with standard blocks only
                const pageId = doc.addBlock("affine:page", {});
                doc.addBlock("affine:surface", {}, pageId);

                // Note block for editable content
                const noteId = doc.addBlock("affine:note", {}, pageId);
                doc.addBlock("affine:paragraph", {
                    text: new Text("Type your letter content here...")
                }, noteId);

                // Mount Editor
                const editor = new AffineEditorContainer();
                editor.doc = doc;

                containerRef.current.innerHTML = "";
                containerRef.current.appendChild(editor);

                editorRef.current = editor;
                setIsReady(true);

            } catch (error) {
                console.error("Failed to initialize Letterhead Editor:", error);
            }
        };

        initEditor();

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Static Header - OUTSIDE BlockSuite */}
            <LetterheadHeader />

            {/* Loading State */}
            {!isReady && (
                <div className="flex items-center justify-center h-64 text-slate-400">
                    Initializing Template Editor...
                </div>
            )}

            {/* BlockSuite Editor Container - Only the editable middle section */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto"
                style={{
                    minHeight: "300px",
                    padding: "20px",
                    backgroundColor: "#fff",
                }}
            />

            {/* Static Footer - OUTSIDE BlockSuite */}
            <LetterheadFooter />
        </div>
    );
}
