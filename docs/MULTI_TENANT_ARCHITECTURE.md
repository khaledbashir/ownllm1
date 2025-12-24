# Multi-Tenant SaaS Architecture

This document describes the architecture of the multi-tenant SaaS implementation for AnythingLLM.

## Overview

The multi-tenant architecture allows AnythingLLM to serve multiple organizations (tenants) with complete data isolation, billing controls, and role-based access management.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AnythingLLM SaaS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │  Super Admin     │    │  Organization    │                 │
│  │  (role: admin,   │    │  Admin          │                 │
│  │   orgId: null)   │    │  (role: admin,   │                 │
│  │                  │    │   orgId: N)      │                 │
│  │  - View all orgs │    │  - Manage org    │                 │
│  │  - Manage billing │    │  - Invite users  │                 │
│  │  - Monitor usage  │    │  - Manage seats   │                 │
│  └──────────────────┘    └──────────────────┘                 │
│           │                        │                           │
│           ▼                        ▼                           │
│  ┌──────────────────────────────────────────────┐              │
│  │         JWT with Organization Context          │              │
│  │  { id, username, role, organizationId }     │              │
│  └──────────────────────────────────────────────┘              │
│                        │                                       │
│                        ▼                                       │
│  ┌──────────────────────────────────────────────┐              │
│  │         Tenant Isolation Middleware          │              │
│  │  - Enforces organizationId filtering        │              │
│  │  - Super Admin bypass                       │              │
│  └──────────────────────────────────────────────┘              │
│                        │                                       │
│        ┌───────────────┼───────────────┐                       │
│        ▼               ▼               ▼                       │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                   │
│  │Org Data │    │ Users   │    │Workspc  │                   │
│  │         │    │         │    │         │                   │
│  │orgId:N  │    │orgId:N  │    │orgId:N  │                   │
│  └─────────┘    └─────────┘    └─────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model Relationships

### Core Entities

```
Organization
├── id (PK)
├── name
├── slug (unique)
├── plan (free|pro|enterprise)
├── seatLimit (derived from plan)
├── status (active|suspended)
├── subscriptionId (external billing provider)
└── Users (1:N)
    ├── id (PK)
    ├── username
    ├── email
    ├── emailVerified
    ├── password
    ├── role (admin|default)
    ├── organizationId (FK)
    └── Workspaces (1:N)
        ├── id (PK)
        ├── name
        ├── organizationId (FK)
        └── Documents (1:N)
```

### Isolation Strategy

All data access is filtered by `organizationId` using:

1. **Database Level**: Prisma queries include `where: { organizationId: ... }`
2. **Middleware Level**: `tenantIsolation` middleware automatically adds filtering
3. **Model Level**: Each model has `whereWithOrg` helper methods

## Tenant Isolation

### How Isolation Works

1. **JWT Token**: Contains user's `organizationId` in the payload
2. **Middleware**: `tenantIsolation()` middleware intercepts requests
3. **Query Filtering**: All queries are automatically filtered by organization
4. **Super Admin Bypass**: Users with `role: admin` and `organizationId: null` can see all data

### Isolation Rules

| Resource | Isolation Method | Super Admin Access |
|----------|------------------|-------------------|
| Organizations | None (list view) | Full access |
| Users | By `organizationId` | Full access |
| Workspaces | By `organizationId` | Full access |
| Documents | By workspace → `organizationId` | Full access |
| API Keys | By `organizationId` | Full access |
| Invites | By `organizationId` | Full access |

### Example Query Flow

```
User Request (JWT: orgId=5)
    ↓
Tenant Isolation Middleware
    ↓
Query: Workspace.where({ organizationId: 5 })
    ↓
Filtered Results
```

## Security Considerations

### Authentication

- **JWT Tokens**: Signed with secret key, contain user identity and organization context
- **Password Hashing**: Uses bcrypt with salt rounds
- **Email Verification**: Required for new users before login

### Authorization

- **Role-Based Access**: Three roles defined:
  - `super-admin` (admin without organization) - Full system access
  - `admin` (with organization) - Organization administration
  - `default` - Standard organization user

- **Organization Scoping**: All data access is scoped to user's organization

### Data Protection

- **Tenant Isolation**: Automatic filtering prevents cross-tenant data leakage
- **Input Validation**: All user inputs validated before processing
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

### Billing Security

- **Webhook Verification**: Payment provider signatures verified (Stripe, Paddle)
- **Seat Limit Enforcement**: Checked before user creation
- **Plan-Based Access**: Seat limits enforced at registration and invite acceptance

## Component Breakdown

### Backend Components

| Component | Location | Purpose |
|-----------|-----------|---------|
| `server/models/organization.js` | Data Model | Organization CRUD operations |
| `server/models/emailVerificationTokens.js` | Data Model | Email token management |
| `server/services/billing.js` | Service | Billing operations, seat limits |
| `server/utils/emailService.js` | Utility | Email sending |
| `server/utils/middleware/tenantIsolation.js` | Middleware | Automatic query filtering |
| `server/endpoints/organization.js` | API | Organization endpoints |
| `server/endpoints/billing.js` | API | Billing/webhook endpoints |
| `server/endpoints/system.js` | API | Registration, email verification |

### Frontend Components

| Component | Location | Purpose |
|-----------|-----------|---------|
| `OrganizationManagement` | Sidebar | Multi-admin organization switcher |
| `Settings/General` | Settings | Organization settings page |
| `Register` | Pages | New user registration |
| `VerifyEmail` | Pages | Email verification page |
| `Organization` | Model | API client for organizations |
| `paths.js` | Utils | Path definitions |

## Plan Configuration

| Plan | Seat Limit | Features |
|------|------------|----------|
| Free | 5 | Basic features, limited seats |
| Pro | 25 | Extended features, more seats |
| Enterprise | 100 | All features, maximum seats |

## Billing Integration

### Payment Providers

The architecture supports placeholder integration with:
- **Stripe**: Webhook endpoint at `/api/billing/webhook/stripe`
- **Paddle**: Webhook endpoint at `/api/billing/webhook/paddle`

### Webhook Events

| Event | Action |
|-------|--------|
| subscription.created | Set org status to active |
| subscription.updated | Update org status |
| subscription.deleted | Set org status to suspended |
| payment.succeeded | Ensure org status is active |
| payment.failed | Set org status to suspended |

## Deployment Considerations

### Environment Variables

Required for multi-tenant operation:
- `JWT_SECRET`: Secret for JWT signing
- `ENABLE_MULTI_USER`: Enable multi-user mode
- SMTP settings for email verification:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - `SMTP_FROM`

### Database

- PostgreSQL is required (for multi-tenant support)
- Run migrations: `npx prisma migrate dev`

### Scaling

- **Read Replicas**: Can be added for scaling read operations
- **Connection Pooling**: Use pgBouncer or similar for connection pooling
- **Horizontal Scaling**: Multiple instances with shared database

## Future Enhancements

1. **Advanced Billing**: Full Stripe/Paddle integration with checkout flows
2. **Audit Logging**: Comprehensive audit trail for multi-tenant operations
3. **Organization-Level Settings**: Per-organization configuration
4. **API Rate Limiting**: Per-organization rate limiting
5. **Data Export**: Tenant-specific data export functionality
