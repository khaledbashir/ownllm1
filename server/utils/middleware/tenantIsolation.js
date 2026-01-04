const { User } = require("../../models/user");

/**
 * Tenant Isolation Middleware
 * 
 * This middleware ensures that all database queries are automatically filtered
 * by the user's organization ID, providing data isolation between tenants.
 * 
 * Super admins (users without an organizationId) can access data
 * across all organizations.
 */

const ROLES = {
  admin: "admin",
  manager: "manager",
  default: "default",
};

/**
 * Check if a user is a super admin (admin without organization)
 * @param {Object} user - The user object
 * @returns {boolean} True if super admin
 */
function isSuperAdmin(user) {
  return user.role === ROLES.admin && !user.organizationId;
}

/**
 * Get the organization filter for a user
 * @param {Object} user - The user object
 * @returns {Object|null} Prisma where clause for organization filtering
 */
function getOrganizationFilter(user) {
  // Super admins are not restricted to a single organization
  // They can see all data (multi-tenant management)
  if (isSuperAdmin(user)) {
    return null;
  }

  // Regular users are restricted to their organization's data
  if (!user.organizationId) {
    // User has no organization - should not happen in multi-tenant setup
    return { organizationId: { equals: null } };
  }

  return { organizationId: user.organizationId };
}

/**
 * Apply organization filter to a where clause
 * @param {Object} where - The original where clause
 * @param {Object} user - The user object
 * @returns {Object} The filtered where clause
 */
function applyOrganizationFilter(where, user) {
  const orgFilter = getOrganizationFilter(user);
  
  if (!orgFilter) {
    // Super admin - no filtering
    return where;
  }

  // Merge organization filter with existing where clause
  // Using AND logic to ensure both conditions are met
  if (where.AND) {
    return { AND: [...where.AND, orgFilter] };
  }
  
  return { AND: [where, orgFilter] };
}

/**
 * Check if a user can access a specific organization
 * @param {Object} user - The user object
 * @param {number} organizationId - The organization ID to check
 * @returns {boolean} True if user can access the organization
 */
function canAccessOrganization(user, organizationId) {
  // Super admins can access any organization
  if (isSuperAdmin(user)) {
    return true;
  }

  // Regular users can only access their own organization
  return user.organizationId === organizationId;
}

/**
 * Check if a user can access a specific workspace
 * @param {Object} user - The user object
 * @param {number} workspace - The workspace object
 * @returns {boolean} True if user can access the workspace
 */
function canAccessWorkspace(user, workspace) {
  // Super admins can access any workspace
  if (isSuperAdmin(user)) {
    return true;
  }

  // Regular users can only access workspaces in their organization
  return workspace.organizationId === user.organizationId;
}

/**
 * Middleware to attach organization context to the request
 * This should be used after authentication middleware
 */
async function tenantIsolationMiddleware(req, res, next) {
  try {
    const user = req?.user;
    
    if (!user) {
      return next();
    }

    // Attach organization context to request for use in endpoints
    req.organizationId = user.organizationId;
    req.isSuperAdmin = isSuperAdmin(user);

    next();
  } catch (error) {
    console.error("Tenant isolation middleware error:", error.message);
    next();
  }
}

/**
 * Check if a user has exceeded their organization's seat limit
 * @param {Object} user - The user object
 * @param {Object} organization - The organization object
 * @returns {Promise<boolean>} True if seat limit is exceeded
 */
async function isSeatLimitExceeded(user, organization) {
  // Super admins are not subject to seat limits
  if (isSuperAdmin(user)) {
    return false;
  }

  // No seat limit means unlimited
  if (!organization.seatLimit) {
    return false;
  }

  const userCount = await User.count({ organizationId: organization.id });
  return userCount >= organization.seatLimit;
}

module.exports = {
  ROLES,
  isSuperAdmin,
  getOrganizationFilter,
  applyOrganizationFilter,
  canAccessOrganization,
  canAccessWorkspace,
  tenantIsolationMiddleware,
  isSeatLimitExceeded,
};
