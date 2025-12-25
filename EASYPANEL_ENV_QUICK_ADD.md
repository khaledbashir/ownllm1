# 🚀 Quick Add: Environment Variables for Easypanel

## Copy-Paste These Into Easypanel > Your Service > Environment Variables

```bash
# ===== SAAS MULTI-TENANT =====
ENABLE_MULTI_TENANT="true"

# ===== EMAIL (Required for invitations & verification) =====
# SendGrid (Get free API key: https://sendgrid.com)
SENDGRID_API_KEY="SG.GET_YOUR_FREE_API_KEY"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="OwnLLM"

# ===== DATABASE (Optional - PostgreSQL is better for multi-tenant) =====
# If you have PostgreSQL container in Easypanel:
DATABASE_URL="postgresql://ownllm_user:YOUR_DB_PASSWORD@postgres:5432/anythingllm_saas"

# ===== STRIPE (Optional - for paid subscriptions) =====
STRIPE_SECRET_KEY="sk_test_xxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
STRIPE_PRICE_ID_MONTHLY="price_xxxxx"
STRIPE_PRICE_ID_YEARLY="price_xxxxx"

# ===== SUPER ADMIN =====
SUPER_ADMIN_EMAIL="admin@yourdomain.com"
SUPER_ADMIN_PASSWORD="USE_SECURE_PASSWORD_HERE"

# ===== LIMITS (Per Organization) =====
MAX_WORKSPACES_PER_ORG="10"
MAX_USERS_PER_ORG="5"
MAX_STORAGE_PER_ORG_MB="1024"
MAX_FILE_SIZE_MB="100"

# ===== SECURITY =====
ENABLE_EMAIL_VERIFICATION="true"
INVITATION_EXPIRY_HOURS="48"
SESSION_TIMEOUT_HOURS="24"

# ===== BACKUPS =====
ENABLE_AUTO_BACKUP="true"
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS="30"
```

---

## 🎯 Minimum Required (Just Add These 4):

```bash
ENABLE_MULTI_TENANT="true"
SENDGRID_API_KEY="SG.GET_YOUR_FREE_API_KEY"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="OwnLLM"
```

---

## 📝 After Adding Env Vars:

1. **Push to GitHub** (Easypanel will auto-build)
2. **Run migrations** (after build completes):
   ```bash
   docker exec -it YOUR_CONTAINER_ID npx prisma migrate deploy
   ```
3. **Create super admin** (if using SUPER_ADMIN env vars)
4. **Test it**: Go to your domain, should see multi-tenant login

---

## 🔗 Get SendGrid Free API Key:

1. Go to: https://sendgrid.com/
2. Sign up (free)
3. Go to Settings > API Keys
4. Create API Key with "Mail Send" permission
5. Copy the key to `SENDGRID_API_KEY`

---

## 💡 Pro Tip:

If you don't want to set up SendGrid yet, you can use **Resend** (simpler):

```bash
# Use Resend instead of SendGrid
RESEND_API_KEY="re_xxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

Get free key: https://resend.com/
