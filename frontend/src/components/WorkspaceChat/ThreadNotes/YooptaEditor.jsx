import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import YooptaEditor, { createYooptaEditor } from "@yoopta/editor";
import ActionMenuList, { DefaultActionMenuRender } from "@yoopta/action-menu-list";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";
import LinkTool, { DefaultLinkToolRender } from "@yoopta/link-tool";

import Paragraph from "@yoopta/paragraph";
import Blockquote from "@yoopta/blockquote";
import Callout from "@yoopta/callout";
import Code from "@yoopta/code";
import Divider from "@yoopta/divider";
import Table, { TableCommands } from "@yoopta/table";
import { BulletedList, NumberedList, TodoList } from "@yoopta/lists";
import { HeadingOne, HeadingTwo, HeadingThree } from "@yoopta/headings";
import Link from "@yoopta/link";
import { Bold, Italic, Underline, Strike, Highlight, CodeMark } from "@yoopta/marks";
import { html, markdown, plainText } from "@yoopta/exports";
import MarkdownIt from "markdown-it";

import { FilePdf, CircleNotch } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";
import debounce from "lodash.debounce";
import ExportPdfModal from "./ExportPdfModal";
import "./editor.css";

const PLUGINS = [
  Paragraph,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Divider,
  Link,
  Table.extend({
    events: {
      onBeforeCreate: (editor) => {
        // Provide a good default so creating a table doesn't feel broken
        // (matches the Yoopta demo behaviour)
        return TableCommands.buildTableElements(editor, { rows: 3, columns: 3 });
      },
    },
  }),
];

const MARKS = [Bold, Italic, Underline, Strike, Highlight, CodeMark];

const TOOLS = {
  ActionMenu: {
    tool: ActionMenuList,
    render: DefaultActionMenuRender,
  },
  Toolbar: {
    tool: Toolbar,
    render: DefaultToolbarRender,
  },
  LinkTool: {
    tool: LinkTool,
    render: DefaultLinkToolRender,
  },
};

function parseInitialContent(rawContent) {
  if (rawContent == null) return { kind: "empty" };

  if (typeof rawContent !== "string") {
    return { kind: "text", text: String(rawContent) };
  }

  const trimmed = rawContent.trim();
  if (!trimmed) return { kind: "empty" };

  try {
    const parsed = JSON.parse(trimmed);

    if (parsed && typeof parsed === "object") {
      if (parsed.type === "yoopta" && parsed.value) {
        return { kind: "yoopta", value: parsed.value };
      }

      if (parsed.type === "blocksuite" && typeof parsed.text === "string") {
        return { kind: "text", text: parsed.text };
      }

      // Support legacy "plain string encoded as JSON"
      if (typeof parsed === "string") {
        return { kind: "text", text: parsed };
      }

      // If it looks like a Yoopta value without wrapper
      return { kind: "yoopta", value: parsed };
    }

    return { kind: "text", text: trimmed };
  } catch {
    return { kind: "text", text: rawContent };
  }
}

const YooptaNotesEditor = forwardRef(({ content, onSave, workspaceSlug }, ref) => {
  const containerRef = useRef(null);
  const editor = useMemo(() => createYooptaEditor(), []);
  const markdownIt = useMemo(
    () =>
      new MarkdownIt({
        html: false,
        linkify: true,
        breaks: true,
      }),
    []
  );

  const [value, setValue] = useState(undefined);
  const [isReady, setIsReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const debouncedSave = useMemo(
    () =>
      debounce((nextValue) => {
        onSave(JSON.stringify({ type: "yoopta", value: nextValue }));
      }, 1000),
    [onSave]
  );

  useEffect(() => {
    const init = parseInitialContent(content);

    try {
      if (init.kind === "yoopta") {
        editor.setEditorValue(init.value);
        setValue(init.value);
      } else if (init.kind === "text") {
        const nextValue = plainText.deserialize(editor, init.text);
        editor.setEditorValue(nextValue);
        setValue(nextValue);
      }

      setIsReady(true);
    } catch (e) {
      console.error("Failed to initialize Yoopta content:", e);
      toast.error("Failed to load notes content");
      setIsReady(true);
    }

    return () => {
      debouncedSave.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    insertMarkdown: async (markdownToInsert) => {
      if (!markdownToInsert || typeof markdownToInsert !== "string") return;
      insertMarkdownIntoDocument(markdownToInsert);
    },
    getEditor: () => editor,
  }));

  const looksLikeMarkdown = useCallback((text) => {
    if (typeof text !== "string") return false;
    const t = text.trim();
    if (!t) return false;

    // Heuristics for markdown-ish paste (tables, headings, lists, code fences)
    if (/^#{1,6}\s/m.test(t)) return true;
    if (/^\s*([-*+]\s+|\d+\.\s+)/m.test(t)) return true;
    if (/^```/m.test(t)) return true;
    if (/\|.+\|/m.test(t) && /\n\s*\|?\s*:?[-]{3,}:?\s*\|/m.test(t)) return true; // table
    return false;
  }, []);

  const deserializeFromMarkdown = useCallback(
    (markdownText) => {
      // Prefer HTML deserialization when available because it tends to be more
      // complete for tables/layout (markdown importer is often minimal).
      if (typeof html?.deserialize === "function") {
        const rendered = markdownIt.render(markdownText);
        return html.deserialize(editor, rendered);
      }
      return markdown.deserialize(editor, markdownText);
    },
    [editor, markdownIt]
  );

  const insertMarkdownIntoDocument = useCallback(
    (markdownToInsert) => {
      try {
        const currentValue = editor.getEditorValue();
        const currentMd = markdown.serialize(editor, currentValue || value);
        const combinedMd = [currentMd, markdownToInsert]
          .filter(Boolean)
          .join("\n\n")
          .trim();

        const nextValue = deserializeFromMarkdown(combinedMd);
        editor.setEditorValue(nextValue);
        setValue(nextValue);
        toast.success("Content inserted");
      } catch (e) {
        console.error("Failed to insert markdown:", e);
        toast.error("Failed to insert content");
      }
    },
    [editor, value, deserializeFromMarkdown]
  );

  const handlePaste = useCallback(
    (e) => {
      const text = e?.clipboardData?.getData("text/plain");
      if (!text) return;
      if (!looksLikeMarkdown(text)) return;

      // Convert markdown-ish paste into real blocks so tables/headings render.
      // Note: this currently appends into the document (re-deserializes the whole doc)
      // to avoid relying on private Yoopta cursor insertion APIs.
      e.preventDefault();
      insertMarkdownIntoDocument(text);
    },
    [insertMarkdownIntoDocument, looksLikeMarkdown]
  );

  const handleExport = async (template) => {
    if (!workspaceSlug || !isReady) {
      toast.error("Cannot export - editor not ready");
      return;
    }

    setExporting(true);
    try {
      const data = editor.getEditorValue();
      const htmlContent = html.serialize(editor, data);

        const primaryColor = template?.primaryColor;
        const fontFamily = template?.fontFamily;
      const headerText = template?.headerText || "";
      const footerText = template?.footerText || "";
      const logoPath = template?.logoPath || "";

        const headingColorRule = primaryColor ? `color: ${primaryColor};` : "";
        const headerBorderRule = primaryColor
        ? `border-bottom: 2px solid ${primaryColor};`
        : "border-bottom: 1px solid currentColor; opacity: 0.7;";
        const headerColorRule = primaryColor ? `color: ${primaryColor};` : "";

      const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                body { font-family: ${fontFamily ? `'${fontFamily}', sans-serif` : "sans-serif"}; padding: 40px; }
                h1, h2, h3 { ${headingColorRule} }
                p { font-size: 14px; line-height: 1.6; margin-bottom: 1em; }
                    </style>
                </head>
                <body>
                    ${logoPath ? `<img src="${logoPath}" style="max-height:80px;margin-bottom:30px;" />` : ""}
              ${headerText ? `<div style="margin-bottom:30px;font-size:18px;font-weight:500;${headerColorRule}${headerBorderRule};padding-bottom:10px;">${headerText}</div>` : ""}
                    ${htmlContent}
              ${footerText ? `<div style="margin-top:50px;padding-top:20px;border-top:1px solid currentColor;opacity:0.7;font-size:12px;">${footerText}</div>` : ""}
                </body>
                </html>
            `;

      const response = await fetch(
        `${API_BASE}/v1/workspace/${workspaceSlug}/export-pdf`,
        {
          method: "POST",
          headers: {
            ...baseHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ html: fullHtml }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Server export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = template?.name
        ? `${template.name.toLowerCase().replace(/\s+/g, "-")}.pdf`
        : "notes.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF exported successfully!");
    } catch (e) {
      console.error("PDF export failed", e);
      toast.error(`PDF export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const onChange = (nextValue) => {
    setValue(nextValue);
    debouncedSave(nextValue);
  };

  return (
    <>
      <div className="flex flex-col h-full relative">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting || !isReady}
            className="flex items-center gap-x-2 px-3 py-1 bg-theme-bg-secondary hover:bg-theme-bg-primary border border-theme-border rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <CircleNotch className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <FilePdf className="w-4 h-4 text-red-400" />
            )}
            <span className="text-theme-text-primary">
              {exporting ? "Exporting..." : "Export PDF"}
            </span>
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-theme-bg-secondary yoopta-editor-wrapper"
          style={{ minHeight: "100%" }}
          onPasteCapture={handlePaste}
        >
          <YooptaEditor
            editor={editor}
            plugins={PLUGINS}
            marks={MARKS}
            tools={TOOLS}
            value={value}
            onChange={onChange}
            autoFocus={true}
            placeholder="Write notes…"
            selectionBoxRoot={containerRef}
            className="yoopta-notes-editor"
          />
        </div>
      </div>

      <ExportPdfModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </>
  );
});

export default YooptaNotesEditor;
