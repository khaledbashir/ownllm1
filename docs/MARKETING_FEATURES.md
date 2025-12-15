# OwnLLM – The Master Marketing & Feature Bible

> **The complete guide to selling, positioning, and white-labeling the OwnLLM platform.**
> *For Agency Owners, SaaS Entrepreneurs, and Enterprise Deployments.*

---

## 🎨 VISUAL IDENTITY & WHITE-LABELING (The "Make It Yours" Engine)

OwnLLM isn't just "customizable" — it's designed to be completely rewritten visually. You don't need to fork the code; you can control the brand identity directly from the admin panel.

### 1. The Brand Manager (No-Code Styling)
*Accessible via: Settings > General > Brand Manager*

| Element | Customization Options | What It Controls |
|---------|-----------------------|------------------|
| **Logo** | Custom URL | Replaces the default logo in the sidebar, login screen, and mobile app. |
| **Primary Color** | Hex Code / Color Picker | Main buttons, active states, links, and high-visibility accents. |
| **Secondary Color** | Hex Code / Color Picker | Sidebar backgrounds, subtle borders, and secondary UI elements. |
| **Typography** | 5 Premium Font Families | **Inter** (Modern), **Roboto** (Tech), **Open Sans** (Neutral), **Lato** (Friendly), **Montserrat** (Bold). |
| **Backgrounds** | AI-Generated or Custom URL | Generate unique textures using built-in AI (e.g., "abstract geometric blue") or upload your own corporate wallpaper. |
| **PDF Branding** | Header & Footer Text | Custom text that appears on every exported report or chat transcript. |

### 2. Deep Theming (CSS Overrides)
For agencies who need pixel-perfect matching of their client's website. The "CSS Overrides" box accepts standard CSS that injects directly into the application.

**Copy-Paste Recipes for Common Requests:**

**"Make the corners rounder (App-like feel)"**
```css
/* Rounds all buttons and inputs */
button, input, select { border-radius: 12px !important; }
/* Rounds the main chat window */
.bg-theme-bg-secondary { border-radius: 20px !important; }
```

**"Glassmorphism / Frosted Glass Effect"**
```css
.bg-theme-bg-secondary {
  background: rgba(30, 41, 59, 0.7) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**"Hide the 'Powered by' footer"**
```css
.sidebar-footer { display: none !important; }
```

### 3. Application Color Variables (The DNA)
OwnLLM uses semantic CSS variables. You can override these globally to change the entire feel of the app (Dark Mode & Light Mode).

| Variable | Description |
|----------|-------------|
| `--theme-bg-primary` | Main background color of the application window. |
| `--theme-bg-sidebar` | Dedicated sidebar background (can differ from main bg). |
| `--theme-text-primary` | Main heading and body text color. |
| `--theme-button-cta` | The high-conversion color for "Send Message" or "Save". |
| `--theme-bg-chat-input` | Background of the text input box (where users type). |
| `--theme-sidebar-item-hover` | Color when hovering over menu items. |

---

## 🎯 TARGET PERSONAS & SALES ANGLES

---

### 1. THE ASPIRING ENTREPRENEUR ("The White-Label SaaS")
*Selling Point: "Launch a tech company without writing code."*

**The Pitch:**
"You've seen the AI gold rush. You want to sell AI software, but you can't code. OwnLLM is your 'business in a box'. We provide the engine; you provide the brand, the clients, and the price tag."

**Key Selling Features:**
*   **Recurring Revenue**: License it to local businesses for $99-$499/month.
*   **Zero Engineering**: We handle the vector databases, LLM connections, and server logic.
*   **Custom Domain**: Map `app.youragency.com` directly to the platform.
*   **Stripe Integration**: Connect your billing and put it on autopilot (via external webhook).

---

### 2. THE AGENCY CEO ("The Service Scaler")
*Selling Point: "Productize your service expertise."*

**The Pitch:**
"Stop trading hours for dollars. Instead of consulting with clients one-on-one, give them an AI clone of your agency. Upload your playbooks, strategy docs, and past reports. Let the AI answer their questions 24/7."

**Key Selling Features:**
*   **Client Workspaces**: Creating a new client takes 30 seconds. They get their own private sandbox.
*   **Knowledge Base Protection**: Your proprietary data stays in your workspace. Clients can query it, but they can't download your raw IP.
*   **Brand Stickiness**: Clients log into *your* portal every day, keeping retention high.
*   **Value-Add Reporting**: Generate PDF summaries of chats to prove ROI.

---

### 3. THE ENTERPRISE / END-USER ("The Privacy-First Org")
*Selling Point: "ChatGPT, but safe and smart."*

**The Pitch:**
"Your employees are already using AI, pasted confidential data into public models. OwnLLM brings that capability inside your firewall. It connects to *your* Google Drive, *your* Confluence, and *your* codebases, ensuring data never trains public models."

**Key Selling Features:**
*   **Self-Hosted Security**: Run it on your AWS, Azure, or on-prem servers.
*   **Role-Based Access**: Marketing can't see HR's workspaces. Engineering can't see Finance's docs.
*   **Audit Logs**: See exactly who is asking what.
*   **Hybrid AI**: Use secure local models (Llama 3, Mistral) for sensitive data, and GPT-4 for general tasks.

---

## 🏆 COMPLETE FEATURE LIST (The "Yes, We Do Avoid That" List)

Use this checklist for RFPs or feature comparison charts.

### 🧠 Intelligence & Models
*   [x] **Multi-Model Support**: Switch between GPT-4, Claude 3, Gemini, and Llama 3 in the same chat.
*   [x] **Local LLM Support**: Run entirely offline using Ollama, LM Studio, or LocalAI.
*   [x] **Vision Capabilities**: Upload screenshots or images; the AI analyzes them.
*   [x] **Web Browsing**: The AI can search the live internet for citations.
*   [x] **Data Analysis**: Upload CSVs/Excel; AI generates charts and insights.

### 📚 Knowledge Management (RAG)
*   [x] **Unlimited Documents**: PDF, DOCX, TXT, MD, CSV, Excel.
*   [x] **Website Scraping**: Turn any URL into a knowledge base source.
*   [x] **YouTube Transcription**: Chat with video content.
*   [x] **GitHub Integration**: Ingest entire repositories for code Q&A.
*   [x] **Vector Database Agnostic**: Use Chroma, Pinecone, Qdrant, Weaviate, or Milvus.
*   [x] **Document Pinning**: Force-feed specific documents into the context window.

### ⚙️ Automation & Agents
*   [x] **Visual Flow Builder**: Drag-and-drop agent logic (No-code).
*   [x] **Custom Skills**: Write JavaScript plugins to call external APIs (Zapier, Salesforce, etc.).
*   [x] **Scheduled Agents**: Run research tasks overnight.
*   [x] **@Agent Invocation**: Call specific agents inside a normal chat thread.

### 🏢 Business Tools
*   [x] **Multi-User Management**: Invite unlimited users via email.
*   [x] **Granular Permissions**: Admins, Managers, and Default users.
*   [x] **Built-in CRM**: Track conversation history by user.
*   [x] **Embedding Widgets**: Put a chat bubble on your public website.
*   [x] **API Access**: Full Developer API to manage workspaces programmatically.
*   [x] **Mobile App**: Native-feel mobile experience with QR code login.

### 🎨 Customization
*   [x] **White-Label Branding**: Logo, colors, fonts, favicon.
*   [x] **Custom CSS**: Full stylistic control.
*   [x] **Multi-Language**: UI supports 10+ languages.
*   [x] **Welcome Messages**: Define the first message users see in a workspace.
*   [x] **Preset Prompts**: Create "Slash Commands" for common workflows.

---

## 🤑 PRICING MODELS (How You Charge)

Since you control the platform, you control the billing.

**1. The "SaaS" Model (Per User/Month)**
*   **Price**: $29 - $99 / user / month
*   **Best for**: Enterprise clients, large teams.
*   **Why**: Predictable recurring revenue that scales with their headcount.

**2. The "Retainer" Model (Flat Fee)**
*   **Price**: $499 - $2,000 / month
*   **Best for**: Agencies bundling AI with services.
*   **Why**: "Free AI" is a massive value-add to keep clients paying your agency retainer.

**3. The "Setup & Support" Model**
*   **Price**: $5,000 Setup + $500/mo Maintenance
*   **Best for**: Non-technical businesses (Law firms, Real Estate).
*   **Why**: They pay for the *result* (a trained AI), not the tool.

---

## 🚀 GO-TO-MARKET HEADLINES

**For Marketing Agencies:**
> "Your Brand's Voice, Automated. Launch 24/7 Content Agents Trained on Your Best Work."

**For Consultancies:**
> "Clone Your Expertise. Give Every Client a Senior Consultant in Their Pocket."

**For IT Service Providers:**
> "Secure, Private AI for Your Business. Stop Leaking Data to ChatGPT."

**For Educational/Coaching:**
> "The Tutor That Never Sleeps. Personalized AI Mentoring for Every Student."
