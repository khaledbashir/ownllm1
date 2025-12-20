/**
 * Seed script to add proposal-focused AI presets and doc actions
 * Run with: node server/scripts/seed-proposal-presets.js
 */

const prisma = require("../utils/prisma");
const { SlashCommandPresets } = require("../models/slashCommandsPresets");

// Chat Presets (for analyzing context/docs in chat)
const CHAT_PRESETS = [
    {
        command: "/extract-requirements",
        prompt: "Analyze the attached document or conversation and extract all client requirements, pain points, and success criteria as a detailed bulleted list. Group them by category (functional, technical, business).",
        description: "Extract requirements from brief/doc",
    },
    {
        command: "/discovery-questions",
        prompt: "Based on this project brief or scope, generate a list of critical clarifying questions I should ask the client before creating a proposal. Focus on scope gaps, assumptions, and potential risks.",
        description: "Generate discovery questions",
    },
    {
        command: "/identify-dependencies",
        prompt: "Identify what we need from the client to complete this project successfully. List all prerequisites, access requirements, content/assets needed, and potential blockers.",
        description: "List client dependencies",
    },
    {
        command: "/risk-analysis",
        prompt: "Analyze this project scope and identify potential risks (technical, timeline, budget, scope creep). For each risk, suggest a mitigation strategy.",
        description: "Identify project risks",
    },
    {
        command: "/estimate-timeline",
        prompt: "Based on this scope of work, suggest a realistic project timeline with phases, milestones, and review cycles. Include buffer time for revisions.",
        description: "Generate project timeline",
    },
    {
        command: "/competitive-angle",
        prompt: "Help me position this proposal against competitors. What unique value can I emphasize? What objections might the client have and how should I address them?",
        description: "Competitive positioning help",
    },
];

// Doc AI Actions (for inline text transformation in editor)
const DOC_AI_ACTIONS = [
    {
        id: "make_punchy",
        name: "Make It Punchy",
        icon: "🔥",
        prompt: "Rewrite this to be bold, direct, and impactful. Cut unnecessary words, add power: {{selectedText}}",
    },
    {
        id: "add_exclusions",
        name: "Add Exclusions",
        icon: "⚠️",
        prompt: "Based on this scope, generate an 'Out of Scope' section listing what's NOT included to prevent scope creep. Be specific: {{selectedText}}",
    },
    {
        id: "value_justification",
        name: "Add Value Why",
        icon: "💵",
        prompt: "For each item or deliverable, add a brief justification explaining why it matters to the client's business outcomes: {{selectedText}}",
    },
    {
        id: "preempt_objections",
        name: "Handle Objections",
        icon: "🛡️",
        prompt: "Rewrite this section to subtly address and preempt likely client objections without being defensive: {{selectedText}}",
    },
    {
        id: "tighten_scope",
        name: "Tighten Scope",
        icon: "🎯",
        prompt: "Make this scope description more specific, measurable, and unambiguous. Add acceptance criteria where appropriate: {{selectedText}}",
    },
    {
        id: "add_urgency",
        name: "Create Urgency",
        icon: "⚡",
        prompt: "Rewrite to emphasize the cost of inaction and create urgency without being pushy or salesy: {{selectedText}}",
    },
    {
        id: "client_perspective",
        name: "Client Voice",
        icon: "🔄",
        prompt: "Rewrite this from the client's perspective - focus on benefits they receive, not what we do: {{selectedText}}",
    },
    {
        id: "executive_summary",
        name: "Summarize for Exec",
        icon: "👔",
        prompt: "Condense this into a 2-3 sentence executive summary suitable for a busy decision-maker: {{selectedText}}",
    },
];

async function seedProposalPresets(userId = null) {
    console.log("Seeding proposal chat presets...");

    for (const preset of CHAT_PRESETS) {
        const existing = await SlashCommandPresets.get({
            command: preset.command,
            userId: userId ? Number(userId) : null,
        });

        if (existing) {
            console.log(`  ⏭️  Skipping ${preset.command} (already exists)`);
            continue;
        }

        await SlashCommandPresets.create(userId, preset);
        console.log(`  ✅ Created ${preset.command}`);
    }

    console.log("\nChat presets seeded!");
    return CHAT_PRESETS.length;
}

async function getDocAIActionsJSON() {
    // Return the JSON that should be stored in workspace.inlineAiActions
    return JSON.stringify(DOC_AI_ACTIONS);
}

// Export for use in other scripts
module.exports = {
    CHAT_PRESETS,
    DOC_AI_ACTIONS,
    seedProposalPresets,
    getDocAIActionsJSON,
};

// Run directly
if (require.main === module) {
    (async () => {
        try {
            await seedProposalPresets(null); // null = system-wide presets
            console.log("\n📋 Doc AI Actions JSON (copy to workspace settings):");
            console.log(await getDocAIActionsJSON());
            process.exit(0);
        } catch (error) {
            console.error("Seed failed:", error);
            process.exit(1);
        }
    })();
}
