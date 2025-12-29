# ⚖️ PRODUCT AUDIT: THE SOURCE OF TRUTH (LIVES vs. DIES)

> **Status:** Forensic Sweep in Progress  
> **Last Updated:** 2025-12-29  
> **Auditor:** God Mode (Acting Detective)

This document is the single source of truth for the fate of every feature in the OwnLLM repository. If it's on this list, its fate is sealed. We do not keep half-baked ideas or broken promises. We ship value, or we clear the morgue.

---

## 🪦 THE CEMETERY (Death Sentences)
*These features are dead weight or redundant sprawl. We kill them to save the product.*

| Feature | Reason for Death | Fate |
| :--- | :--- | :--- |
| **Marketing Landers** (`LandingClaude`, `LandingGemini`, etc.) | Sprawling SEO-bait that clutters the frontend. Each brand doesn't need its own page in a private SaaS. | **DELETE ALL** - Consolidate into a single "Integrations" overview. |
| **Transcription Preferences** | Often redundant with provider settings. Only 10% used. | **DEPRECATE** - Move into LLM Providers settings as a secondary flag. |
| **"Coming Soon" Placeholders** (in TestLab) | "Slides", "Data", and "Research" modes. | **ERASE** - Do not show empty buttons to users. Remove from UI until 100% build. |

---

## 🏥 THE OPERATING ROOM (Surgery Required)
*Good DNA, bad execution. These live, but only after a clinical refactor.*

| Feature | Critical Flaw | Surgery Plan |
| :--- | :--- | :--- |
| **The Test Lab** | Only 25% complete. Prompts are bloated. | **HIDE UNFINISHED MODES.** Rename to "AI Doc Studio". Optimize tool-call system prompt to stop hallucinations. |
| **Prompt Input Component** | Memory leaks (event listeners) and debounce sprawl. | **STRIP & REBUILD LISTENERS.** Fix the `removeEventListener` bug. Extract custom hooks for slash/agent menus. |
| **CRM Assistant** | Frontend bug: Search for thread fails (threads.find is not a function). | **FIX API HANDLING.** Correct the destructing of `threads` object. Clean up the auto-thread creation logic to prevent clutter. |
| **Smart Plugins** | Silent failures on JSON parse. | **ADD TELEMETRY.** Log errors properly. Do not fail silently; warn the user. |
| **Document Templates** | CSS injection risks in templates. | **SANITIZE.** Run full DOMPurify on any HTML stored in templates. |

---

## 💎 THE SANCTUM (Living/Healthy Features)
*The core of the product. They work, they're clean, they stay.*

| Feature | Why it Lives | Verdict |
| :--- | :--- | :--- |
| **Email Service** | Modern, clean, lazy-loaded, with solid console fallback. | **STAYS** - Minor refactor for `require` calls. |
| **AI Template Builder** | Great UX, clear value (chat to design). | **STAYS** - The crown jewel of the latest sprint. |
| **CRM Manager API** | Clean, secure (post-audit), and high-value tools. | **STAYS** - Foundation for the sales workflow. |
| **Multi-User RBAC** | Battle-tested in AnythingLLM core. | **STAYS** - Avoid touching the core auth logic. |
| **Agent Skill Discovery** | Functional and visually clear. | **STAYS** - Recently updated with CRM Manager. |

---

## 🧪 NEXT FORENSIC STEPS (Post-Audit Status)
1. **Sweep the Frontend:** [x] Deleted landing page folders and cleaned `main.jsx`.
2. **Patch the RM:** [x] Secured `crm-manager.js` handlers with `userId` and IDOR checks.
3. **Clean the Lab:** [x] Hidden "Coming Soon" modes in TestLab UI.
4. **Leak Fix:** [x] Patched memory leak in `PromptInput` event listeners.
5. **Telemetry:** [x] Added JSON parse logging to Smart Plugins.

---

*"I don't just build code. I decide what deserves to take up space."*
