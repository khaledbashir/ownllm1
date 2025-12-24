# Multi-Tenant API Documentation

This document provides developer guidance for working with the multi-tenant AnythingLLM API.

## Table of Contents

- [Organization API Endpoints](#organization-api-endpoints)
- [Billing API Endpoints](#billing-api-endpoints)
- [Email Verification Endpoints](#email-verification-endpoints)
- [Adding Organization Filtering](#adding-organization-filtering)
- [Implementing Multi-Tenant Features](#implementing-multi-tenant-features)

---

## Organization API Endpoints

### Get All Organizations

**Endpoint:** `GET /organizations`

**Authentication:** Required (Super Admin only)

**Description:** Returns a list of all organizations. Only accessible to super admins.

**Response:**
```json
{
  "organizations": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "plan": "free",
      "seatLimit": 5,
      "status": "active",
      "subscriptionId": "sub_123abc",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### Get Organization by ID

**Endpoint:** `GET /organizations/:id`

**Authentication:** Required

**Description:** Returns a single organization. Users can only view their own organization.

**Parameters:**
- `id` (path) - Organization ID

**Response:**
```json
{
  "organization": {
    "id": 1,
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "plan": "free",
    "seatLimit": 5,
    "status": "active",
    "subscriptionId": "sub_123abc",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Get Organization Statistics

**Endpoint:** `GET /organizations/:id/stats`

**Authentication:** Required

**Description:** Returns statistics for an organization including user count, workspace count, and document count.

**Parameters:**
- `id` (path) - Organization ID

**Response:**
```json
{
  "usersCount": 3,
  "workspacesCount": 5,
  "documentsCount": 42,
  "storageUsed": 1048576
}
```

### Create Organization

**Endpoint:** `POST /api/organization/create`

**Authentication:** Required

**Description:** Creates a new organization. Available to super admins and during registration.

**Request Body:**
```json
{
  "name": "New Company",
  "slug": "new-company",
  "plan": "free",
  "seatLimit": 5,
  "status": "active"
}
```

**Response:**
```json
{
  "organization": {
    "id": 2,
    "name": "New Company",
    "slug": "new-company",
    "plan": "free",
    "seatLimit": 5,
    "status": "active",
    "subscriptionId": null,
    "createdAt": "2025-01-15T11:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  },
  "success": true
}
```

### Update Organization

**Endpoint:** `PUT /api/organization/:id`

**Authentication:** Required

**Description:** Updates an organization's information. Only organization admins and super admins can update.

**Parameters:**
- `id` (path) - Organization ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "plan": "pro",
  "seatLimit": 25
}
```

**Response:**
```json
{
  "organization": {
    "id": 1,
    "name": "Updated Name",
    "slug": "acme-corp",
    "plan": "pro",
    "seatLimit": 25,
    "status": "active",
    "subscriptionId": "sub_123abc",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  },
  "success": true
}
```

### Delete Organization

**Endpoint:** `DELETE /api/organization/:id`

**Authentication:** Required (Super Admin only)

**Description:** Deletes an organization and all associated data. This operation is irreversible.

**Parameters:**
- `id` (path) - Organization ID

**Response:**
```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

---

## Billing API Endpoints

### Check Seat Limit

**Endpoint:** `GET /api/billing/seat-limit/:organizationId`

**Authentication:** Required

**Description:** Checks the current seat usage for an organization.

**Parameters:**
- `organizationId` (path) - Organization ID

**Response:**
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

### Get Billing Information

**Endpoint:** `GET /api/billing/organization/:organizationId`

**Authentication:** Required

**Description:** Returns billing information for an organization.

**Parameters:**
- `organizationId` (path) - Organization ID

**Response:**
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": 1,
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "plan": "pro",
      "status": "active",
      "seatLimit": 25,
      "subscriptionId": "sub_123abc"
    },
    "seatLimit": {
      "exceeded": false,
      "current": 8,
      "limit": 25,
      "remaining": 17
    }
  }
}
```

### Update Plan

**Endpoint:** `POST /api/billing/update-plan`

**Authentication:** Required

**Description:** Updates the plan for an organization.

**Request Body:**
```json
{
  "organizationId": 1,
  "plan": "enterprise"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan updated successfully"
}
```

### Stripe Webhook

**Endpoint:** `POST /api/billing/webhook/stripe`

**Authentication:** Signature verification required

**Description:** Receives webhook events from Stripe for subscription management.

**Headers:**
- `stripe-signature` - Stripe webhook signature

**Supported Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Response:**
```json
{
  "received": true
}
```

### Paddle Webhook

**Endpoint:** `POST /api/billing/webhook/paddle`

**Authentication:** Signature verification required

**Description:** Receives webhook events from Paddle for subscription management.

**Headers:**
- `paddle-signature` - Paddle webhook signature

**Supported Events:**
- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.payment_succeeded`
- `subscription.payment_failed`

**Response:**
```json
{
  "received": true
}
```

---

## Email Verification Endpoints

### Verify Email

**Endpoint:** `GET /api/verify-email`

**Description:** Verifies a user's email address using a verification token.

**Query Parameters:**
- `token` - Email verification token

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### Resend Verification Email

**Endpoint:** `POST /api/resend-verification-email`

**Authentication:** Optional

**Description:** Sends a new verification email to the user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### Send Welcome Email

**Endpoint:** `POST /api/send-welcome-email`

**Authentication:** Required

**Description:** Sends a welcome email to a newly verified user.

**Request Body:**
```json
{
  "userId": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome email sent"
}
```

---

## Adding Organization Filtering

### Step 1: Add Organization Column to Prisma Schema

First, ensure your model has an `organizationId` field:

```prisma
model YourModel {
  id              Int            @id @default(autoincrement())
  name            String
  organizationId   Int?
  organization    Organization?  @relation(fields: [organizationId], references: [id])
  
  @@index([organizationId])
}
```

Add the relation to the Organization model:

```prisma
model Organization {
  id          Int        @id @default(autoincrement())
  name        String
  slug        String     @unique
  // ... other fields
  yourModels  YourModel[]
}
```

### Step 2: Update Model Helper Methods

In `server/models/yourModel.js`, add organization-aware methods:

```javascript
const prisma = require("../utils/prisma");

const YourModel = {
  /**
   * Get with organization filtering
   */
  whereWithOrg: async function (organizationId = null, clause = {}) {
    try {
      return await prisma.your_models.findMany({
        where: {
          organizationId: organizationId,
          ...clause
        },
        orderBy: { id: "desc" },
      });
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  /**
   * Get by ID with organization check
   */
  getWithOrg: async function (id, organizationId = null) {
    try {
      return await prisma.your_models.findUnique({
        where: {
          id: Number(id),
          organizationId: organizationId,
        },
      });
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  /**
   * Delete with organization check
   */
  deleteWithOrg: async function (id, organizationId = null) {
    try {
      return await prisma.your_models.deleteMany({
        where: {
          id: Number(id),
          organizationId: organizationId,
        },
      });
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },
};

module.exports = { YourModel };
```

### Step 3: Create Tenant Isolation Middleware (Optional)

If your endpoint needs automatic filtering, create middleware:

```javascript
// server/utils/middleware/tenantIsolation.js
const { userFromSession } = require("../http");

async function tenantIsolation(request, response, next) {
  try {
    const user = await userFromSession(request, response);
    
    // Super admins can bypass isolation
    if (user.role === "admin" && !user.organizationId) {
      return next();
    }
    
    // Add organizationId to request for filtering
    request.user = { ...request.user, organizationId: user.organizationId };
    
    next();
  } catch (error) {
    console.error("Tenant isolation error:", error);
    response.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { tenantIsolation };
```

### Step 4: Update Endpoints to Use Organization Filtering

In your endpoint file, use the organization-aware methods:

```javascript
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { YourModel } = require("../models/yourModel");

function yourModelEndpoints(app) {
  if (!app) return;

  app.get(
    "/your-model",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        
        // Filter by organization
        const items = await YourModel.whereWithOrg(currUser.organizationId);
        
        response.json({ items });
      } catch (e) {
        console.error(e);
        response.status(500).end();
      }
    }
  );

  app.post(
    "/your-model",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        const data = reqBody(request);
        
        // Include organizationId when creating
        const item = await YourModel.new({
          ...data,
          organizationId: currUser.organizationId,
        });
        
        response.json({ item });
      } catch (e) {
        console.error(e);
        response.status(500).end();
      }
    }
  );

  app.delete(
    "/your-model/:id",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        const { id } = request.params;
        
        // Delete with organization check
        await YourModel.deleteWithOrg(id, currUser.organizationId);
        
        response.json({ success: true });
      } catch (e) {
        console.error(e);
        response.status(500).end();
      }
    }
  );
}

module.exports = { yourModelEndpoints };
```

---

## Implementing Multi-Tenant Features

### Registration with Organization

When implementing user registration, create the organization first:

```javascript
// Frontend: frontend/src/pages/Register/index.jsx
import Organization from "../../models/Organization";

async function handleRegister(data) {
  try {
    // Create organization first
    const orgResponse = await Organization.create({
      name: data.orgName,
      slug: generateSlug(data.orgName),
      plan: data.plan,
    });
    
    if (!orgResponse?.organization) {
      throw new Error("Failed to create organization");
    }
    
    // Register user with organization
    const registerResponse = await fetch("/api/register-with-organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        email: data.email,
        organizationId: orgResponse.organization.id,
      }),
    });
    
    // Handle response...
  } catch (error) {
    console.error("Registration error:", error);
  }
}
```

### Checking Seat Limits

Before creating new users, check seat limits:

```javascript
const { checkSeatLimit } = require("../services/billing");

async function createNewUser(organizationId, userData) {
  // Check seat limit
  const seatCheck = await checkSeatLimit(organizationId);
  
  if (seatCheck.exceeded) {
    return {
      success: false,
      error: `Organization has reached its seat limit (${seatCheck.limit}). Please upgrade your plan.`,
    };
  }
  
  // Proceed with user creation
  const user = await User.create({
    ...userData,
    organizationId,
  });
  
  return { success: true, user };
}
```

### Using JWT with Organization Context

When making authenticated requests, the JWT contains organization context:

```javascript
// Backend: Accessing organization context from JWT
const { userFromSession } = require("../utils/http");

app.get(
  "/api/some-endpoint",
  [validatedRequest],
  async (request, response) => {
    const user = await userFromSession(request, response);
    
    // Access organization ID
    const organizationId = user.organizationId;
    
    // Super admin check
    const isSuperAdmin = user.role === "admin" && !user.organizationId;
    
    // Use organizationId for queries
    const items = await YourModel.whereWithOrg(
      isSuperAdmin ? null : organizationId
    );
    
    response.json({ items });
  }
);
```

### Frontend API Client with Organization

Create a model class for API calls:

```javascript
// frontend/src/models/Organization.js
import { API_BASE } from "../utils/config";

const Organization = {
  create: async function (data) {
    return await fetch(`${API_BASE}/api/organization/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    }).then((res) => res.json());
  },

  get: async function (id) {
    return await fetch(`${API_BASE}/organizations/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }).then((res) => res.json());
  },

  getStats: async function (id) {
    return await fetch(`${API_BASE}/organizations/${id}/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }).then((res) => res.json());
  },
};

export default Organization;
```

---

## Testing Multi-Tenant Features

### Testing Tenant Isolation

```javascript
// Test that user from org1 cannot access org2's data
const user1 = await login("user1@org1.com");
const org2Data = await fetchData("/your-resource", user1.token);
// Should return empty array or 403 error
```

### Testing Seat Limits

```javascript
// Test that seat limit is enforced
const org = await Organization.get(1);
const usersCount = await getUsersCount(org.id);

// Fill all seats
for (let i = 0; i < org.seatLimit; i++) {
  await createTestUser(org.id);
}

// Next user creation should fail
const result = await createTestUser(org.id);
expect(result.success).toBe(false);
expect(result.error).toContain("seat limit");
```

---

## Best Practices

1. **Always Filter by OrganizationId**: Every query for tenant-specific data must include organization filtering
2. **Use Helper Methods**: Leverage `whereWithOrg` and similar methods for consistency
3. **Check Super Admin Status**: Allow super admins to bypass organization filtering
4. **Validate Organization Membership**: Verify users belong to the organization they're trying to access
5. **Handle Edge Cases**: Consider users with `organizationId: null` (super admins)
6. **Log Tenant Operations**: Include organization context in logs for debugging
7. **Test Cross-Tenant Access**: Ensure no data leakage between organizations

---

## Common Patterns

### Pattern 1: Organization-Aware List Endpoint

```javascript
app.get("/api/resource", [validatedRequest], async (req, res) => {
  const user = await userFromSession(req, res);
  const isSuperAdmin = user.role === "admin" && !user.organizationId;
  
  const resources = await Resource.whereWithOrg(
    isSuperAdmin ? null : user.organizationId
  );
  
  res.json({ resources });
});
```

### Pattern 2: Organization-Aware Create Endpoint

```javascript
app.post("/api/resource", [validatedRequest], async (req, res) => {
  const user = await userFromSession(req, res);
  const data = reqBody(req);
  
  const resource = await Resource.new({
    ...data,
    organizationId: user.organizationId,
  });
  
  res.json({ resource });
});
```

### Pattern 3: Organization-Aware Delete Endpoint

```javascript
app.delete("/api/resource/:id", [validatedRequest], async (req, res) => {
  const user = await userFromSession(req, res);
  const { id } = req.params;
  
  await Resource.deleteWithOrg(id, user.organizationId);
  
  res.json({ success: true });
});
```

For more information on architecture, see [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md).
For setup instructions, see [MULTI_TENANT_SETUP.md](./MULTI_TENANT_SETUP.md).
