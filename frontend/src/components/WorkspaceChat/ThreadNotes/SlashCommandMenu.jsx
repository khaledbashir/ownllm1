import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from "react";
import {
    TextH,
    TextHOne,
    TextHTwo,
    TextHThree,
    ListBullets,
    ListNumbers,
    CheckSquare,
    Quotes,
    Code,
    Minus,
    Table,
    Image,
    Sparkle,
} from "@phosphor-icons/react";

export const SLASH_COMMANDS = [
    {
        title: "Heading 1",
        description: "Large section heading",
        icon: TextHOne,
        command: (editor) =>
            editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        title: "Heading 2",
        description: "Medium section heading",
        icon: TextHTwo,
        command: (editor) =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        title: "Heading 3",
        description: "Small section heading",
        icon: TextHThree,
        command: (editor) =>
            editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
        title: "Bullet List",
        description: "Create a simple bullet list",
        icon: ListBullets,
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        title: "Numbered List",
        description: "Create a numbered list",
        icon: ListNumbers,
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
        title: "Task List",
        description: "Track tasks with checkboxes",
        icon: CheckSquare,
        command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
        title: "Quote",
        description: "Add a blockquote",
        icon: Quotes,
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
        title: "Code Block",
        description: "Add a code snippet",
        icon: Code,
        command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
        title: "Divider",
        description: "Add a horizontal divider",
        icon: Minus,
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
        title: "Ask AI",
        description: "Let AI help you write",
        icon: Sparkle,
        command: (editor, { onAICommand }) => {
            if (onAICommand) onAICommand();
        },
    },
];

const SlashCommandMenu = forwardRef(
    ({ items, command, editor, onAICommand }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        const selectItem = (index) => {
            const item = items[index];
            if (item) {
                command(item);
            }
        };

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }) => {
                if (event.key === "ArrowUp") {
                    setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
                    return true;
                }

                if (event.key === "ArrowDown") {
                    setSelectedIndex((prev) => (prev + 1) % items.length);
                    return true;
                }

                if (event.key === "Enter") {
                    selectItem(selectedIndex);
                    return true;
                }

                return false;
            },
        }));

        useEffect(() => {
            setSelectedIndex(0);
        }, [items]);

        if (items.length === 0) {
            return null;
        }

        return (
            <div className="slash-command-menu bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg shadow-xl overflow-hidden min-w-[280px] max-h-[320px] overflow-y-auto">
                <div className="p-1">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.title}
                                onClick={() => selectItem(index)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${index === selectedIndex
                                        ? "bg-theme-sidebar-item-selected text-theme-text-primary"
                                        : "text-theme-text-secondary hover:bg-theme-sidebar-item-hover"
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${index === selectedIndex
                                            ? "bg-theme-bg-primary"
                                            : "bg-theme-bg-container"
                                        }`}
                                >
                                    <Icon size={20} weight="bold" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {item.title}
                                    </div>
                                    <div className="text-xs opacity-60 truncate">
                                        {item.description}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }
);

SlashCommandMenu.displayName = "SlashCommandMenu";

export default SlashCommandMenu;
