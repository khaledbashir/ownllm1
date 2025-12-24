# Multi-Tenant Setup Guide

This guide explains how to set up and manage multi-tenant SaaS functionality in AnythingLLM.

## Prerequisites

- AnythingLLM instance with multi-user mode enabled
- PostgreSQL database
- SMTP server configured (for email verification)
- Admin access (super admin role)

## Initial Setup

### 1. Enable Multi-User Mode

If not already enabled, enable multi-user mode in your environment:

```bash
ENABLE_MULTI_USER=true
```

### 2. Configure Email Service

Email verification is required for new users. Configure SMTP settings:

```bash
# Email Configuration
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

Note: In development mode, emails will be logged to the console if SMTP is not configured.

### 3. Run Database Migrations

Ensure your database is up to date:

```bash
cd server
npx prisma migrate deploy
```

## Creating Your First Organization

### Method 1: Using the API

As a super admin, create an organization via API:

```bash
curl -X POST http://localhost:3001/api/organization/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "plan": "free",
    "seatLimit": 5,
    "status": "active"
  }'
```

Response:
```json
{
  "organization": {
    "id": 1,
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "plan": "free",
    "seatLimit": 5,
    "status": "active",
    "createdAt": "2025-01-15T10:00:00.000Z"
  },
  "success": true
}
```

### Method 2: Using the Registration Flow

New users can create an organization during registration:

1. Navigate to `/register` in your application
2. Fill in account information (username, email, password)
3. Fill in organization information (name, plan selection)
4. Submit the form

A verification email will be sent. Click the link in the email to verify the account.

## Assigning Users to Organizations

### Inviting Users

To invite users to an organization:

1. Navigate to **Settings → Organization**
2. Click **Invite User**
3. Enter the username and role for the new user
4. Submit the invite

The user will receive a link to join your organization.

### Direct User Assignment (API Only)

As a super admin, you can directly assign users:

```bash
curl -X POST http://localhost:3001/api/user/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 5,
    "organizationId": 1
  }'
```

## Managing Seats

### Checking Seat Usage

Check the current seat usage for an organization:

```bash
curl -X GET http://localhost:3001/api/billing/seat-limit/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "exceeded": false,
    "current": 3,
    "limit": 5,
    "remaining": 2
  }
}
```

### What Happens When Seats Are Full

- **Registration**: Users cannot register for organizations with full seats
- **Invites**: New invites cannot be accepted if the organization is at capacity
- **Error Message**: Users see: "Organization has reached its seat limit (5). Please upgrade your plan to add more users."

## Upgrading Plans

### Plan Levels

| Plan | Seats | Description |
|------|-------|-------------|
| Free | 5 | Basic plan with 5 seats |
| Pro | 25 | Pro plan with 25 seats |
| Enterprise | 100 | Enterprise plan with 100 seats |

### Upgrading via API

```bash
curl -X POST http://localhost:3001/api/billing/update-plan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 1,
    "plan": "pro"
  }'
```

### Billing Integration

For production use, integrate with a payment provider:

1. **Stripe Setup**:
   - Configure webhook endpoint: `https://your-domain.com/api/billing/webhook/stripe`
   - Set up subscription products in Stripe
   - Configure webhooks for subscription events

2. **Paddle Setup**:
   - Configure webhook endpoint: `https://your-domain.com/api/billing/webhook/paddle`
   - Set up subscription products in Paddle
   - Configure webhooks for subscription events

## Multi-Admin Organizations

Organizations can have multiple administrators. To add an organization admin:

1. Invite the user to the organization
2. Set their role to `admin`
3. The user will have organization management permissions

### Admin Permissions

Organization admins can:
- View organization settings
- Invite new users
- Manage user roles within the organization
- View organization statistics
- Manage workspaces

## Email Verification

### How It Works

1. User registers → Verification email sent
2. User clicks verification link → Account verified
3. User can now login

### Resending Verification Email

If a user needs a new verification link:

```bash
curl -X POST http://localhost:3001/api/resend-verification-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Bypassing Email Verification (Development Only)

In development mode, you can bypass email verification by setting `emailVerified` directly in the database or updating the user via API.

## Super Admin Management

### Creating a Super Admin

A super admin is a user with `role: "admin"` and `organizationId: null`. They can:

- View all organizations
- Access any organization's data
- Manage billing across all organizations

To create a super admin:

```bash
# Create user via API or registration
# Then update via database or direct API call
curl -X POST http://localhost:3001/api/user/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "role": "admin",
    "organizationId": null
  }'
```

## Troubleshooting

### Users Cannot See Organization Data

- Verify the user has an `organizationId` set
- Check that `tenantIsolation` middleware is active
- Ensure the user is not being filtered by other conditions

### Seat Limit Not Enforced

- Verify `billing.js` is imported in registration/invite endpoints
- Check that `checkSeatLimit()` is being called before user creation
- Ensure the organization's `seatLimit` is correctly set

### Email Verification Not Working

- Verify SMTP settings are correct
- Check email logs in the console (development mode)
- Ensure email verification tokens are not expired
- Check `EmailService` is properly configured

### Webhooks Not Processing

- Verify webhook endpoint URLs are correct
- Check payment provider is sending webhooks to the right URL
- Ensure `verifyWebhookSignature` is configured correctly
- Check for any firewall issues blocking webhook requests

## API Reference

### Organization Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/organizations` | List all organizations (super admin) |
| GET | `/organizations/:id` | Get organization details |
| GET | `/organizations/:id/stats` | Get organization statistics |
| POST | `/api/organization/create` | Create new organization |
| PUT | `/api/organization/:id` | Update organization |
| DELETE | `/api/organization/:id` | Delete organization |

### Billing Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/billing/seat-limit/:id` | Check seat usage |
| GET | `/api/billing/organization/:id` | Get billing info |
| POST | `/api/billing/update-plan` | Update plan |
| POST | `/api/billing/webhook/stripe` | Stripe webhook |
| POST | `/api/billing/webhook/paddle` | Paddle webhook |

### Email Verification Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/verify-email` | Verify email with token |
| POST | `/api/resend-verification-email` | Resend verification |
| POST | `/api/send-welcome-email` | Send welcome email |

## Next Steps

After completing initial setup:

1. Configure your payment provider for automatic plan upgrades
2. Set up monitoring for organization metrics
3. Create custom organization branding
4. Configure additional security settings
5. Set up audit logging for compliance

For more details on the architecture, see [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md).
