const { Organization } = require("../models/organization");
console.log("!!! ORGANIZATION ENDPOINTS FILE LOADED !!!");
const User = require("../models/user");
const { EventLogs } = require("../models/eventLogs");
const { reqBody, userFromSession } = require("../utils/http");
const {
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");

function organizationEndpoints(app) {
  if (!app) return;

  /**
   * GET /organizations
   * Get all organizations (super admin only)
   */
  app.get(
    "/organizations",
    [validatedRequest],
    async (request, response) => {
      try {
        console.log("!!! ORGANIZATION ENDPOINT CALLED !!!");
        const currUser = await userFromSession(request, response);

        // Check if user is authenticated
        if (!currUser) {
          console.log("!!! NO USER FOUND IN SESSION !!!");
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          console.log("!!! USER MISSING ROLE PROPERTY !!!");
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Only super admin (admin without organization) can see all organizations
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          return response.status(403).json({
            error: "Only super administrators can view all organizations",
          });
        }

        const organizations = await Organization.where();
        response.status(200).json({ organizations });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  /**
   * GET /organizations/:id
   * Get a single organization by ID
   */
  app.get(
    "/organizations/:id",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        const { id } = request.params;

        // Check if user is authenticated
        if (!currUser) {
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Users can only view their own organization
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(id)) {
            return response.status(403).json({
              error: "You can only view your own organization",
            });
          }
        }

        const organization = await Organization.get({ id: parseInt(id) });
        if (!organization) {
          return response.status(404).json({ error: "Organization not found" });
        }

        response.status(200).json({ organization });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  /**
   * GET /organizations/:id/stats
   * Get organization statistics
   */
  app.get(
    "/organizations/:id/stats",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        const { id } = request.params;

        // Check if user is authenticated
        if (!currUser) {
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Users can only view their own organization's stats
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(id)) {
            return response.status(403).json({
              error: "You can only view your own organization's statistics",
            });
          }
        }

        const stats = await Organization.getStats(parseInt(id));
        response.status(200).json(stats);
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  /**
   * GET /organizations/:id/users
   * Get users in an organization
   */
  app.get(
    "/organizations/:id/users",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        const { id } = request.params;

        // Check if user is authenticated
        if (!currUser) {
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Users can only view users in their own organization
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(id)) {
            return response.status(403).json({
              error: "You can only view users in your own organization",
            });
          }
        }

        const users = await User.where({ organizationId: parseInt(id) });
        response.status(200).json({ users });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  /**
   * GET /organizations/:id/workspaces
   * Get workspaces in an organization
   */
  app.get(
    "/organizations/:id/workspaces",
    [validatedRequest],
    async (request, response) => {
      try {
        console.log("!!! ORGANIZATION WORKSPACES ENDPOINT CALLED !!!");
        const currUser = await userFromSession(request, response);
        const { id } = request.params;

        // Check if user is authenticated
        if (!currUser) {
          console.log("!!! NO USER FOUND IN SESSION (WORKSPACES) !!!");
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          console.log("!!! USER MISSING ROLE PROPERTY (WORKSPACES) !!!");
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Users can only view workspaces in their own organization
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(id)) {
            return response.status(403).json({
              error: "You can only view workspaces in your own organization",
            });
          }
        }

        const { Workspace } = require("../models/workspace");
        const workspaces = await Workspace.where({
          organizationId: parseInt(id),
        });
        response.status(200).json({ workspaces });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  /**
   * POST /organizations/new
   * Create a new organization (super admin only)
   */
  app.post(
    "/organizations/new",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);

        // Check if user is authenticated
        if (!currUser) {
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Only super admin can create organizations
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          return response.status(403).json({
            error: "Only super administrators can create organizations",
          });
        }

        const body = reqBody(request);
        const { organization, error } = await Organization.create(body);

        if (error) {
          return response.status(200).json({ organization: null, error });
        }

        response.status(200).json({ organization, error: null });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  /**
   * POST /organizations/:id
   * Update an organization
   */
  app.post(
    "/organizations/:id",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        const { id } = request.params;
        const updates = reqBody(request);

        // Check if user is authenticated
        if (!currUser) {
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Users can only update their own organization
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(id)) {
            return response.status(403).json({
              error: "You can only update your own organization",
            });
          }

          // Non-super admins cannot update billing fields
          const restrictedFields = ["plan", "subscriptionId", "status", "seatLimit"];
          const hasRestrictedUpdate = Object.keys(updates).some((key) =>
            restrictedFields.includes(key)
          );
          if (hasRestrictedUpdate) {
            return response.status(403).json({
              error: "Only super administrators can update billing information",
            });
          }
        }

        const result = await Organization.update(
          parseInt(id),
          updates,
          currUser.id
        );

        if (!result.success) {
          return response.status(200).json({ success: false, error: result.error });
        }

        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  /**
   * DELETE /organizations/:id
   * Delete an organization (super admin only)
   */
  app.delete(
    "/organizations/:id",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        const { id } = request.params;

        // Check if user is authenticated
        if (!currUser) {
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Only super admin can delete organizations
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          return response.status(403).json({
            error: "Only super administrators can delete organizations",
          });
        }

        await Organization.delete({ id: parseInt(id) });

        await EventLogs.logEvent(
          "organization_deleted",
          {
            organizationId: parseInt(id),
            deletedBy: currUser.username,
          },
          currUser.id
        );

        response.status(200).json({ success: true });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );

  /**
   * GET /organizations/:id/remaining-seats
   * Get remaining seats for an organization
   */
  app.get(
    "/organizations/:id/remaining-seats",
    [validatedRequest],
    async (request, response) => {
      try {
        const currUser = await userFromSession(request, response);
        const { id } = request.params;

        // Check if user is authenticated
        if (!currUser) {
          return response.status(401).json({ error: "Unauthorized" });
        }

        // Ensure user has role property
        if (!currUser.role) {
          return response.status(401).json({ error: "Invalid user data" });
        }

        // Users can only check their own organization's remaining seats
        if (currUser.role !== ROLES.admin || currUser.organizationId) {
          if (currUser.organizationId !== parseInt(id)) {
            return response.status(403).json({
              error: "You can only check your own organization's remaining seats",
            });
          }
        }

        const remainingSeats = await Organization.getRemainingSeats(parseInt(id));
        response.status(200).json({ remainingSeats });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { organizationEndpoints };
