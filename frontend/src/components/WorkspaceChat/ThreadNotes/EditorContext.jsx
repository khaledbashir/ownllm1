import React, { createContext, useContext, useRef, useCallback } from "react";

/**
 * BlockSuite Editor Context
 * 
 * Provides global access to the BlockSuite editor instance for programmatic
 * content injection from anywhere in the app (AI Sidebar, Smart Actions, etc.)
 */

const EditorContext = createContext(null);

/**
 * EditorProvider - Wrap your app/component tree with this
 * to enable programmatic editor access
 */
export function EditorProvider({ children }) {
    const editorRef = useRef(null);
    const docRef = useRef(null);

    // Register the editor (called by BlockSuiteEditor on mount)
    const registerEditor = useCallback((editor) => {
        editorRef.current = editor;
        docRef.current = editor?.doc || null;
    }, []);

    // Unregister the editor (called on unmount)
    const unregisterEditor = useCallback(() => {
        editorRef.current = null;
        docRef.current = null;
    }, []);

    // Get the current editor instance
    const getEditor = useCallback(() => editorRef.current, []);

    // Get the current doc
    const getDoc = useCallback(() => docRef.current, []);

    // Check if editor is ready
    const isReady = useCallback(() => !!editorRef.current && !!docRef.current, []);

    // ========================================
    // INJECTION HELPERS - THE GOD HAND
    // ========================================

    /**
     * Get the note block (main content container)
     */
    const getNoteBlock = useCallback(() => {
        const doc = docRef.current;
        if (!doc) return null;
        const noteBlocks = doc.getBlocksByFlavour("affine:note");
        return noteBlocks[0] || null;
    }, []);

    /**
     * Inject a paragraph block
     * @param {string} text - The text content
     */
    const injectParagraph = useCallback((text) => {
        const doc = docRef.current;
        const noteBlock = getNoteBlock();
        if (!doc || !noteBlock) {
            console.warn("[EditorContext] Cannot inject: editor not ready");
            return null;
        }
        return doc.addBlock("affine:paragraph", { type: "text", text: text || "" }, noteBlock.id);
    }, [getNoteBlock]);

    /**
     * Inject a heading block
     * @param {1|2|3|4|5|6} level - Heading level
     * @param {string} text - The heading text
     */
    const injectHeading = useCallback((level, text) => {
        const doc = docRef.current;
        const noteBlock = getNoteBlock();
        if (!doc || !noteBlock) {
            console.warn("[EditorContext] Cannot inject: editor not ready");
            return null;
        }
        const type = `h${Math.min(Math.max(level, 1), 6)}`;
        return doc.addBlock("affine:paragraph", { type, text: text || "" }, noteBlock.id);
    }, [getNoteBlock]);

    /**
     * Inject a divider
     */
    const injectDivider = useCallback(() => {
        const doc = docRef.current;
        const noteBlock = getNoteBlock();
        if (!doc || !noteBlock) return null;
        return doc.addBlock("affine:divider", {}, noteBlock.id);
    }, [getNoteBlock]);

    /**
     * Inject a code block
     * @param {string} code - The code content
     * @param {string} language - Language for syntax highlighting
     */
    const injectCode = useCallback((code, language = "javascript") => {
        const doc = docRef.current;
        const noteBlock = getNoteBlock();
        if (!doc || !noteBlock) return null;
        return doc.addBlock("affine:code", { language, text: code || "" }, noteBlock.id);
    }, [getNoteBlock]);

    /**
     * Inject a list item
     * @param {string} text - List item text
     * @param {"bulleted"|"numbered"|"todo"} type - List type
     */
    const injectListItem = useCallback((text, type = "bulleted") => {
        const doc = docRef.current;
        const noteBlock = getNoteBlock();
        if (!doc || !noteBlock) return null;
        return doc.addBlock("affine:list", { type, text: text || "" }, noteBlock.id);
    }, [getNoteBlock]);

    /**
     * Inject a quote block
     * @param {string} text - Quote text
     */
    const injectQuote = useCallback((text) => {
        const doc = docRef.current;
        const noteBlock = getNoteBlock();
        if (!doc || !noteBlock) return null;
        return doc.addBlock("affine:paragraph", { type: "quote", text: text || "" }, noteBlock.id);
    }, [getNoteBlock]);

    /**
     * Inject multiple blocks at once from structured data
     * @param {Array} blocks - Array of block definitions
     * 
     * Example:
     * injectBlocks([
     *   { type: "heading", level: 2, text: "Meeting Notes" },
     *   { type: "paragraph", text: "Attendees: Alice, Bob" },
     *   { type: "divider" },
     *   { type: "list", items: ["Action 1", "Action 2"] }
     * ])
     */
    const injectBlocks = useCallback((blocks) => {
        if (!Array.isArray(blocks)) return;

        const results = [];
        for (const block of blocks) {
            let result = null;
            switch (block.type) {
                case "heading":
                    result = injectHeading(block.level || 2, block.text);
                    break;
                case "paragraph":
                    result = injectParagraph(block.text);
                    break;
                case "divider":
                    result = injectDivider();
                    break;
                case "code":
                    result = injectCode(block.code || block.text, block.language);
                    break;
                case "list":
                    if (Array.isArray(block.items)) {
                        for (const item of block.items) {
                            results.push(injectListItem(item, block.listType || "bulleted"));
                        }
                    }
                    break;
                case "quote":
                    result = injectQuote(block.text);
                    break;
                default:
                    result = injectParagraph(block.text || "");
            }
            if (result) results.push(result);
        }
        return results;
    }, [injectHeading, injectParagraph, injectDivider, injectCode, injectListItem, injectQuote]);

    /**
     * Inject a formatted meeting notes template
     * @param {Object} data - Meeting data
     */
    const injectMeetingNotes = useCallback((data = {}) => {
        const {
            title = "Meeting Notes",
            date = new Date().toLocaleDateString(),
            attendees = [],
            agenda = [],
            notes = "",
            actionItems = []
        } = data;

        const blocks = [
            { type: "heading", level: 1, text: title },
            { type: "paragraph", text: `📅 Date: ${date}` },
            { type: "paragraph", text: `👥 Attendees: ${attendees.join(", ") || "TBD"}` },
            { type: "divider" },
            { type: "heading", level: 2, text: "📋 Agenda" },
            ...(agenda.length > 0
                ? [{ type: "list", items: agenda, listType: "numbered" }]
                : [{ type: "paragraph", text: "• Add agenda items here" }]
            ),
            { type: "divider" },
            { type: "heading", level: 2, text: "📝 Notes" },
            { type: "paragraph", text: notes || "Add meeting notes here..." },
            { type: "divider" },
            { type: "heading", level: 2, text: "✅ Action Items" },
            ...(actionItems.length > 0
                ? [{ type: "list", items: actionItems, listType: "bulleted" }]
                : [{ type: "paragraph", text: "• Add action items here" }]
            ),
        ];

        return injectBlocks(blocks);
    }, [injectBlocks]);

    /**
     * Inject a proposal/quote template
     * @param {Object} data - Proposal data
     */
    const injectProposal = useCallback((data = {}) => {
        const {
            title = "Project Proposal",
            client = "Client Name",
            date = new Date().toLocaleDateString(),
            summary = "",
            scope = [],
            timeline = "",
            pricing = [],
            total = 0,
            terms = ""
        } = data;

        const blocks = [
            { type: "heading", level: 1, text: title },
            { type: "paragraph", text: `📋 Prepared for: ${client}` },
            { type: "paragraph", text: `📅 Date: ${date}` },
            { type: "divider" },
            { type: "heading", level: 2, text: "Executive Summary" },
            { type: "paragraph", text: summary || "Brief description of the project..." },
            { type: "divider" },
            { type: "heading", level: 2, text: "Scope of Work" },
            ...(scope.length > 0
                ? [{ type: "list", items: scope, listType: "numbered" }]
                : [{ type: "paragraph", text: "• Define scope items here" }]
            ),
            { type: "divider" },
            { type: "heading", level: 2, text: "Timeline" },
            { type: "paragraph", text: timeline || "Project timeline details..." },
            { type: "divider" },
            { type: "heading", level: 2, text: "💰 Pricing" },
            ...(pricing.length > 0
                ? pricing.map(item => ({
                    type: "paragraph",
                    text: `• ${item.name}: $${item.price.toLocaleString()}`
                }))
                : [{ type: "paragraph", text: "• Item 1: $X,XXX" }]
            ),
            { type: "paragraph", text: `**TOTAL: $${total.toLocaleString()}**` },
            { type: "divider" },
            { type: "heading", level: 2, text: "Terms & Conditions" },
            { type: "paragraph", text: terms || "Payment terms, conditions, etc." },
        ];

        return injectBlocks(blocks);
    }, [injectBlocks]);

    /**
     * Inject a quick quote/estimate
     * @param {Object} data - Quote data
     */
    const injectQuickQuote = useCallback((data = {}) => {
        const {
            title = "Quick Quote",
            items = [],
            discount = 0,
            notes = ""
        } = data;

        const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
        const discountAmount = subtotal * (discount / 100);
        const total = subtotal - discountAmount;

        const blocks = [
            { type: "heading", level: 2, text: `💵 ${title}` },
            { type: "divider" },
            ...(items.length > 0
                ? items.map(item => ({
                    type: "paragraph",
                    text: `• ${item.name}: $${(item.price || 0).toLocaleString()}`
                }))
                : [{ type: "paragraph", text: "• Add items here" }]
            ),
            { type: "divider" },
            { type: "paragraph", text: `Subtotal: $${subtotal.toLocaleString()}` },
            ...(discount > 0 ? [{ type: "paragraph", text: `Discount (${discount}%): -$${discountAmount.toLocaleString()}` }] : []),
            { type: "paragraph", text: `**TOTAL: $${total.toLocaleString()}**` },
            ...(notes ? [{ type: "paragraph", text: `📝 Notes: ${notes}` }] : []),
        ];

        return injectBlocks(blocks);
    }, [injectBlocks]);

    const value = {
        // Core
        registerEditor,
        unregisterEditor,
        getEditor,
        getDoc,
        isReady,
        // Basic injection
        injectParagraph,
        injectHeading,
        injectDivider,
        injectCode,
        injectListItem,
        injectQuote,
        injectBlocks,
        // Template injection
        injectMeetingNotes,
        injectProposal,
        injectQuickQuote,
    };

    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
}

/**
 * Hook to access the editor context
 * @returns {Object} Editor context with injection methods
 */
export function useEditorContext() {
    const context = useContext(EditorContext);
    if (!context) {
        console.warn("[useEditorContext] Must be used within an EditorProvider");
        return null;
    }
    return context;
}

export default EditorContext;
