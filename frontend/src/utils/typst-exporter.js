
export const convertBlocksToTypst = (blocks) => {
    if (!blocks || !Array.isArray(blocks)) return "";

    return blocks.map((block) => {
        // Extract text content from the nested structure BlockNote uses
        const text = block.content
            ? block.content.map((c) => c.text || "").join("")
            : "";

        switch (block.type) {
            case "heading":
                // Typst uses '=' for H1, '==' for H2, etc.
                const level = "=".repeat(block.props.level || 1);
                return `${level} ${text}\n`;

            case "paragraph":
                return `${text}\n\n`; // Double newline for paragraphs

            case "bulletListItem":
                return `- ${text}\n`;

            case "numberedListItem":
                return `+ ${text}\n`;

            case "codeBlock":
                // Typst code blocks use triple backticks
                // We default to "none" if no language is specified to prevent Typst errors
                const lang = block.props.language || "none";
                // Ensure we don't double-escape if the user pasted code
                return "```" + `${lang}\n${text}\n` + "```\n";

            case "checkListItem":
                // Typst doesn't have native checkboxes in standard text flow, 
                // simulate with brackets
                const checkMark = block.props.checked ? "[x]" : "[ ]";
                return `- ${checkMark} ${text}\n`;

            default:
                return `${text}\n`;
        }
    }).join("\n");
};
