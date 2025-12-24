# Multi-Tenant SaaS Testing Guide

**Purpose:** Test and verify multi-tenant SaaS functionality on EasyPanel deployment.

---

## Testing Checklist

### 1. Test Organization Registration Flow

#### Test Scenario: New User with Organization

```
1. Navigate to your EasyPanel deployment URL
2. Click "Register" (or go to /register)
3. Fill in the registration form:

   Account Information:
   ┌─────────────────────────────────┐
   │ Username: testuser            │
   │ Email: test@example.com       │
   │ Password: *********            │
   └─────────────────────────────────┘

   Organization Information:
   ┌─────────────────────────────────┐
   │ Organization Name: Test Org    │
   │ Slug: test-org (auto-gen)     │
   └─────────────────────────────────┘

   Plan Selection:
   ┌─────────────────────────────────┐
   ○ Free (5 seats)             │
   ● Pro (25 seats)              │
   ○ Enterprise (100 seats)      │
   └─────────────────────────────────┘

4. Click "Create Account"
5. Check your email (or console logs for verification token)
6. Click the verification link
7. Login with your credentials
```

**Expected Results:**
- ✅ Account created successfully
- ✅ Organization created automatically
- ✅ Verification email sent (or logged to console)
- ✅ After verification, can login successfully
- ✅ User is organization admin (role: "admin")
- ✅ organizationId is set on user

---

### 2. Test Organization Management (Admin)

#### Test Scenario: Create Additional Organization

```
1. Login as Super Admin (user without organizationId)
   OR Login as an admin user

2. Navigate to Settings → Organizations
   OR directly to /organizations

3. Click "Create Organization"

4. Fill in organization form:
   ┌─────────────────────────────────┐
   │ Name: Second Test Org         │
   │ Slug: second-test-org         │
   │ Plan: Free                   │
   │ Seat Limit: 5                │
   │ Status: Active                │
   └─────────────────────────────────┘

5. Click "Create"

6. View organization details:
   - Click on the organization row
   - Check stats (users, workspaces, documents)
   - Check remaining seats
```

**Expected Results:**
- ✅ Organization created successfully
- ✅ Appears in organizations list
- ✅ Details view shows correct information
- ✅ Stats display (should be 0 for new org)
- ✅ Remaining seats shows 5 (or configured limit)

#### Test Scenario: Edit Organization

```
1. From organization details, click "Edit Organization"

2. Change fields:
   - Name: Updated Org Name
   - Plan: Pro
   - Seat Limit: 25

3. Click "Update"

4. Verify changes in organization list
```

**Expected Results:**
- ✅ Organization updates successfully
- ✅ New name, plan, and seat limit displayed

#### Test Scenario: Delete Organization

```
1. From organization list, click "Delete" on an org

2. Confirm deletion

3. Verify organization no longer in list
```

**Expected Results:**
- ✅ Organization deleted successfully
- ✅ No longer appears in list
- ✅ Associated users' organizationId set to null (if implemented)

---

### 3. Test User-to-Organization Assignment

#### Test Scenario: Assign User to Organization (Super Admin)

```
1. Login as Super Admin
   (Create one by registering with organizationId: null via API)

2. Navigate to Admin → Users

3. Click "Edit" on a user

4. In the Edit User Modal:
   ┌─────────────────────────────────┐
   │ Username: existinguser        │
   │ Role: Manager                │
   │                              │
   │ Organization:                  │
   │   [Test Org ▼]              │  ← Select organization
   │   [None (Super Admin)]        │
   └─────────────────────────────────┘

5. Select an organization
6. Click "Update User"
7. Login as the updated user
```

**Expected Results:**
- ✅ User organizationId is updated
- ✅ User can now access that organization's workspaces
- ✅ User cannot access other organizations' data
- ✅ Organization details show this user in users list

---

### 4. Test Workspace Isolation

#### Test Scenario: Create Workspace in Organization

```
1. Login as user in "Test Org"

2. Navigate to Workspaces

3. Click "Create Workspace"

4. Fill in workspace form:
   ┌─────────────────────────────────┐
   │ Name: Test Workspace         │
   │ Slug: test-workspace         │
   └─────────────────────────────────┘

5. Click "Create"

6. Verify workspace appears in list
```

**Expected Results:**
- ✅ Workspace created successfully
- ✅ Workspace has organizationId set
- ✅ Only users in the same organization can see this workspace

#### Test Scenario: Cross-Organization Access Prevention

```
1. Create two organizations:
   - Org A (user1, workspace1)
   - Org B (user2, workspace2)

2. Login as user1 (Org A)

3. Try to access Org B's workspace:
   - Direct URL: /workspace/workspace2
   - Or via API

4. Expected: Access denied or workspace not found
```

**Expected Results:**
- ✅ User1 cannot access workspace2
- ✅ User1 can only see Org A's workspaces
- ✅ User2 can only see Org B's workspaces

---

### 5. Test Seat Limit Enforcement

#### Test Scenario: Free Plan Seat Limit (5 Seats)

```
1. Create organization with Free plan (5 seats)

2. Invite 4 users to the organization
   - Accept all invites
   - Should succeed

3. Try to invite 5th user

4. Try to register new user directly to this organization
```

**Expected Results:**
- ✅ First 4 users can join successfully
- ✅ Remaining seats shows: 1
- ✅ 5th user invitation/registration should be blocked
- ✅ Error message: "Seat limit reached. Upgrade plan to add more users."

#### Test Scenario: Upgrade Plan and Test Seat Limit

```
1. Update organization plan to Pro (25 seats)

2. Try to invite/register more users

3. Verify remaining seats increases
```

**Expected Results:**
- ✅ Plan update successful
- ✅ Remaining seats now shows: 20 (25 - 5 users)
- ✅ New users can join until limit reached

---

### 6. Test Email Verification

#### Test Scenario: Registration with Email Verification

```
1. Register a new user (see Test 1)

2. Check server console for email logs:
   (SMTP not configured in dev, so emails logged to console)

3. Look for message like:
   "Verification email sent to user@example.com"
   "Verification URL: http://.../verify-email/TOKEN..."

4. Copy the verification token from the URL

5. Visit: /verify-email/TOKEN

6. Should see success message:
   "Email verified successfully! You can now login."

7. Login with credentials
```

**Expected Results:**
- ✅ Verification email sent (or logged to console)
- ✅ Verification link works
- ✅ Email verified flag set to true
- ✅ User can login after verification

#### Test Scenario: Login Before Email Verification

```
1. Register a new user
2. Immediately try to login (without verifying email)

3. Expected: Login blocked or redirected to verification page
```

**Expected Results:**
- ✅ Login prevented or redirect to verify email page
- ✅ Error message: "Please verify your email first"

---

### 7. Test Super Admin Capabilities

#### Test Scenario: Create Super Admin User

```
1. Access database or API directly to create user without organizationId:
   {
     username: "superadmin",
     password: "hashed_password",
     role: "admin",
     organizationId: null  // ← This makes them super admin
   }

2. Login as superadmin

3. Navigate to Super Admin Dashboard (if exists)
   OR Organizations page
```

**Expected Results:**
- ✅ Super admin can see ALL organizations
- ✅ Super admin can view/edit any organization
- ✅ Super admin can view users from any organization
- ✅ Super admin can create/delete organizations

#### Test Scenario: Regular User Cannot Access Other Organizations

```
1. Login as regular user (with organizationId)

2. Try to access:
   - /organizations (all orgs list)
   - Organization details for different org
   - Users from different organization

3. Expected: Access denied or data filtered
```

**Expected Results:**
- ✅ Regular user can only see their own organization
- ✅ Cannot access other organizations' data
- ✅ API returns 403 or filtered results

---

### 8. Test Tenant Isolation (API Level)

#### Test Scenario: Cross-Organization Data Access Prevention

```
Use API endpoints to test isolation:

1. Get JWT token for user1 (Org A):
   POST /api/v1/auth/login
   { username: "user1", password: "..." }
   → Save token

2. Try to access Org B's data:
   GET /api/v1/organizations/:orgBId
   Authorization: Bearer <user1_token>

3. Expected: 403 Forbidden or 404 Not Found
```

**Expected Results:**
- ✅ Request denied for different organization
- ✅ Error message: "Access denied" or similar
- ✅ Only organization owner/admin can access org details

#### Test Scenario: Workspace Query Filtering

```
1. Login as user1 (Org A)
2. GET /api/v1/workspaces
3. Verify response only includes Org A's workspaces

4. Login as user2 (Org B)
5. GET /api/v1/workspaces
6. Verify response only includes Org B's workspaces
```

**Expected Results:**
- ✅ Each user sees only their organization's workspaces
- ✅ No cross-organization data leakage

---

## Testing Commands

### 1. Create Super Admin User (via API)

```bash
# First, create a regular user via registration
curl -X POST http://your-domain.com/api/v1/auth/register-with-organization \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "SecurePassword123!",
    "email": "superadmin@example.com",
    "organization": null
  }'

# Then manually update via Prisma Studio or direct DB query
# UPDATE users SET organizationId = NULL WHERE username = 'superadmin';
```

### 2. Check Organization Statistics

```bash
# Get org stats
curl -X GET http://your-domain.com/api/v1/organizations/1/stats \
  -H "Authorization: Bearer <token>"

# Expected response:
{
  "stats": {
    "userCount": 3,
    "workspaceCount": 5,
    "documentCount": 20,
    "pendingInviteCount": 1
  }
}
```

### 3. Check Seat Limit Status

```bash
# Get seat limit info
curl -X GET http://your-domain.com/api/billing/seat-limit/1 \
  -H "Authorization: Bearer <token>"

# Expected response:
{
  "exceeded": false,
  "current": 3,
  "limit": 5,
  "remaining": 2
}
```

### 4. Update Organization Plan

```bash
# Upgrade to Pro plan
curl -X POST http://your-domain.com/api/billing/update-plan \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 1,
    "plan": "pro",
    "seatLimit": 25
  }'
```

---

## Manual Testing Checklist

Print this and check off as you test:

### Registration & Onboarding
- [ ] New user can register
- [ ] Organization created on registration
- [ ] Verification email sent (logged)
- [ ] User can verify email via link
- [ ] Verified user can login

### Organization Management
- [ ] Organizations list loads
- [ ] Can create new organization
- [ ] Can edit organization details
- [ ] Can delete organization
- [ ] Organization stats display correctly
- [ ] Remaining seats display correctly

### User Assignment
- [ ] Super admin can assign users to organizations
- [ ] Admin can assign users to their org
- [ ] User assignment updates database
- [ ] Assigned user can access organization

### Workspace Isolation
- [ ] User can create workspace in their org
- [ ] User cannot see other orgs' workspaces
- [ ] Workspace list filtered correctly
- [ ] Cross-org access blocked

### Seat Limits
- [ ] Free plan (5 seats) enforced
- [ ] Cannot exceed seat limit
- [ ] Plan upgrade increases seat limit
- [ ] Error messages shown when limit reached

### Email Verification
- [ ] Registration requires email verification
- [ ] Unverified user cannot login
- [ ] Verification link works
- [ ] Can request resend verification email

### Super Admin
- [ ] Super admin sees all organizations
- [ ] Super admin can edit any organization
- [ ] Super admin can create/delete organizations
- [ ] Regular users cannot access other orgs

### Tenant Isolation (API)
- [ ] Users cannot access other orgs' data
- [ ] Workspaces filtered by organizationId
- [ ] Documents filtered by organization
- [ ] Invites filtered by organization

---

## Common Issues & Solutions

### Issue: Email Not Received

**Cause:** SMTP not configured in production

**Solution:**
```bash
# Check server console for email logs
# Emails are logged to console when SMTP not configured:
# [EmailService] Sending verification email to user@example.com
# [EmailService] Verification URL: http://.../verify-email/TOKEN...
```

### Issue: Seat Limit Not Enforced

**Cause:** Billing service not properly integrated

**Solution:**
- Check `/api/billing/seat-limit/:orgId` returns correct values
- Verify `checkSeatLimit` called in registration/invite endpoints

### Issue: Cross-Org Data Visible

**Cause:** Tenant isolation middleware not applied

**Solution:**
- Check `server/utils/middleware/tenantIsolation.js` exists
- Verify middleware applied to relevant endpoints
- Check queries filter by `organizationId`

### Issue: Organization Dropdown Empty

**Cause:** Organizations API not working

**Solution:**
- Check `/api/v1/organizations` endpoint
- Verify user has permission to view organizations
- Check browser console for API errors

---

## Next Steps After Testing

If all tests pass:
1. **Deploy to Production:** Push changes to production
2. **Configure SMTP:** Set up real email sending
3. **Configure Billing:** Set up Stripe/Paddle webhooks
4. **Monitor:** Set up logging and monitoring
5. **Document:** Create user-facing documentation

If tests fail:
1. **Debug:** Check server logs for errors
2. **Fix:** Apply fixes to failed tests
3. **Retest:** Run tests again after fixes
4. **Document:** Note issues and resolutions

---

## Support & Resources

- **Architecture:** `docs/MULTI_TENANT_ARCHITECTURE.md`
- **Setup:** `docs/MULTI_TENANT_SETUP.md`
- **API:** `docs/MULTI_TENANT_API.md`
- **Deployment:** `docs/MULTI_TENANT_DEPLOYMENT.md`
- **Handover:** `plans/SAAS_MULTI_TENANT_HANDOVER.md`
