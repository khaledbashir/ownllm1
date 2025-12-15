import React, { useEffect, useRef, useState } from "react";
import { AffineEditorContainer } from "@blocksuite/presets";
import { Schema, DocCollection, Text, Job } from "@blocksuite/store";
import { AffineSchemas } from "@blocksuite/blocks";
import "@blocksuite/presets/themes/affine.css";
import { HeaderBlockSchema } from "./custom-blocks/header-block";
import { FooterBlockSchema } from "./custom-blocks/footer-block";

export default function LetterheadEditor() {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const initEditor = async () => {
            try {
                // Register standard Affine blocks + our Custom Blocks
                const schema = new Schema()
                    .register(AffineSchemas)
                    .register([HeaderBlockSchema, FooterBlockSchema]);

                const collection = new DocCollection({ schema });
                collection.meta.initialize();

                // Create a new document
                const doc = collection.createDoc({ id: "letterhead-template" });

                // CRITICAL: Call load() with no arguments first
                doc.load();

                // Now add the block structure AFTER load()
                // Root: Page Block
                const pageId = doc.addBlock("affine:page", {});

                // Surface (Canvas layer, usually required by Affine Editor)
                doc.addBlock("affine:surface", {}, pageId);

                // 1. Header Block (Locked/Static view)
                doc.addBlock("custom:header", {}, pageId);

                // 2. Note Block (Editable Content Area)
                const noteId = doc.addBlock("affine:note", {}, pageId);
                doc.addBlock("affine:paragraph", {
                    text: new Text("Type your letter content here...")
                }, noteId);

                // 3. Footer Block (Locked/Static view)
                doc.addBlock("custom:footer", {}, pageId);

                // Mount Editor
                const editor = new AffineEditorContainer();
                editor.doc = doc;

                // Clear and mount
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
        <div className="w-full h-full flex flex-col">
            {!isReady && (
                <div className="flex items-center justify-center h-64 text-slate-400">
                    Initializing Template Editor...
                </div>
            )}
            {/* Editor Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm border border-gray-200"
                style={{
                    // Basic styling to ensure visibility
                    minHeight: "500px",
                    padding: "20px"
                }}
            />
        </div>
    );
}
