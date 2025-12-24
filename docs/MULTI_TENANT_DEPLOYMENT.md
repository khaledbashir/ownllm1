# Multi-Tenant Deployment Guide

This guide covers deploying AnythingLLM with multi-tenant SaaS capabilities.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Database Migration Steps](#database-migration-steps)
- [Environment Variables](#environment-variables)
- [EasyPanel Deployment](#easypanel-deployment)
- [Production Considerations](#production-considerations)
- [Post-Deployment Verification](#post-deployment-verification)

---

## Prerequisites

Before deploying multi-tenant AnythingLLM, ensure you have:

- **PostgreSQL Database** (required for multi-tenant support)
- **SMTP Server** (for email verification)
- **Domain Name** (for production deployment)
- **SSL Certificate** (for secure HTTPS connections)

### Database Requirements

Multi-tenant AnythingLLM requires PostgreSQL due to:
- Better support for complex relationships
- Efficient foreign key constraints
- Transaction support for data integrity

Minimum PostgreSQL version: 13

### SMTP Server Requirements

Email verification is required for new users. You need:
- SMTP host address
- SMTP port (usually 587 for TLS, 465 for SSL)
- SMTP username/password
- From email address

---

## Database Migration Steps

### 1. Set Up Database Connection

First, configure your database connection in `.env`:

```bash
# PostgreSQL Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=anythingllm
DB_USER=anythingllm_user
DB_PASS=your_secure_password

# Database URL (if using connection string)
DATABASE_URL="postgresql://anythingllm_user:your_secure_password@your-db-host.com:5432/anythingllm"
```

### 2. Run Database Migrations

Navigate to the server directory and run migrations:

```bash
cd server
npx prisma migrate deploy
```

This will apply all pending migrations, including:
- Multi-tenant organizations table
- Email verification tokens table
- Organization foreign keys to existing tables

### 3. Generate Prisma Client

Generate the Prisma client for the new schema:

```bash
npx prisma generate
```

### 4. Verify Migration

Check that all migrations are applied:

```bash
npx prisma migrate status
```

You should see all migrations marked as "Applied".

### 5. Seed Initial Data (Optional)

To seed an initial super admin user:

```bash
npx prisma db seed
```

Or manually create via the application:
1. Start the server
2. Register a new user
3. Update the user to have `role: "admin"` and `organizationId: null`

---

## Environment Variables

### Required Variables

```bash
# Multi-User Mode
ENABLE_MULTI_USER=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRY=30d

# Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=anythingllm
DB_USER=anythingllm_user
DB_PASS=your_secure_password

# SMTP for Email Verification
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Optional Variables

```bash
# Stripe Billing (for production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paddle Billing (for production)
PADDLE_API_KEY=live_...
PADDLE_WEBHOOK_SECRET=...

# Server Configuration
SERVER_PORT=3001
ENABLE_HTTPS=false
STORAGE_DIR=/path/to/storage

# Development Mode
NODE_ENV=production
```

### EasyPanel Variables

If deploying with EasyPanel:

```bash
# EasyPanel-specific
EASYPANEL_APP_ID=anythingllm
EASYPANEL_DOMAIN=anythingllm.yourdomain.com
EASYPANEL_SSL=true
```

---

## EasyPanel Deployment

### What is EasyPanel?

EasyPanel is a self-hosted panel for managing applications on your server. It provides:
- One-click deployments
- SSL certificate management
- Container orchestration
- Resource monitoring

### Preparing for EasyPanel

1. **Install Docker and EasyPanel**:
   ```bash
   curl -sSL https://get.easypanel.com | sh
   ```

2. **Access EasyPanel**: Navigate to `https://your-server-ip:3000`

3. **Create New Application**:
   - Click "Create Application"
   - Select "Custom Docker Image"

### Configuring the Application

#### Step 1: Set Container Details

```
Name: anythingllm
Image: mintplexlabs/anythingllm:latest
Port: 3001
```

#### Step 2: Add Environment Variables

Add all required environment variables from the [Environment Variables](#environment-variables) section.

#### Step 3: Configure Database

**Option A: Use Built-in PostgreSQL**

Add a PostgreSQL service:
```
Name: anythingllm-db
Image: postgres:15
Port: 5432
Environment Variables:
  POSTGRES_DB=anythingllm
  POSTGRES_USER=anythingllm_user
  POSTGRES_PASSWORD=your_secure_password
```

Update `DB_HOST` in AnythingLLM to: `anythingllm-db`

**Option B: Use External Database**

If you have an external PostgreSQL instance, configure the connection string accordingly.

#### Step 4: Configure Volumes

Add persistent storage for AnythingLLM:

```
Mount Path: /app/server/storage
Host Path: /var/lib/anythingllm/storage
```

#### Step 5: Configure SSL

1. Add domain: `anythingllm.yourdomain.com`
2. Enable SSL
3. EasyPanel will automatically generate Let's Encrypt certificate

#### Step 6: Run Database Migrations

Before starting the application, run migrations:

1. Access container terminal in EasyPanel
2. Run: `cd /app/server && npx prisma migrate deploy`
3. Exit terminal

#### Step 7: Start the Application

Click "Deploy" in EasyPanel. The application will:
1. Pull the Docker image
2. Start containers
3. Configure SSL
4. Expose the application on your domain

### Updating Multi-Tenant Features

To update to the multi-tenant version:

1. **Pull latest image**:
   - In EasyPanel, update image tag to `mintplexlabs/anythingllm:latest`

2. **Run migrations**:
   - Access container terminal
   - Run: `cd /app/server && npx prisma migrate deploy`

3. **Restart application**:
   - Click "Restart" in EasyPanel

---

## Production Considerations

### Security

#### 1. Use Strong JWT Secret

Generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Set this as your `JWT_SECRET`.

#### 2. Enable HTTPS

Always use HTTPS in production:
- EasyPanel: Enable SSL in domain settings
- Manual: Use Nginx/Apache reverse proxy with SSL

#### 3. Configure Firewall

Only expose necessary ports:
```
Port 80 (HTTP) - For SSL redirect only
Port 443 (HTTPS) - For application access
Port 5432 - Database (internal network only, never expose)
```

#### 4. Use Environment Variables

Never commit secrets to git. Use environment variables for:
- Database passwords
- JWT secrets
- SMTP credentials
- API keys

### Database

#### 1. Connection Pooling

For high-traffic deployments, use connection pooling:

```bash
# Add to DATABASE_URL
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20"
```

#### 2. Regular Backups

Set up automated backups:
- EasyPanel: Configure volume snapshots
- Manual: Use `pg_dump` cron job

Example backup cron:
```bash
0 2 * * * pg_dump -U anythingllm_user anythingllm | gzip > /backups/anythingllm-$(date +\%Y\%m\%d).sql.gz
```

#### 3. Database Tuning

Adjust PostgreSQL configuration for performance:

```ini
# postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
max_connections = 200
work_mem = 16MB
```

### Scaling

#### 1. Horizontal Scaling

To scale across multiple instances:

1. Use shared PostgreSQL database
2. Use shared storage (NFS, S3-compatible)
3. Load balance with Nginx

Example Nginx config:
```nginx
upstream anythingllm {
    server 10.0.0.1:3001;
    server 10.0.0.2:3001;
    server 10.0.0.3:3001;
}

server {
    listen 443 ssl;
    server_name anythingllm.yourdomain.com;
    
    location / {
        proxy_pass http://anythingllm;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 2. Vertical Scaling

Increase container resources:
- CPU: 2-4 cores
- Memory: 4-8 GB
- Storage: SSD recommended

### Monitoring

#### 1. Application Logs

Monitor logs for errors:
```bash
# Docker logs
docker logs -f anythingllm-container

# EasyPanel
Open application logs panel
```

#### 2. Health Checks

Set up health checks:

```bash
# Health check endpoint
curl https://anythingllm.yourdomain.com/health
```

Configure health check in EasyPanel:
- Path: `/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

#### 3. Metrics

Track key metrics:
- Active organizations
- Active users
- API response times
- Database query times
- Seat utilization

### Billing Integration

#### Stripe Setup

1. **Create Stripe account** at https://stripe.com
2. **Create products** for each plan:
   - Free plan (free trial)
   - Pro plan ($XX/month)
   - Enterprise plan ($XXX/month)

3. **Configure webhooks**:
   - URL: `https://anythingllm.yourdomain.com/api/billing/webhook/stripe`
   - Events: `customer.subscription.*`, `invoice.*`

4. **Add environment variables**:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

#### Paddle Setup

1. **Create Paddle account** at https://paddle.com
2. **Create subscription products**
3. **Configure webhook**:
   - URL: `https://anythingllm.yourdomain.com/api/billing/webhook/paddle`

4. **Add environment variables**:
   ```bash
   PADDLE_API_KEY=live_...
   PADDLE_WEBHOOK_SECRET=...
   ```

---

## Post-Deployment Verification

### 1. Verify Multi-User Mode

Access the application and verify:
1. Multi-user mode is enabled in settings
2. Registration page is accessible at `/register`
3. Users can be invited to organizations

### 2. Verify Email Verification

1. Register a new user
2. Check that verification email is sent
3. Click verification link
4. Verify user can login after verification

### 3. Verify Organization Creation

1. Register with organization
2. Verify organization is created in database
3. Verify user has `organizationId` set
4. Check user has admin role in organization

### 4. Verify Tenant Isolation

1. Create two organizations
2. Create workspaces in each organization
3. Login as user from org1
4. Verify only org1 workspaces are visible

### 5. Verify Seat Limits

1. Create organization with free plan (5 seats)
2. Create 5 users
3. Attempt to create 6th user (should fail)
4. Upgrade to pro plan
5. Verify 6th user can now be created

### 6. Verify Super Admin Access

1. Create a super admin (`role: admin`, `organizationId: null`)
2. Login as super admin
3. Verify all organizations are visible
4. Verify super admin can access any organization's data

### 7. Verify Billing Integration (if configured)

1. Test Stripe/Paddle webhook
2. Create test subscription
3. Verify plan is updated
4. Cancel subscription
5. Verify organization status changes to suspended

---

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL

**Solutions**:
1. Verify database host and port
2. Check firewall allows connection
3. Verify credentials are correct
4. Check PostgreSQL is running

### Migration Failures

**Problem**: Prisma migration fails

**Solutions**:
1. Check database connection
2. Run `npx prisma migrate resolve` to resolve failed migration
3. Check for schema conflicts
4. Review migration logs

### Email Not Sending

**Problem**: Verification emails not delivered

**Solutions**:
1. Verify SMTP credentials
2. Check SMTP server is accessible
3. Check email logs in console (development)
4. Verify `SMTP_FROM` is properly formatted

### Tenant Isolation Not Working

**Problem**: Users can see data from other organizations

**Solutions**:
1. Verify `tenantIsolation` middleware is applied
2. Check models use `whereWithOrg` methods
3. Verify JWT token includes `organizationId`
4. Check database foreign keys are correct

### Seat Limit Not Enforced

**Problem**: Users can exceed seat limit

**Solutions**:
1. Verify `checkSeatLimit` is called before user creation
2. Check organization's `seatLimit` is set correctly
3. Verify billing service is imported
4. Check seat limit enforcement logic in endpoints

---

## Rollback Procedure

If deployment fails:

### 1. Rollback Docker Image

```bash
# Stop current container
docker stop anythingllm-container

# Pull previous version
docker pull mintplexlabs/anythingllm:previous-tag

# Start with previous version
docker start anythingllm-container
```

### 2. Rollback Database Migration

```bash
# View migration history
npx prisma migrate resolve --rolled-back

# Rollback to previous migration
npx prisma migrate resolve --applied "previous_migration_name"
```

### 3. Restore from Backup

```bash
# Restore database from backup
gunzip < /backups/anythingllm-YYYY-MM-DD.sql.gz | psql -U anythingllm_user anythingllm
```

---

## Support and Resources

- **Documentation**: [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md)
- **Setup Guide**: [MULTI_TENANT_SETUP.md](./MULTI_TENANT_SETUP.md)
- **API Reference**: [MULTI_TENANT_API.md](./MULTI_TENANT_API.md)
- **Main Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

For additional support, refer to the main AnythingLLM documentation or community forums.
