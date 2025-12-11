import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import SlashCommandMenu, { SLASH_COMMANDS } from "./SlashCommandMenu";

const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }) => {
                    // Delete the slash command text
                    editor.chain().focus().deleteRange(range).run();
                    // Execute the command
                    props.command(editor, props);
                },
            },
            onAICommand: null,
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                items: ({ query }) => {
                    return SLASH_COMMANDS.filter((item) =>
                        item.title.toLowerCase().includes(query.toLowerCase())
                    );
                },
                render: () => {
                    let component;
                    let popup;

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(SlashCommandMenu, {
                                props: {
                                    ...props,
                                    onAICommand: this.options.onAICommand,
                                },
                                editor: props.editor,
                            });

                            if (!props.clientRect) {
                                return;
                            }

                            popup = tippy("body", {
                                getReferenceClientRect: props.clientRect,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: "manual",
                                placement: "bottom-start",
                                animation: "shift-away",
                                theme: "slash-command",
                            });
                        },

                        onUpdate: (props) => {
                            component.updateProps({
                                ...props,
                                onAICommand: this.options.onAICommand,
                            });

                            if (!props.clientRect) {
                                return;
                            }

                            popup?.[0]?.setProps({
                                getReferenceClientRect: props.clientRect,
                            });
                        },

                        onKeyDown: (props) => {
                            if (props.event.key === "Escape") {
                                popup?.[0]?.hide();
                                return true;
                            }

                            return component.ref?.onKeyDown(props);
                        },

                        onExit: () => {
                            popup?.[0]?.destroy();
                            component.destroy();
                        },
                    };
                },
            }),
        ];
    },
});

export default SlashCommand;
