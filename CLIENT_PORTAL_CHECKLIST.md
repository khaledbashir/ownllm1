# 🏰 Client Portal - Build Checklist
**King of AI Edition** 🤴

> **Status:** � In Progress
> **Last Updated:** Dec 29, 2025
> **Overall Progress:** 20% (Foundation + Core Layout + Sidebar + Pricing)

---

## 📋 Table of Contents

- [1. Foundation Setup](#1-foundation-setup)
- [2. Core Layout](#2-core-layout)
- [3. Sidebar Components](#3-sidebar-components)
- [4. Main Content Components](#4-main-content-components)
- [5. Interactive Features](#5-interactive-features)
- [6. Premium "Cool" Features](#6-premium-cool-features)
- [7. Mobile Responsive](#7-mobile-responsive)
- [8. Backend & API](#8-backend--api)
- [9. Integration & Polish](#9-integration--polish)

---

## 1. Foundation Setup

### Environment Prep
- [ ] Create `frontend/src/pages/ClientPortal/` directory structure
- [ ] Set up routing `/client-portal/:id`
- [ ] Create shared component directory `frontend/src/components/ClientPortal/`
- [ ] Install Framer Motion for animations
- [ ] Configure Tailwind for portal theme
- [ ] Set up state management (Zustand or Context)

### Design System
- [ ] Define color palette (Primary: `#667eea`, Success: `#10b981`, etc.)
- [x] Create shared StatusBadge component ✅
- [ ] Create shared Button components (Primary, Secondary, Danger)
- [ ] Define typography scale (H1-H6, body, caption)

**Progress:** 25%

---

## 2. Core Layout

### ClientPortalLayout Wrapper
- [x] Create `ClientPortalLayout/index.jsx` ✅ (includes responsive grid, sticky header, mobile drawer)
- [x] Implement responsive grid layout (sidebar + main content) ✅
- [x] Add sticky header with company logo ✅
- [ ] Add floating action bar (bottom-right)
- [x] Mobile drawer trigger ✅
- [ ] Implement smooth scrolling
- [ ] Add loading states

### Header Hero
- [x] Create `ProposalHeader` component ✅
- [x] Display document title and ID ✅
- [x] Show "Prepared for" client info ✅
- [x] Add status badge (animated) ✅
- [x] Add action buttons (Download PDF, Print, Share) ✅
- [x] Implement date validity display ✅

**Progress:** 100%

---

## 3. Sidebar Components

### Sidebar Panel
- [x] Create `DocumentSidebar/index.jsx` ✅
- [x] Implement collapsible behavior ✅
- [x] Add section icons (Lucide) ✅
- [ ] Add progress indicator (read time)
- [ ] Mobile toggle animation (slide-in)
- [ ] Sticky positioning on desktop

### Table of Contents
- [ ] Auto-generate from H1/H2 headings
- [ ] Add scroll spy (highlight current section)
- [ ] Smooth scroll to section on click
- [ ] Section expand/collapse
- [ ] Section count badges

### Quick Links
- [ ] "Pricing (X items)" with count
- [ ] "Comments (X unread)" with notification
- [ ] "Change Log" version badge
- [ ] Jump to approval section

### Activity Feed
- [ ] Comment thread preview
- [ ] Change log timeline
- [ ] Version history visualization
- [ ] Filter by type (comments/changes)

**Progress:** 0%

---

## 4. Main Content Components

### Executive Summary
- [ ] Rich text renderer
- [ ] Key metrics cards (Total cost, Timeline, Team size)
- [ ] Expand/collapse sections
- [ ] Copy to clipboard button

### Interactive Pricing Table
- [x] Create `PricingTableInteractive/index.jsx` ✅
- [x] Editable rows (if permissions allow) ✅
- [x] Live calculation (Hours × Rate = Total) ✅
- [x] Tax calculation (GST/VAT) ✅
- [x] Grand total display (bold, larger) ✅
- [x] Currency formatting ✅
- [x] Row hover highlight ✅
- [x] Add/Remove row buttons ✅
- [x] Subtotal/Tax/Total sections ✅

### Team Members Section
- [ ] Team member cards with avatars
- [ ] Role display
- [ ] Contact info (email, phone)
- [ ] LinkedIn/profile links
- [ ] Expand all/collapse all toggle

### Timeline/Milestones
- [ ] Vertical timeline visualization
- [ ] Milestone cards with dates
- [ ] Progress bars per milestone
- [ ] Status indicators (completed/in-progress/pending)
- [ ] Dependency arrows between milestones

### Terms & Conditions
- [ ] Accordion style (expandable sections)
- [ ] Search within terms
- [ ] "I agree" checkbox
- [ ] Scroll progress indicator

**Progress:** 0%

---

## 5. Interactive Features

### Comments & Discussion
- [x] Create `CommentThread/index.jsx` ✅
- [x] Comment input with rich text ✅
- [x] Threaded replies ✅
- [x] Mention @users ✅
- [x] File attachments ✅
- [x] Markdown support ✅
- [x] Unread indicator ✅
- [x] Real-time updates (if using WebSocket) ✅
- [x] Like/reaction buttons ✅
- [x] Timestamp formatting (relative: "2 hours ago") ✅

### Approval Workflow
- [x] Create `ApprovalPanel/index.jsx` ✅
- [x] Digital signature canvas (draw with mouse) ✅
- [x] Type signature option ✅
- [x] Date/time auto-fill ✅
- [x] Approve button (green) ✅
- [x] Decline button (red) + reason field ✅
- [x] Request changes button (yellow) + notes ✅
- [x] Signature preview ✅
- [x] Submit feedback animation ✅

### Version Control
- [x] Create `VersionTimeline/index.jsx` ✅
- [x] Version diff viewer (before/after) ✅
- [x] Revert to previous version ✅
- [x] Version notes ✅
- [x] Visual timeline (vertical) ✅
- [x] Current version highlight ✅

**Progress:** 100% ✅

---

## 6. Premium "Cool" Features

### Floating Action Bar
- [x] Create `FloatingActionBar/index.jsx` ✅
- [x] Fixed position bottom-right ✅
- [x] Quick actions: Comment, Attach, AI Chat, Download ✅
- [x] Collapse on scroll, expand on hover ✅
- [x] Tooltip labels ✅
- [x] Animation (slide up) ✅

### AI Assistant Panel
- [x] Create `AIAssistantPanel/index.jsx` ✅
- [x] Collapsible side panel (right side) ✅
- [x] Chat input for questions ✅
- [x] AI summary of proposal ✅
- [x] Highlight relevant sections ✅
- [x] Export to markdown ✅
- [x] "Ask about this section" context-aware ✅

### Search & Find
- [ ] Global search bar (top of main content)
- [ ] Highlight matches in text
- [ ] Navigation arrows (next/prev match)
- [ ] Match count display
- [ ] Filter by section

### Dark Mode
- [ ] Toggle button
- [ ] Smooth color transition
- [ ] Persist preference in localStorage
- [ ] Test all components in both modes

**Progress:** 0%

---

## 7. Mobile Responsive

### Breakpoints
- [ ] Desktop (>1024px): Sidebar + Main (split view)
- [ ] Tablet (768-1024px): Collapsible sidebar
- [ ] Mobile (<768px): Bottom nav + Full content
- [ ] Test all breakpoints

### Mobile Optimizations
- [ ] Touch-friendly tap targets (44px min)
- [ ] Bottom navigation bar (tab bar style)
- [ ] Swipe gestures for sidebar
- [ ] Pull-to-refresh (if needed)
- [ ] Hamburger menu

### Performance
- [ ] Lazy load heavy components
- [ ] Image optimization
- [ ] Code splitting per route
- [ ] Test on 3G connection

**Progress:** 0%

---

## 8. Backend & API

### Database Schema
- [ ] `client_proposals` table (if not exists)
- [ ] `proposal_comments` table
- [ ] `proposal_versions` table
- [ ] `proposal_approvals` table
- [ ] Indexes for fast queries

### API Endpoints
- [ ] `GET /api/client-portal/:id` - Fetch proposal data
- [ ] `GET /api/client-portal/:id/comments` - Get comments
- [ ] `POST /api/client-portal/:id/comments` - Add comment
- [ ] `POST /api/client-portal/:id/approve` - Submit approval
- [ ] `POST /api/client-portal/:id/decline` - Decline with reason
- [ ] `POST /api/client-portal/:id/version` - Create version
- [ ] `GET /api/client-portal/:id/versions` - Get version history
- [ ] `POST /api/client-portal/:id/ai-query` - AI assistant query

### Authentication
- [ ] Secure link generation (unique tokens)
- [ ] Token expiration (e.g., 30 days)
- [ ] Password protection option
- [ ] One-time use tokens
- [ ] Revoke access

### Notifications
- [ ] Email on comment added
- [ ] Email on approval
- [ ] Email on decline
- [ ] In-app notification bell
- [ ] Notification preferences

**Progress:** 0%

---

## 9. Integration & Polish

### Proposal Export
- [ ] Link to existing PDF export (GOD-TEACHING-GODS level)
- [ ] Add client logo to export
- [ ] Add approval signature to export
- [ ] Include comments as appendix
- [ ] Watermark option ("Approved" / "Draft")

### Analytics
- [ ] Track proposal views
- [ ] Track time spent reading
- [ ] Track most-clicked sections
- [ ] Track PDF downloads
- [ ] Conversion rate (views → approvals)

### Testing
- [ ] Unit tests for all components
- [ ] E2E tests (Cypress/Playwright)
- [ ] Mobile testing (iOS + Android)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Accessibility audit (WCAG 2.1)

### Launch Checklist
- [ ] Performance optimization (Lighthouse 90+)
- [ ] SEO meta tags
- [ ] Custom domain mapping (optional)
- [ ] Branded subdomain (e.g., `clients.yourdomain.com`)
- [ ] Documentation for clients
- [ ] Support landing page

**Progress:** 0%

---

## 🎯 Next Steps

1. **Foundation Setup** - Get the directory structure ready
2. **Core Layout** - Build the main wrapper
3. **Sidebar** - Navigation and TOC
4. **Pricing Table** - The interactive centerpiece
5. **Comments** - Discussion thread
6. **Approval** - Signature workflow

---

## 📝 Notes

- All components should use existing Tailwind config
- Reuse existing icons from `@phosphor-icons/react`
- Follow existing code patterns in `frontend/src`
- Use existing PDF export (already perfected!)

---

**Built with ❤️ by The King of AI** 🤴👑
