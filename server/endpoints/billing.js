const { Organization } = require("../models/organization");
const { userFromSession } = require("../utils/http");
const {
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  checkSeatLimit,
  enforceSeatLimit,
  handleStripeWebhook,
  handlePaddleWebhook,
  verifyWebhookSignature,
  updatePlan,
} = require("../services/billing");

function billingEndpoints(app) {
  if (!app) return;

  /**
   * GET /api/billing/seat-limit/:organizationId
   * Check seat limit for an organization
   */
  app.get(
    "/api/billing/seat-limit/:organizationId",
    [validatedRequest],
    async (req, res) => {
      try {
        const { organizationId } = req.params;

        if (!organizationId) {
          return res.status(400).json({
            success: false,
            error: "Organization ID is required",
          });
        }

        // Verify user has access to this organization
        const currUser = await userFromSession(req, res);
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(organizationId)) {
            return res.status(403).json({
              success: false,
              error: "Access denied to this organization",
            });
          }
        }

        const result = await checkSeatLimit(parseInt(organizationId));

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error("Error checking seat limit:", error.message);
        res.status(500).json({
          success: false,
          error: "Failed to check seat limit",
        });
      }
    }
  );

  /**
   * POST /api/billing/update-plan
   * Update organization plan
   */
  app.post(
    "/api/billing/update-plan",
    [validatedRequest],
    async (req, res) => {
      try {
        const { organizationId, plan } = req.body;

        if (!organizationId || !plan) {
          return res.status(400).json({
            success: false,
            error: "Organization ID and plan are required",
          });
        }

        // Verify user has access to this organization
        const currUser = await userFromSession(req, res);
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(organizationId)) {
            return res.status(403).json({
              success: false,
              error: "Access denied to this organization",
            });
          }
        }

        const result = await updatePlan(parseInt(organizationId), plan);

        if (result.success) {
          res.json({
            success: true,
            message: "Plan updated successfully",
          });
        } else {
          res.status(400).json({
            success: false,
            error: result.message,
          });
        }
      } catch (error) {
        console.error("Error updating plan:", error.message);
        res.status(500).json({
          success: false,
          error: "Failed to update plan",
        });
      }
    }
  );

  /**
   * POST /api/billing/webhook/stripe
   * Stripe webhook endpoint
   */
  app.post(
    "/api/billing/webhook/stripe",
    async (req, res) => {
      try {
        const payload = req.rawBody || req.body;
        const signature = req.headers["stripe-signature"];

        if (!signature) {
          return res.status(400).json({
            success: false,
            error: "Missing stripe-signature header",
          });
        }

        // Verify webhook signature (in development, skip verification)
        if (process.env.NODE_ENV !== "development") {
          const isValid = verifyWebhookSignature(payload, signature);
          if (!isValid) {
            return res.status(401).json({
              success: false,
              error: "Invalid webhook signature",
            });
          }
        }

        const event = JSON.parse(payload.toString());
        const result = await handleStripeWebhook(event);

        if (result.success) {
          res.json({ received: true });
        } else {
          res.status(400).json({
            success: false,
            error: result.message,
          });
        }
      } catch (error) {
        console.error("Error handling Stripe webhook:", error.message);
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/billing/webhook/paddle
   * Paddle webhook endpoint
   */
  app.post(
    "/api/billing/webhook/paddle",
    async (req, res) => {
      try {
        const event = req.body;

        if (!event.event_type) {
          return res.status(400).json({
            success: false,
            error: "Invalid Paddle webhook format",
          });
        }

        // Verify webhook signature (in development, skip verification)
        const signature = req.headers["paddle-signature"];
        if (process.env.NODE_ENV !== "development" && signature) {
          const isValid = verifyWebhookSignature(JSON.stringify(event), signature);
          if (!isValid) {
            return res.status(401).json({
              success: false,
              error: "Invalid webhook signature",
            });
          }
        }

        const result = await handlePaddleWebhook(event);

        if (result.success) {
          res.json({ received: true });
        } else {
          res.status(400).json({
            success: false,
            error: result.message,
          });
        }
      } catch (error) {
        console.error("Error handling Paddle webhook:", error.message);
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/billing/organization/:organizationId
   * Get billing information for an organization
   */
  app.get(
    "/api/billing/organization/:organizationId",
    [validatedRequest],
    async (req, res) => {
      try {
        const { organizationId } = req.params;

        if (!organizationId) {
          return res.status(400).json({
            success: false,
            error: "Organization ID is required",
          });
        }

        // Verify user has access to this organization
        const currUser = await userFromSession(req, res);
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(organizationId)) {
            return res.status(403).json({
              success: false,
              error: "Access denied to this organization",
            });
          }
        }

        const organization = await Organization.get({ id: parseInt(organizationId) });
        if (!organization) {
          return res.status(404).json({
            success: false,
            error: "Organization not found",
          });
        }

        const seatLimitInfo = await checkSeatLimit(parseInt(organizationId));

        res.json({
          success: true,
          data: {
            organization: {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              plan: organization.plan,
              status: organization.status,
              seatLimit: organization.seatLimit,
              subscriptionId: organization.subscriptionId,
            },
            seatLimit: seatLimitInfo,
          },
        });
      } catch (error) {
        console.error("Error getting billing info:", error.message);
        res.status(500).json({
          success: false,
          error: "Failed to get billing information",
        });
      }
    }
  );
}

module.exports = {
  billingEndpoints,
};
