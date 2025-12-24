const prisma = require("../utils/prisma");

/**
 * Email Verification Tokens Model
 * Handles creation and validation of email verification tokens
 */

const EmailVerificationTokens = {
  writable: [],

  /**
   * Create a new email verification token for a user
   * @param {number} userId - User ID
   * @param {number} expiresInHours - Token expiration time in hours (default: 24)
   * @returns {Promise<{token: string|null, error: string|null}>}
   */
  create: async function (userId, expiresInHours = 24) {
    try {
      if (!userId) throw new Error("User ID is required");

      const crypto = require("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Delete any existing tokens for this user
      await prisma.email_verification_tokens.deleteMany({
        where: { user_id: userId },
      });

      // Create new token
      await prisma.email_verification_tokens.create({
        data: {
          user_id: userId,
          token,
          expiresAt,
        },
      });

      return { token, error: null };
    } catch (error) {
      console.error("FAILED TO CREATE EMAIL VERIFICATION TOKEN.", error.message);
      return { token: null, error: error.message };
    }
  },

  /**
   * Get a verification token by token string
   * @param {string} token - Token string
   * @returns {Promise<Object|null>}
   */
  get: async function (token) {
    try {
      const verificationToken = await prisma.email_verification_tokens.findUnique({
        where: { token },
        include: { user: true },
      });
      return verificationToken;
    } catch (error) {
      console.error("FAILED TO GET EMAIL VERIFICATION TOKEN.", error.message);
      return null;
    }
  },

  /**
   * Verify a token and mark the user's email as verified
   * @param {string} token - Token string
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  verify: async function (token) {
    try {
      if (!token) throw new Error("Token is required");

      const verificationToken = await this.get(token);
      if (!verificationToken) {
        return { success: false, error: "Invalid or expired token" };
      }

      // Check if token has expired
      if (verificationToken.expiresAt < new Date()) {
        // Delete expired token
        await this.delete(verificationToken.id);
        return { success: false, error: "Token has expired" };
      }

      // Mark user's email as verified
      await prisma.users.update({
        where: { id: verificationToken.user_id },
        data: { emailVerified: true },
      });

      // Delete the used token
      await this.delete(verificationToken.id);

      return { success: true, error: null };
    } catch (error) {
      console.error("FAILED TO VERIFY EMAIL TOKEN.", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a verification token
   * @param {number} id - Token ID
   * @returns {Promise<boolean>}
   */
  delete: async function (id) {
    try {
      await prisma.email_verification_tokens.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("FAILED TO DELETE EMAIL VERIFICATION TOKEN.", error.message);
      return false;
    }
  },

  /**
   * Delete all tokens for a user
   * @param {number} userId - User ID
   * @returns {Promise<boolean>}
   */
  deleteByUser: async function (userId) {
    try {
      await prisma.email_verification_tokens.deleteMany({
        where: { user_id: userId },
      });
      return true;
    } catch (error) {
      console.error("FAILED TO DELETE USER EMAIL TOKENS.", error.message);
      return false;
    }
  },

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} Number of deleted tokens
   */
  cleanupExpired: async function () {
    try {
      const result = await prisma.email_verification_tokens.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return result.count;
    } catch (error) {
      console.error("FAILED TO CLEANUP EXPIRED TOKENS.", error.message);
      return 0;
    }
  },
};

module.exports = { EmailVerificationTokens };
