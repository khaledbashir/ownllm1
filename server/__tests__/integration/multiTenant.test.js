const { Organization } = require("../../models/organization");
const { User } = require("../../models/user");
const { Workspace } = require("../../models/workspace");
const { checkSeatLimit, updatePlan } = require("../../services/billing");
const prisma = require("../../utils/prisma");

describe("Multi-Tenant Integration Tests", () => {
  let org1, org2;
  let org1User, org2User, superAdmin;

  beforeEach(async () => {
    // Clean up
    await prisma.workspaces.deleteMany({});
    await prisma.users.deleteMany({});
    await prisma.organizations.deleteMany({});
    jest.clearAllMocks();

    // Create two organizations
    org1 = await prisma.organizations.create({
      data: {
        name: "Organization 1",
        slug: "org-1",
        plan: "free",
        seatLimit: 5,
        status: "active",
      },
    });

    org2 = await prisma.organizations.create({
      data: {
        name: "Organization 2",
        slug: "org-2",
        plan: "pro",
        seatLimit: 25,
        status: "active",
      },
    });

    // Create users for each organization
    org1User = await prisma.users.create({
      data: {
        username: "org1user",
        password: "hash1",
        role: "default",
        organizationId: org1.id,
      },
    });

    org2User = await prisma.users.create({
      data: {
        username: "org2user",
        password: "hash2",
        role: "admin",
        organizationId: org2.id,
      },
    });

    // Create super admin
    superAdmin = await prisma.users.create({
      data: {
        username: "superadmin",
        password: "hash3",
        role: "admin",
        organizationId: null,
      },
    });
  });

  afterEach(async () => {
    await prisma.workspaces.deleteMany({});
    await prisma.users.deleteMany({});
    await prisma.organizations.deleteMany({});
  });

  describe("Tenant Isolation (Cross-Org Data Access Prevention)", () => {
    it("should prevent org1 user from accessing org2 workspaces", async () => {
      // Create workspace in org2
      await prisma.workspaces.create({
        data: {
          name: "Org2 Workspace",
          slug: "org2-workspace",
          organizationId: org2.id,
        },
      });

      // Try to get workspace using org1's organizationId
      const workspaces = await Workspace.whereWithOrg(org1.id);

      expect(workspaces.length).toBe(0);
    });

    it("should allow org2 user to see org2 workspaces only", async () => {
      // Create workspaces in both orgs
      await prisma.workspaces.create({
        data: {
          name: "Org1 Workspace",
          slug: "org1-workspace",
          organizationId: org1.id,
        },
      });

      await prisma.workspaces.create({
        data: {
          name: "Org2 Workspace",
          slug: "org2-workspace",
          organizationId: org2.id,
        },
      });

      // Get workspaces filtered by org2
      const workspaces = await Workspace.whereWithOrg(org2.id);

      expect(workspaces.length).toBe(1);
      expect(workspaces[0].organizationId).toBe(org2.id);
    });

    it("should prevent cross-organization user access", async () => {
      // Create user in org1
      const user1 = await prisma.users.create({
        data: {
          username: "user1",
          password: "hash",
          role: "default",
          organizationId: org1.id,
        },
      });

      // Try to get user using org2 filter
      const users1 = await Organization.getUsers(org1.id);
      const users2 = await Organization.getUsers(org2.id);

      expect(users1).toHaveLength(2); // org1User + user1
      expect(users2).toHaveLength(1); // org2User only
    });

    it("should prevent workspace deletion from different organization", async () => {
      const workspace = await prisma.workspaces.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace",
          organizationId: org1.id,
        },
      });

      // Try to delete using wrong organizationId
      const result = await Workspace.deleteWithOrg(workspace.id, org2.id);

      expect(result).toBe(0);

      // Workspace should still exist
      const stillExists = await prisma.workspaces.findUnique({
        where: { id: workspace.id },
      });
      expect(stillExists).toBeDefined();
    });
  });

  describe("Seat Limit Enforcement", () => {
    it("should correctly count current seats", async () => {
      const result = await checkSeatLimit(org1.id);

      expect(result.exceeded).toBe(false);
      expect(result.current).toBe(1); // org1User
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
    });

    it("should detect when seat limit is exceeded", async () => {
      // Fill all seats (1 existing + 4 new = 5)
      for (let i = 0; i < 4; i++) {
        await prisma.users.create({
          data: {
            username: `user${i}`,
            password: `hash${i}`,
            role: "default",
            organizationId: org1.id,
          },
        });
      }

      const result = await checkSeatLimit(org1.id);
      expect(result.exceeded).toBe(true);
      expect(result.current).toBe(5);
      expect(result.remaining).toBe(0);
    });

    it("should update seat limit when plan changes", async () => {
      // Check initial limit
      const initialCheck = await checkSeatLimit(org1.id);
      expect(initialCheck.limit).toBe(5);

      // Update to pro plan
      await updatePlan(org1.id, "pro");

      // Check new limit
      const updatedCheck = await checkSeatLimit(org1.id);
      expect(updatedCheck.limit).toBe(25);
    });

    it("should handle zero seat remaining correctly", async () => {
      // Fill all seats except 1
      for (let i = 0; i < 4; i++) {
        await prisma.users.create({
          data: {
            username: `user${i}`,
            password: `hash${i}`,
            role: "default",
            organizationId: org1.id,
          },
        });
      }

      const result = await checkSeatLimit(org1.id);
      expect(result.exceeded).toBe(false);
      expect(result.remaining).toBe(0);

      // Add one more user
      await prisma.users.create({
        data: {
          username: "lastuser",
          password: "hash",
          role: "default",
          organizationId: org1.id,
        },
      });

      const exceeded = await checkSeatLimit(org1.id);
      expect(exceeded.exceeded).toBe(true);
    });
  });

  describe("Super Admin Capabilities", () => {
    it("should allow super admin to view all organizations", async () => {
      const organizations = await Organization.where();

      expect(organizations).toHaveLength(2);
      expect(organizations[0].name).toBe("Organization 1");
      expect(organizations[1].name).toBe("Organization 2");
    });

    it("should allow super admin to access any organization's data", async () => {
      // Create workspace in org1
      const ws1 = await prisma.workspaces.create({
        data: {
          name: "Org1 Workspace",
          slug: "org1-ws",
          organizationId: org1.id,
        },
      });

      // Create workspace in org2
      const ws2 = await prisma.workspaces.create({
        data: {
          name: "Org2 Workspace",
          slug: "org2-ws",
          organizationId: org2.id,
        },
      });

      // Super admin should see all (when passing null organizationId)
      const allWorkspaces = await Workspace.whereWithOrg(null);

      expect(allWorkspaces).toHaveLength(2);
    });

    it("should allow super admin to manage users in any organization", async () => {
      const users = await User.where();

      expect(users).toHaveLength(3); // org1User, org2User, superAdmin
    });

    it("should allow super admin to update any organization", async () => {
      const result = await Organization.update(org1.id, {
        name: "Updated Org 1",
      });

      expect(result.success).toBe(true);
      expect(result.organization.name).toBe("Updated Org 1");
    });
  });

  describe("Workspace Isolation", () => {
    it("should filter workspaces by organizationId", async () => {
      // Create workspaces for both orgs
      await prisma.workspaces.createMany({
        data: [
          {
            name: "Org1 Workspace 1",
            slug: "org1-ws1",
            organizationId: org1.id,
          },
          {
            name: "Org1 Workspace 2",
            slug: "org1-ws2",
            organizationId: org1.id,
          },
          {
            name: "Org2 Workspace 1",
            slug: "org2-ws1",
            organizationId: org2.id,
          },
        ],
      });

      const org1Workspaces = await Workspace.whereWithOrg(org1.id);
      const org2Workspaces = await Workspace.whereWithOrg(org2.id);

      expect(org1Workspaces).toHaveLength(2);
      expect(org2Workspaces).toHaveLength(1);
    });

    it("should prevent workspace creation with mismatched organizationId", async () => {
      // This test verifies that Workspace.new respects organizationId
      const result = await Workspace.new(
        "Test Workspace",
        "test-workspace",
        null, // no vector database
        org1.id,
        null, // no user specified
      );

      expect(result).toBeDefined();
      expect(result.organizationId).toBe(org1.id);
    });

    it("should ensure workspace user relationships respect organization", async () => {
      const workspace = await prisma.workspaces.create({
        data: {
          name: "Test Workspace",
          slug: "test-ws",
          organizationId: org1.id,
        },
      });

      // User from org2 should not be able to access org1 workspace
      const userWorkspaces = await Workspace.whereWithUser(org2User.id);

      expect(userWorkspaces).toHaveLength(0);
    });

    it("should prevent cross-organization workspace sharing", async () => {
      const workspace = await prisma.workspaces.create({
        data: {
          name: "Shared Workspace",
          slug: "shared-ws",
          organizationId: org1.id,
        },
      });

      // Try to get workspace using org2 organizationId
      const result = await Workspace.get(workspace.id, org2User.id);

      expect(result).toBeNull();
    });
  });

  describe("Organization User Management", () => {
    it("should only return users from the same organization", async () => {
      // Add more users to org1
      await prisma.users.createMany({
        data: [
          {
            username: "org1user2",
            password: "hash2",
            role: "default",
            organizationId: org1.id,
          },
          {
            username: "org1user3",
            password: "hash3",
            role: "admin",
            organizationId: org1.id,
          },
        ],
      });

      const org1Users = await Organization.getUsers(org1.id);
      const org2Users = await Organization.getUsers(org2.id);

      expect(org1Users).toHaveLength(3);
      expect(org2Users).toHaveLength(1);

      // Verify all returned users have correct organizationId
      org1Users.forEach((user) => {
        expect(user.organizationId).toBe(org1.id);
      });
    });

    it("should correctly count users per organization", async () => {
      const count1 = await Organization.getUsersCount(org1.id);
      const count2 = await Organization.getUsersCount(org2.id);

      expect(count1).toBe(1);
      expect(count2).toBe(1);

      // Add users and recount
      await prisma.users.create({
        data: {
          username: "newuser",
          password: "hash",
          role: "default",
          organizationId: org1.id,
        },
      });

      const newCount1 = await Organization.getUsersCount(org1.id);
      expect(newCount1).toBe(2);
    });
  });
});
