# Multi-Tenant SaaS Handover Document

## Project Overview

**Repository**: khaledbashir/ownllm1
**Branch**: `feature/multi-tenant-saas`
**Backup Branch**: `pre-saas-refactor`

This document serves as a handover for completing the multi-tenant SaaS transformation of AnythingLLM. The foundation (database schema, middleware, API endpoints) has been completed. The remaining tasks are organized into clear phases.

---

## Branch Information

| Branch | Purpose | Status |
|--------|---------|--------|
| `master` | Original codebase | ✅ Stable |
| `pre-saas-refactor` | Backup of master before SaaS changes | ✅ Ready |
| `feature/multi-tenant-saas` | Current development branch with SaaS foundation | 🚧 In Progress |

---

## What's Been Completed ✓

### Database Layer
- [x] **Organizations table** created with fields:
  - `id`, `name`, `slug` (unique)
  - `plan`, `subscriptionId`, `status`
  - `seatLimit`, `settings`
  - `createdAt`, `updatedAt`
- [x] **organizationId foreign keys** added to:
  - `users`
  - `workspaces`
  - `workspace_documents`
  - `invites`
  - `api_keys`
  - `crm_pipelines`
- [x] **Indexes** created on organizationId columns
- [x] **Migration applied**: `20251224115748_add_multi_tenant_organizations`

### Server Layer
- [x] **Organization model** created (`server/models/organization.js`):
  - CRUD operations (create, update, get, delete, where)
  - Seat limit validation functions
  - Statistics functions (users, workspaces, documents, invites)
  - Remaining seats calculation
- [x] **Organization API endpoints** created (`server/endpoints/organization.js`):
  - `GET /organizations` - List all organizations
  - `GET /organizations/:id` - Get organization details
  - `POST /organizations/new` - Create organization
  - `POST /organizations/:id` - Update organization
  - `DELETE /organizations/:id` - Delete organization
  - `GET /organizations/:id/stats` - Get organization statistics
  - `GET /organizations/:id/users` - List organization users
  - `GET /organizations/:id/workspaces` - List organization workspaces
  - `GET /organizations/:id/remaining-seats` - Check remaining seats
- [x] **User model** updated (`server/models/user.js`):
  - Added `organizationId` to writable fields
  - Added validation for organizationId
- [x] **Workspace model** updated (`server/models/workspace.js`):
  - Added `organizationId` to writable fields
  - Added validation for organizationId
- [x] **Tenant isolation middleware** created (`server/utils/middleware/tenantIsolation.js`):
  - `isSuperAdmin()` - Detect super admin users (no organizationId)
  - `getOrganizationFilter()` - Build WHERE clause for organization filtering
  - `applyOrganizationFilter()` - Apply filter to Prisma queries
  - `canAccessOrganization()` - Check access to organization
  - `canAccessWorkspace()` - Check access to workspace
  - `tenantIsolationMiddleware()` - Express middleware for automatic filtering
  - `isSeatLimitExceeded()` - Check seat limit
- [x] **JWT helper** created (`server/utils/http/index.js`):
  - `makeJWTWithOrg()` - Create JWT with organization context
- [x] **Validated request middleware** updated (`server/utils/middleware/validatedRequest.js`):
  - Integrated tenant isolation middleware
- [x] **Server index** updated (`server/index.js`):
  - Registered organization endpoints

### Frontend Layer
- [x] **Organization frontend model** created (`frontend/src/models/organization.js`):
  - `getAll()` - Fetch all organizations
  - `get()` - Fetch single organization
  - `getStats()` - Get organization statistics
  - `getUsers()` - Get organization users
  - `getWorkspaces()` - Get organization workspaces
  - `getRemainingSeats()` - Check remaining seats
  - `create()` - Create organization
  - `update()` - Update organization
  - `delete()` - Delete organization

---

## Remaining Tasks

### Phase 1: Authentication & Query Filtering

- [ ] **Update JWT token generation** (`server/utils/http/index.js`)
  - Add `organizationId` and `role` to JWT payload
  - Update token verification to extract organization context
  - Store organization context in request object

- [ ] **Update authentication endpoints** (`server/endpoints/auth.js` or related)
  - Include organizationId in login response
  - Include organizationId in registration response
  - Update password reset flow to preserve organization context

- [ ] **Update all model queries** to filter by organizationId
  - **User model** (`server/models/user.js`):
    - [ ] Update `all()` to filter by organizationId
    - [ ] Update `count()` to filter by organizationId
    - [ ] Update `get()` to check organizationId
    - [ ] Update `delete()` to check organizationId
  - **Workspace model** (`server/models/workspace.js`):
    - [ ] Update `all()` to filter by organizationId
    - [ ] Update `where()` to filter by organizationId
    - [ ] Update `get()` to check organizationId
    - [ ] Update `delete()` to check organizationId
  - **Document model** (if exists):
    - [ ] Update all queries to filter by organizationId
  - **Invite model** (`server/models/invite.js`):
    - [ ] Update all queries to filter by organizationId
  - **API Key model** (`server/models/apiKey.js`):
    - [ ] Update all queries to filter by organizationId
  - **CRM Pipeline model** (if exists):
    - [ ] Update all queries to filter by organizationId
  - **Any other models** that reference organizationId:
    - [ ] Update queries to filter by organizationId

### Phase 2: Frontend Organization Management UI

- [ ] **Create Organizations Management Page**
  - [ ] Create page: `frontend/src/pages/Organizations/index.jsx`
  - [ ] Add route to frontend routing configuration
  - [ ] Add sidebar/ navigation item
  - Features:
    - [ ] List all organizations (table view)
    - [ ] Create new organization button
    - [ ] Edit organization button
    - [ ] Delete organization button
    - [ ] View organization details (name, slug, plan, seat limit, status)
    - [ ] Display organization statistics (users count, workspaces count, documents count)

- [ ] **Create Organization Form Component**
  - [ ] Create: `frontend/src/pages/Organizations/OrganizationForm.jsx`
  - Fields:
    - [ ] Name (required)
    - [ ] Slug (auto-generated from name, editable)
    - [ ] Plan selection (dropdown: free, pro, enterprise)
    - [ ] Seat limit (number input)
    - [ ] Status (dropdown: active, suspended, trial)
  - Validation:
    - [ ] Slug uniqueness check
    - [ ] Required field validation

- [ ] **Create Organization Details Component**
  - [ ] Create: `frontend/src/pages/Organizations/OrganizationDetails.jsx`
  - Display:
    - [ ] Organization information
    - [ ] Users list with roles
    - [ ] Workspaces list
    - [ ] Remaining seats
    - [ ] Billing information (placeholder for integration)

### Phase 3: User-to-Organization Assignment

- [ ] **Update User Management Page**
  - [ ] Modify: `frontend/src/pages/GeneralSettings/Chats/*` or user settings page
  - Add organization assignment:
    - [ ] Dropdown to select organization
    - [ ] Role selection (owner, admin, member, viewer)
    - [ ] Update user endpoint to save organizationId

- [ ] **Create Organization Users Page**
  - [ ] Create: `frontend/src/pages/Organizations/OrganizationUsers.jsx`
  - Features:
    - [ ] List users in organization
    - [ ] Add user to organization (by email or create new)
    - [ ] Remove user from organization
    - [ ] Update user role in organization
    - [ ] Display remaining seats count

### Phase 4: Organization Settings Page

- [ ] **Create Organization Settings Component**
  - [ ] Create: `frontend/src/pages/Organizations/OrganizationSettings.jsx`
  - Sections:
    - [ ] General settings (name, slug)
    - [ ] Plan display and billing status
    - [ ] Seat limit management
    - [ ] Customization settings (logo, colors - if applicable)
    - [ ] Notification settings

### Phase 5: Multi-Admin Dashboard

- [ ] **Create Super Admin Dashboard**
  - [ ] Create: `frontend/src/pages/SuperAdmin/index.jsx`
  - Only accessible by super admins (users without organizationId)
  - Features:
    - [ ] List all organizations
    - [ ] Organization statistics overview
    - [ ] User counts per organization
    - [ ] System-wide metrics
    - [ ] Quick actions (create org, suspend org, etc.)

- [ ] **Add Organization Switcher**
  - [ ] Create: `frontend/src/components/OrganizationSwitcher.jsx`
  - For super admins to switch between organization contexts
  - Display in header or sidebar when logged in as super admin

### Phase 6: Organization Signup/Registration Flow

- [ ] **Create Organization Registration Page**
  - [ ] Create: `frontend/src/pages/Register/index.jsx` (or modify existing)
  - Steps:
    - [ ] Account information (name, email, password)
    - [ ] Organization information (name, slug)
    - [ ] Plan selection (with pricing info)
    - [ ] Email verification

- [ ] **Update Registration Endpoint**
  - [ ] Modify server registration endpoint
  - [ ] Create organization on user registration
  - [ ] Assign user as organization owner
  - [ ] Send verification email

### Phase 7: Email Verification

- [ ] **Implement Email Verification**
  - [ ] Create verification token model/table
  - [ ] Add verification endpoint (`POST /api/verify-email`)
  - [ ] Send verification email on registration
  - [ ] Update login to check email verification status
  - [ ] Resend verification email functionality
  - [ ] Update registration page to show verification status

### Phase 8: Workspace Isolation Enforcement

- [ ] **Update Workspace Queries**
  - [ ] Ensure all workspace lists are filtered by organizationId
  - [ ] Ensure workspace creation respects organization context
  - [ ] Add organizationId to workspace-related API responses

- [ ] **Update Workspace Access Control**
  - [ ] Validate organizationId on workspace access
  - [ ] Prevent cross-organization workspace sharing
  - [ ] Update workspace permissions to include organization context

### Phase 9: Billing Integration (Placeholder)

- [ ] **Add Billing Infrastructure**
  - [ ] Create billing service (`server/services/billing.js`)
  - [ ] Add webhook endpoints for Stripe/Paddle (placeholder)
  - [ ] Add subscription status update logic
  - [ ] Add seat limit enforcement logic

### Phase 10: Documentation

- [ ] **Create Architecture Documentation**
  - [ ] File: `docs/MULTI_TENANT_ARCHITECTURE.md`
  - Content:
    - [ ] System architecture diagram
    - [ ] Data model relationships
    - [ ] Tenant isolation explanation
    - [ ] Security considerations

- [ ] **Create Setup Documentation**
  - [ ] File: `docs/MULTI_TENANT_SETUP.md`
  - Content:
    - [ ] How to create first organization
    - [ ] How to assign users to organizations
    - [ ] How to manage seats
    - [ ] How to upgrade plans

- [ ] **Create Developer Documentation**
  - [ ] File: `docs/MULTI_TENANT_API.md`
  - Content:
    - [ ] API endpoints for organizations
    - [ ] How to add organization filtering to new models
    - [ ] How to implement multi-tenant features

### Phase 11: Testing

- [ ] **Create Integration Tests**
  - [ ] Test: Organization CRUD operations
  - [ ] Test: User-to-organization assignment
  - [ ] Test: Tenant isolation (cross-org data access prevention)
  - [ ] Test: Seat limit enforcement
  - [ ] Test: Super admin capabilities
  - [ ] Test: Workspace isolation

- [ ] **Create E2E Tests**
  - [ ] Test: Organization registration flow
  - [ ] Test: User signup with organization
  - [ ] Test: Organization switching
  - [ ] Test: Multi-user within same organization

### Phase 12: Deployment

- [ ] **Create Deployment Guide**
  - [ ] File: `docs/MULTI_TENANT_DEPLOYMENT.md`
  - Content:
    - [ ] Database migration steps
    - [ ] Environment variables needed
    - [ ] EasyPanel deployment instructions
    - [ ] Production considerations

- [ ] **Update Docker Configuration**
  - [ ] Update `docker/Dockerfile` if needed
  - [ ] Update `docker/docker-compose.yml` if needed
  - [ ] Add health checks for organization service

---

## Important Notes

### Database Migration Issue
There is a failed migration (`20251224080000_add_proposal_crm_integration`) that may need to be resolved before deploying to EasyPanel. Options:
1. Use `npx prisma migrate resolve --applied "20251224080000_add_proposal_crm_integration"`
2. Reset database with `npx prisma migrate reset` (loses all data)
3. Create a fresh database for testing

### Current Branch Status
- Branch: `feature/multi-tenant-saas`
- All changes committed
- Pushed to origin
- Ready for continued development

### File Locations Reference
```
server/
├── prisma/
│   └── schema.prisma                    # Database schema
├── models/
│   ├── organization.js                  # Organization data model
│   ├── user.js                          # User model (updated)
│   └── workspace.js                     # Workspace model (updated)
├── endpoints/
│   └── organization.js                  # Organization API endpoints
└── utils/
    └── middleware/
        ├── tenantIsolation.js          # Tenant isolation middleware
        └── validatedRequest.js         # Updated with tenant isolation

frontend/
└── src/
    └── models/
        └── organization.js              # Organization frontend model
```

---

## Next Steps

1. Start with **Phase 1: Authentication & Query Filtering** - this is critical for data isolation
2. Then move to **Phase 2: Frontend Organization Management UI** - for user interaction
3. Continue through phases in order
4. Test each phase before moving to the next

---

## Contact

If questions arise during implementation, reference:
- Original architecture planning in `plans/multi-tenant-saas-plan.md`
- Existing code in `server/models/organization.js` for patterns
- Existing middleware in `server/utils/middleware/tenantIsolation.js` for isolation logic
