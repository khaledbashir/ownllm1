import React, { useEffect, useCallback, useState } from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import SlashCommand from "./SlashCommand";
import debounce from "lodash.debounce";
import {
    TextBolder,
    TextItalic,
    TextUnderline,
    TextStrikethrough,
    Code,
    Link as LinkIcon,
    Highlighter,
    Sparkle,
    FloppyDisk,
    Check,
} from "@phosphor-icons/react";

export default function RichEditor({
    content,
    onUpdate,
    onAICommand,
    placeholder = "Type '/' for commands...",
}) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Debounced save function
    const debouncedSave = useCallback(
        debounce((json) => {
            setSaving(true);
            onUpdate?.(json);
            setTimeout(() => {
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }, 300);
        }, 1000),
        [onUpdate]
    );

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: "is-editor-empty",
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Typography,
            Highlight.configure({
                multicolor: true,
            }),
            SlashCommand.configure({
                onAICommand,
            }),
        ],
        content: content || "",
        editorProps: {
            attributes: {
                class:
                    "prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] px-4 py-3",
            },
        },
        onUpdate: ({ editor }) => {
            debouncedSave(editor.getJSON());
        },
    });

    // Update content when prop changes (e.g., loading from server)
    useEffect(() => {
        if (editor && content && !editor.isFocused) {
            const currentContent = JSON.stringify(editor.getJSON());
            const newContent = JSON.stringify(content);
            if (currentContent !== newContent) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-full text-theme-text-secondary">
                Loading editor...
            </div>
        );
    }

    return (
        <div className="rich-editor-container flex flex-col h-full">
            {/* Save Status */}
            <div className="flex items-center justify-end px-4 py-2 border-b border-theme-sidebar-border bg-theme-bg-secondary/50">
                <div className="flex items-center gap-2 text-xs">
                    {saving && (
                        <span className="text-theme-text-secondary flex items-center gap-1">
                            <FloppyDisk size={14} className="animate-pulse" />
                            Saving...
                        </span>
                    )}
                    {saved && !saving && (
                        <span className="text-green-500 flex items-center gap-1">
                            <Check size={14} weight="bold" />
                            Saved
                        </span>
                    )}
                </div>
            </div>

            {/* Bubble Menu for formatting */}
            {editor && (
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{ duration: 100 }}
                    className="bubble-menu flex items-center gap-1 p-1 bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg shadow-xl"
                >
                    <FormatButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive("bold")}
                        icon={TextBolder}
                        title="Bold"
                    />
                    <FormatButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive("italic")}
                        icon={TextItalic}
                        title="Italic"
                    />
                    <FormatButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive("underline")}
                        icon={TextUnderline}
                        title="Underline"
                    />
                    <FormatButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive("strike")}
                        icon={TextStrikethrough}
                        title="Strikethrough"
                    />
                    <div className="w-px h-5 bg-theme-sidebar-border mx-1" />
                    <FormatButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        isActive={editor.isActive("code")}
                        icon={Code}
                        title="Inline Code"
                    />
                    <FormatButton
                        onClick={() =>
                            editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()
                        }
                        isActive={editor.isActive("highlight")}
                        icon={Highlighter}
                        title="Highlight"
                    />
                    <div className="w-px h-5 bg-theme-sidebar-border mx-1" />
                    <FormatButton
                        onClick={onAICommand}
                        isActive={false}
                        icon={Sparkle}
                        title="Ask AI"
                        className="text-purple-400 hover:text-purple-300"
                    />
                </BubbleMenu>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} className="h-full" />
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-theme-sidebar-border bg-theme-bg-secondary/30">
                <p className="text-xs text-theme-text-secondary text-center">
                    💡 Type <kbd className="px-1 py-0.5 bg-theme-bg-container rounded text-xs">/</kbd> for commands • Select text for formatting
                </p>
            </div>
        </div>
    );
}

function FormatButton({ onClick, isActive, icon: Icon, title, className = "" }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-colors ${isActive
                    ? "bg-theme-sidebar-item-selected text-theme-text-primary"
                    : "text-theme-text-secondary hover:bg-theme-sidebar-item-hover hover:text-theme-text-primary"
                } ${className}`}
        >
            <Icon size={16} weight={isActive ? "bold" : "regular"} />
        </button>
    );
}
