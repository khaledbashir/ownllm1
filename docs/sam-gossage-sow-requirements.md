# Sam Gossage AI Scope of Work Agent Checklist

This checklist details the exact requirements Sam set forth for the AI agent.

## I. Reliability, Platform, and Workflow

| Status | Requirement |
|--------|-------------|
| [ ] | **Reliable and Persistent**: The tool must be reliable for repeated use, ensuring previous scopes/files are not lost or missing. |
| [x] | **Two-Step Editing Process**: The system must support a 2-step process where Sam can generate an initial output, review and edit it to provide iterations/updates, before creating the finalized version. |
| [x] | **Easy Modification**: It must be easy to modify and update the hours, roles, and tasks after the initial scope has been generated. |
| [x] | **Role Layout Control**: Sam needs the ability to move around the layout of the roles (e.g., drag and drop functionality) within the editor. |
| [x] | **Total Price Toggle**: Provide a button to toggle on and off the summarized price of all scopes of work in the editor. |

## II. Content Generation and Structure

| Status | Requirement |
|--------|-------------|
| [ ] | **Bespoke Deliverables**: The AI must come up with the deliverables based on the prompt and brief; not trained off existing static lists. |
| [ ] | **Contextual Variation**: Details must vary depending on project type (MAP/CRM Implementation, etc.) and platform (Salesforce, HubSpot, Marketo). |
| [ ] | **Standard Phases**: The scope must follow standard delivery structure (Discovery & Planning, Technical Assessment, QA & Testing, Final Delivery, Training & Handover). |
| [ ] | **Detailed Line Items**: Output must include more detail in descriptions and line items. |
| [x] | **Deliverable Format**: Deliverables as bullet points, not continuous paragraphs. |
| [ ] | **Best Practice Research**: AI should use web research for best practice setup, not copying internal templates. |

## III. Pricing, Roles, and Budget Management

| Status | Requirement |
|--------|-------------|
| [x] | **Rate Card Adherence**: Accurately use roles and hourly rates from the Social Garden Rate Card. |
| [x] | **Granular Roles**: Hours split across granular roles (email production, dev, design, copy, deployment, testing). |
| [ ] | **Rate Blending**: AI needs to blend rates across various roles and tasks. |
| [ ] | **Mandatory Roles/Hours**: Each scope must include minimal hours for Head of Senior Project Management and Project Coordination. |
| [ ] | **Account Management Hours**: Each scope must include larger amount of Account Management hours. |
| [ ] | **Account Management Placement**: Account Management roles at bottom of roles list. |
| [x] | **Currency**: Project currency in AUD, not USD. |
| [x] | **Round Numbers**: Final amount aims for round numbers (50k, 45k, 60k or 200, 250, 300 hours). |
| [ ] | **Budget Adherence**: AI must respect target budget and adjust hours accordingly. |
| [x] | **Discount Functionality**: Option to apply percentage discount across SOW or total. |
| [x] | **Discount Presentation**: Pricing summary shows original price and discounted price. |
| [x] | **Tax/GST Display**: Summary price includes +GST. |

## IV. Branding and Technical Output

| Status | Requirement |
|--------|-------------|
| [ ] | **Branding/Logo**: Output must use actual Social Garden logo. |
| [ ] | **Font**: Copy must use Plus Jakarta Sans font. |
| [ ] | **Finance Export**: Provide structured/machine-readable data export for finance system input. |

---

## Implementation Status

**Implemented (in pricing table):**
- [x] Drag-and-drop role reordering
- [x] Total price toggle (show/hide)
- [x] Discount percentage with before/after display
- [x] GST display (+GST suffix)
- [x] AUD currency
- [x] Rate card integration (roles dropdown)
- [x] Commercial rounding to nearest $100
- [x] PDF export (WYSIWYG)

**Pending:**
- [ ] Sort "Account Management" to bottom automatically
- [ ] Budget target adherence
- [ ] Rate blending calculations
- [ ] Plus Jakarta Sans font in PDF
- [ ] Social Garden logo branding
- [ ] Finance/structured data export
