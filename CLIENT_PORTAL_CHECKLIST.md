# 🏰 Client Portal - Build Checklist
**King of AI Edition** 🤴

> **Status:** 🚧 Planning Phase
> **Last Updated:** Dec 29, 2025
> **Overall Progress:** 0%

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
- [ ] Create shared StatusBadge component
- [ ] Create shared Button components (Primary, Secondary, Danger)
- [ ] Define typography scale (H1-H6, body, caption)

**Progress:** 0%

---

## 2. Core Layout

### ClientPortalLayout Wrapper
- [ ] Create `ClientPortalLayout/index.jsx`
- [ ] Implement responsive grid layout (sidebar + main content)
- [ ] Add sticky header with company logo
- [ ] Add floating action bar (bottom-right)
- [ ] Mobile drawer trigger
- [ ] Implement smooth scrolling
- [ ] Add loading states

### Header Hero
- [ ] Create `ProposalHeader` component
- [ ] Display document title and ID
- [ ] Show "Prepared for" client info
- [ ] Add status badge (animated)
- [ ] Add action buttons (Download PDF, Print, Share)
- [ ] Implement date validity display

**Progress:** 0%

---

## 3. Sidebar Components

### Sidebar Panel
- [ ] Create `DocumentSidebar/index.jsx`
- [ ] Implement collapsible behavior
- [ ] Add section icons (Lucide)
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
- [ ] Create `PricingTableInteractive/index.jsx`
- [ ] Editable rows (if permissions allow)
- [ ] Live calculation (Hours × Rate = Total)
- [ ] Tax calculation (GST/VAT)
- [ ] Grand total display (bold, larger)
- [ ] Currency formatting
- [ ] Row hover highlight
- [ ] Add/Remove row buttons
- [ ] Subtotal/Tax/Total sections

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
- [ ] Create `CommentThread/index.jsx`
- [ ] Comment input with rich text
- [ ] Threaded replies
- [ ] Mention @users
- [ ] File attachments
- [ ] Markdown support
- [ ] Unread indicator
- [ ] Real-time updates (if using WebSocket)
- [ ] Like/reaction buttons
- [ ] Timestamp formatting (relative: "2 hours ago")

### Approval Workflow
- [ ] Create `ApprovalPanel/index.jsx`
- [ ] Digital signature canvas (draw with mouse)
- [ ] Type signature option
- [ ] Date/time auto-fill
- [ ] Approve button (green)
- [ ] Decline button (red) + reason field
- [ ] Request changes button (yellow) + notes
- [ ] Signature preview
- [ ] Submit feedback animation

### Version Control
- [ ] Create `VersionTimeline/index.jsx`
- [ ] Version diff viewer (before/after)
- [ ] Revert to previous version
- [ ] Version notes
- [ ] Visual timeline (vertical)
- [ ] Current version highlight

**Progress:** 0%

---

## 6. Premium "Cool" Features

### Floating Action Bar
- [ ] Create `FloatingActionBar/index.jsx`
- [ ] Fixed position bottom-right
- [ ] Quick actions: Comment, Attach, AI Chat, Download
- [ ] Collapse on scroll, expand on hover
- [ ] Tooltip labels
- [ ] Animation (slide up)

### AI Assistant Panel
- [ ] Create `AIAssistantPanel/index.jsx`
- [ ] Collapsible side panel (right side)
- [ ] Chat input for questions
- [ ] AI summary of proposal
- [ ] Highlight relevant sections
- [ ] Export to markdown
- [ ] "Ask about this section" context-aware

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
