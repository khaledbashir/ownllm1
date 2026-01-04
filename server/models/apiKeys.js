const prisma = require("../utils/prisma");

const ApiKey = {
  tablename: "api_keys",
  writable: [],

  makeSecret: () => {
    const uuidAPIKey = require("uuid-apikey");
    return uuidAPIKey.create().apiKey;
  },

  create: async function (createdByUserId = null) {
    try {
      const apiKey = await prisma.api_keys.create({
        data: {
          secret: this.makeSecret(),
          createdBy: createdByUserId,
        },
      });

      return { apiKey, error: null };
    } catch (error) {
      console.error("FAILED TO CREATE API KEY.", error.message);
      return { apiKey: null, error: error.message };
    }
  },

  get: async function (clause = {}) {
    try {
      const apiKey = await prisma.api_keys.findFirst({ where: clause });
      return apiKey;
    } catch (error) {
      console.error("FAILED TO GET API KEY.", error.message);
      return null;
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.api_keys.count({ where: clause });
      return count;
    } catch (error) {
      console.error("FAILED TO COUNT API KEYS.", error.message);
      return 0;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.api_keys.deleteMany({ where: clause });
      return true;
    } catch (error) {
      console.error("FAILED TO DELETE API KEY.", error.message);
      return false;
    }
  },

  where: async function (clause = {}, limit) {
    try {
      const apiKeys = await prisma.api_keys.findMany({
        where: clause,
        take: limit,
      });
      return apiKeys;
    } catch (error) {
      console.error("FAILED TO GET API KEYS.", error.message);
      return [];
    }
  },

  /**
   * Get API keys with organization filtering (via createdBy user)
   * @param {Object} clause - Query clause
   * @param {number|null} organizationId - Organization ID for filtering
   * @param {number|null} limit - Optional limit
   * @returns {Promise<Array>} Filtered API keys
   */
  whereWithOrg: async function (clause = {}, organizationId = null, limit = null) {
    try {
      const where = { ...clause };
      
      // Filter by organizationId via createdBy user
      if (organizationId !== null) {
        const User = require("./user");
        const orgUsers = await User.whereWithOrg({}, organizationId);
        const orgUserIds = orgUsers.map(u => u.id);
        where.createdBy = { in: orgUserIds };
      }
      
      const apiKeys = await prisma.api_keys.findMany({
        where,
        take: limit,
      });
      return apiKeys;
    } catch (error) {
      console.error("FAILED TO GET API KEYS WITH ORG.", error.message);
      return [];
    }
  },

  whereWithUser: async function (clause = {}, limit) {
    try {
      const User = require("./user");
      const apiKeys = await this.where(clause, limit);

      for (const apiKey of apiKeys) {
        if (!apiKey.createdBy) continue;
        const user = await User.get({ id: apiKey.createdBy });
        if (!user) continue;

        apiKey.createdBy = {
          id: user.id,
          username: user.username,
          role: user.role,
        };
      }

      return apiKeys;
    } catch (error) {
      console.error("FAILED TO GET API KEYS WITH USER.", error.message);
      return [];
    }
  },
};

module.exports = { ApiKey };
