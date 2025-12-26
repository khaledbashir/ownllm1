const prisma = require("../utils/prisma");
const { EventLogs } = require("./eventLogs");

/**
 * @typedef {Object} Organization
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} plan - free, pro, enterprise
 * @property {string|null} subscriptionId - Stripe subscription ID
 * @property {string} status - active, trial, past_due, canceled, suspended
 * @property {number|null} seatLimit - Max users allowed (null = unlimited)
 * @property {string|null} settings - JSON for organization-specific settings
 * @property {string} role - default, admin (for special organizational permissions)
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const Organization = {
  writable: [
    "name",
    "slug",
    "plan",
    "subscriptionId",
    "status",
    "seatLimit",
    "settings",
    "role",
  ],

  VALID_PLANS: ["free", "pro", "enterprise"],
  VALID_STATUSES: ["active", "trial", "past_due", "canceled", "suspended"],

  validations: {
    name: (newValue = "") => {
      if (String(newValue).length > 255)
        throw new Error("Organization name cannot be longer than 255 characters");
      if (String(newValue).length < 1)
        throw new Error("Organization name is required");
      return String(newValue).trim();
    },
    slug: (newValue = "") => {
      const slug = String(newValue)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (slug.length < 3)
        throw new Error("Slug must be at least 3 characters");
      if (slug.length > 100)
        throw new Error("Slug cannot be longer than 100 characters");
      return slug;
    },
    plan: (plan = "free") => {
      const validPlans = ["free", "pro", "enterprise"];
      if (!validPlans.includes(plan)) {
        throw new Error(
          `Invalid plan. Allowed plans are: ${validPlans.join(", ")}`
        );
      }
      return String(plan);
    },
    subscriptionId: (subscriptionId = null) => {
      if (subscriptionId === null) return null;
      return String(subscriptionId);
    },
    status: (status = "active") => {
      const validStatuses = ["active", "trial", "past_due", "canceled", "suspended"];
      if (!validStatuses.includes(status)) {
        throw new Error(
          `Invalid status. Allowed statuses are: ${validStatuses.join(", ")}`
        );
      }
      return String(status);
    },
    seatLimit: (seatLimit = null) => {
      if (seatLimit === null) return null;
      const limit = Number(seatLimit);
      if (isNaN(limit) || limit < 1) {
        throw new Error(
          "Seat limit must be null or a number greater than or equal to 1"
        );
      }
      return limit;
    },
    settings: (settings = null) => {
      if (settings === null) return null;
      try {
        if (typeof settings === "string") {
          JSON.parse(settings); // Validate it's valid JSON
          return String(settings);
        } else if (typeof settings === "object") {
          return JSON.stringify(settings);
        }
        return String(settings);
      } catch (error) {
        throw new Error("Settings must be a valid JSON string");
      }
    },
    role: (role = "default") => {
      const validRoles = ["default", "admin"];
      if (!validRoles.includes(role)) {
        throw new Error(
          `Invalid role. Allowed roles are: ${validRoles.join(", ")}`
        );
      }
      return String(role);
    },
  },

  castColumnValue: function (key, value) {
    switch (key) {
      case "seatLimit":
        return value === null ? null : Number(value);
      case "plan":
      case "status":
      case "slug":
        return String(value).toLowerCase();
      default:
        return String(value);
    }
  },

  loggedChanges: function (updates, prev = {}) {
    const changes = {};

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== prev[key]) {
        changes[key] = `${prev[key]} => ${updates[key]}`;
      }
    });

    return changes;
  },

  /**
   * Check if an organization can add more users based on seat limit
   * @param {Organization} organization - The organization object
   * @param {number} currentCount - Current number of users in organization
   * @returns {boolean} True if organization can add more users
   */
  canAddUsers: async function (organization) {
    // Unlimited seat limit or active organization
    if (organization.seatLimit === null || organization.status === "active") {
      return true;
    }

    // Count current users in organization
    const userCount = await prisma.users.count({
      where: { organizationId: organization.id },
    });

    return userCount < organization.seatLimit;
  },

  /**
   * Get the number of remaining seats available for an organization
   * @param {number} organizationId - The organization ID
   * @returns {Promise<number|null>} Remaining seats or null if unlimited
   */
  getRemainingSeats: async function (organizationId) {
    const organization = await this.get({ id: organizationId });
    if (!organization) return null;

    if (organization.seatLimit === null) return null; // Unlimited

    const userCount = await prisma.users.count({
      where: { organizationId },
    });

    return Math.max(0, organization.seatLimit - userCount);
  },

  create: async function ({
    name,
    slug,
    plan = "free",
    subscriptionId = null,
    status = "active",
    seatLimit = null,
    settings = null,
  }) {
    try {
      // Validate slug uniqueness
      const existing = await prisma.organizations.findUnique({
        where: { slug: Organization.validations.slug(slug) },
      });
      if (existing) {
        throw new Error("An organization with this slug already exists");
      }

      const organization = await prisma.organizations.create({
        data: {
          name: Organization.validations.name(name),
          slug: Organization.validations.slug(slug),
          plan: Organization.validations.plan(plan),
          subscriptionId: Organization.validations.subscriptionId(subscriptionId),
          status: Organization.validations.status(status),
          seatLimit: Organization.validations.seatLimit(seatLimit),
          settings: Organization.validations.settings(settings),
        },
      });

      await EventLogs.logEvent(
        "organization_created",
        {
          organizationId: organization.id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
        },
        null // No user context for org creation (super admin action)
      );

      return { organization, error: null };
    } catch (error) {
      console.error("FAILED TO CREATE ORGANIZATION.", error.message);
      return { organization: null, error: error.message };
    }
  },

  update: async function (organizationId, updates = {}, userId = null) {
    try {
      if (!organizationId)
        throw new Error("No organization id provided for update");

      const currentOrganization = await prisma.organizations.findUnique({
        where: { id: parseInt(organizationId) },
      });
      if (!currentOrganization)
        return { success: false, error: "Organization not found" };

      // Removes non-writable fields for generic updates
      // and force-casts to the proper type
      Object.entries(updates).forEach(([key, value]) => {
        if (Organization.writable.includes(key)) {
          if (Organization.validations[key]) {
            updates[key] = Organization.validations[key](
              Organization.castColumnValue(key, value)
            );
          } else {
            updates[key] = Organization.castColumnValue(key, value);
          }
          return;
        }
        delete updates[key];
      });

      if (Object.keys(updates).length === 0)
        return { success: false, error: "No valid updates applied." };

      // Validate slug uniqueness if updating slug
      if (updates.slug && updates.slug !== currentOrganization.slug) {
        const existing = await prisma.organizations.findUnique({
          where: { slug: updates.slug },
        });
        if (existing) {
          return { success: false, error: "An organization with this slug already exists" };
        }
      }

      const organization = await prisma.organizations.update({
        where: { id: parseInt(organizationId) },
        data: updates,
      });

      await EventLogs.logEvent(
        "organization_updated",
        {
          organizationId: organization.id,
          name: organization.name,
          slug: organization.slug,
          changes: this.loggedChanges(updates, currentOrganization),
        },
        userId
      );

      return { success: true, error: null, organization };
    } catch (error) {
      console.error(error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Explicit direct update of organization object.
   * Only use this method when directly setting a key value
   * that takes no user input for the keys being modified.
   */
  _update: async function (id = null, data = {}) {
    if (!id) throw new Error("No organization id provided for update");

    try {
      const organization = await prisma.organizations.update({
        where: { id },
        data,
      });
      return { organization, message: null };
    } catch (error) {
      console.error(error.message);
      return { organization: null, message: error.message };
    }
  },

  /**
   * Returns an organization object based on the clause provided.
   * @param {Object} clause - The clause to use to find the organization.
   * @returns {Promise<Organization|null>} The organization object or null if not found.
   */
  get: async function (clause = {}) {
    try {
      const organization = await prisma.organizations.findFirst({
        where: clause,
      });
      return organization ? { ...organization } : null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  /**
   * Returns an organization with its relations based on the clause provided.
   * @param {Object} clause - The clause to use to find the organization.
   * @returns {Promise<Object|null>} The organization object with relations or null if not found.
   */
  getWithRelations: async function (clause = {}) {
    try {
      const organization = await prisma.organizations.findFirst({
        where: clause,
        include: {
          users: true,
          workspaces: true,
          invites: true,
          crmPipelines: true,
        },
      });
      return organization ? { ...organization } : null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.organizations.count({ where: clause });
      return count;
    } catch (error) {
      console.error(error.message);
      return 0;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.organizations.deleteMany({ where: clause });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  },

  where: async function (clause = {}, limit = null) {
    try {
      const organizations = await prisma.organizations.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        orderBy: { createdAt: "desc" },
      });
      return organizations;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  /**
   * Get organizations by user ID
   * @param {number} userId - The user ID
   * @returns {Promise<Organization[]>} List of organizations the user belongs to
   */
  getByUserId: async function (userId) {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: { organization: true },
      });
      return user?.organization ? [user.organization] : [];
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  /**
   * Get organization statistics
   * @param {number} organizationId - The organization ID
   * @returns {Promise<Object>} Organization statistics
   */
  getStats: async function (organizationId) {
    try {
      const [userCount, workspaceCount, documentCount, inviteCount] = await Promise.all([
        prisma.users.count({ where: { organizationId } }),
        prisma.workspaces.count({ where: { organizationId } }),
        prisma.workspace_documents.count({
          where: { organizationId },
        }),
        prisma.invites.count({ where: { organizationId, status: "pending" } }),
      ]);

      return {
        userCount,
        workspaceCount,
        documentCount,
        pendingInviteCount: inviteCount,
      };
    } catch (error) {
      console.error(error.message);
      return {
        userCount: 0,
        workspaceCount: 0,
        documentCount: 0,
        pendingInviteCount: 0,
      };
    }
  },

  /**
   * Get the number of users in an organization
   * @param {number} organizationId - The organization ID
   * @returns {Promise<number>} The number of users
   */
  getUsersCount: async function (organizationId) {
    try {
      const count = await prisma.users.count({
        where: { organizationId: Number(organizationId) },
      });
      return count;
    } catch (error) {
      console.error(error.message);
      return 0;
    }
  },
};

module.exports = { Organization };
