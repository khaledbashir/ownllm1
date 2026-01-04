const { Organization } = require("../../models/organization");
const User = require("../../models/user");
const prisma = require("../../utils/prisma");

describe("Organization CRUD Operations", () => {
  let testOrganization;
  let testUser;

  beforeEach(async () => {
    // Clean up test data
    await prisma.organizations.deleteMany({});
    await prisma.users.deleteMany({});
    jest.clearAllMocks();

    // Create test user
    testUser = await prisma.users.create({
      data: {
        username: "testuser",
        password: "hashedpassword",
        role: "admin",
        organizationId: null,
      },
    });

    // Create test organization
    testOrganization = await prisma.organizations.create({
      data: {
        name: "Test Organization",
        slug: "test-organization",
        plan: "free",
        seatLimit: 5,
        status: "active",
        subscriptionId: "test-sub-123",
      },
    });
  });

  afterEach(async () => {
    // Clean up
    await prisma.organizations.deleteMany({});
    await prisma.users.deleteMany({});
  });

  describe("Organization.create", () => {
    it("should create a new organization", async () => {
      const result = await Organization.create({
        name: "New Organization",
        slug: "new-organization",
        plan: "pro",
        seatLimit: 25,
        status: "active",
      });

      expect(result.organization).toBeDefined();
      expect(result.organization.name).toBe("New Organization");
      expect(result.organization.slug).toBe("new-organization");
      expect(result.organization.plan).toBe("pro");
    });

    it("should enforce unique slug constraint", async () => {
      const result = await Organization.create({
        name: "Test Organization",
        slug: "test-organization",
        plan: "free",
        seatLimit: 5,
        status: "active",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });
  });

  describe("Organization.get", () => {
    it("should get organization by ID", async () => {
      const result = await Organization.get({ id: testOrganization.id });

      expect(result).toBeDefined();
      expect(result.id).toBe(testOrganization.id);
      expect(result.name).toBe("Test Organization");
    });

    it("should return null for non-existent organization", async () => {
      const result = await Organization.get({ id: 99999 });

      expect(result).toBeNull();
    });

    it("should get organization by slug", async () => {
      const result = await Organization.get({ slug: "test-organization" });

      expect(result).toBeDefined();
      expect(result.slug).toBe("test-organization");
    });
  });

  describe("Organization.where", () => {
    it("should return all organizations", async () => {
      await prisma.organizations.create({
        data: {
          name: "Another Organization",
          slug: "another-organization",
          plan: "enterprise",
          seatLimit: 100,
          status: "active",
        },
      });

      const result = await Organization.where();

      expect(result.length).toBe(2);
    });

    it("should filter organizations by clause", async () => {
      await prisma.organizations.create({
        data: {
          name: "Pro Organization",
          slug: "pro-organization",
          plan: "pro",
          seatLimit: 25,
          status: "active",
        },
      });

      const result = await Organization.where({ plan: "free" });

      expect(result.length).toBe(1);
      expect(result[0].plan).toBe("free");
    });
  });

  describe("Organization.whereWithOrg", () => {
    it("should return organizations filtered by organizationId", async () => {
      const org2 = await prisma.organizations.create({
        data: {
          name: "Organization 2",
          slug: "org-2",
          plan: "pro",
          seatLimit: 25,
          status: "active",
        },
      });

      const result = await Organization.whereWithOrg(org2.id);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(org2.id);
    });

    it("should return empty array for non-existent organizationId", async () => {
      const result = await Organization.whereWithOrg(99999);

      expect(result).toEqual([]);
    });
  });

  describe("Organization.update", () => {
    it("should update organization", async () => {
      const result = await Organization.update(testOrganization.id, {
        name: "Updated Organization",
        plan: "pro",
      });

      expect(result.organization).toBeDefined();
      expect(result.organization.name).toBe("Updated Organization");
      expect(result.organization.plan).toBe("pro");
    });

    it("should return error for non-existent organization", async () => {
      const result = await Organization.update(99999, {
        name: "Test",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Organization.delete", () => {
    it("should delete organization", async () => {
      const result = await Organization.delete(testOrganization.id);

      expect(result.success).toBe(true);

      const deleted = await prisma.organizations.findUnique({
        where: { id: testOrganization.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("Organization.deleteWithOrg", () => {
    it("should delete organization with organizationId check", async () => {
      const result = await Organization.deleteWithOrg(
        testOrganization.id,
        testOrganization.id
      );

      expect(result).toBeDefined();

      const deleted = await prisma.organizations.findUnique({
        where: { id: testOrganization.id },
      });
      expect(deleted).toBeNull();
    });

    it("should not delete organization with mismatched organizationId", async () => {
      const org2 = await prisma.organizations.create({
        data: {
          name: "Organization 2",
          slug: "org-2",
          plan: "pro",
          seatLimit: 25,
          status: "active",
        },
      });

      const result = await Organization.deleteWithOrg(testOrganization.id, org2.id);

      expect(result).toBe(0);

      const stillExists = await prisma.organizations.findUnique({
        where: { id: testOrganization.id },
      });
      expect(stillExists).toBeDefined();
    });
  });

  describe("Organization.getUsersCount", () => {
    it("should return count of users in organization", async () => {
      await prisma.users.createMany({
        data: [
          {
            username: "user1",
            password: "hash1",
            role: "default",
            organizationId: testOrganization.id,
          },
          {
            username: "user2",
            password: "hash2",
            role: "default",
            organizationId: testOrganization.id,
          },
        ],
      });

      const count = await Organization.getUsersCount(testOrganization.id);

      expect(count).toBe(2);
    });

    it("should return 0 for empty organization", async () => {
      const count = await Organization.getUsersCount(testOrganization.id);

      expect(count).toBe(0);
    });
  });

  describe("Organization.getUsers", () => {
    it("should return all users in organization", async () => {
      await prisma.users.createMany({
        data: [
          {
            username: "user1",
            password: "hash1",
            role: "default",
            organizationId: testOrganization.id,
          },
          {
            username: "user2",
            password: "hash2",
            role: "admin",
            organizationId: testOrganization.id,
          },
        ],
      });

      const users = await Organization.getUsers(testOrganization.id);

      expect(users.length).toBe(2);
    });
  });
});

describe("User-to-Organization Assignment", () => {
  let testOrganization;
  let testUser;

  beforeEach(async () => {
    // Clean up test data
    await prisma.organizations.deleteMany({});
    await prisma.users.deleteMany({});

    testOrganization = await prisma.organizations.create({
      data: {
        name: "Test Organization",
        slug: "test-organization",
        plan: "free",
        seatLimit: 5,
        status: "active",
      },
    });
  });

  afterEach(async () => {
    await prisma.organizations.deleteMany({});
    await prisma.users.deleteMany({});
  });

  it("should assign user to organization on creation", async () => {
    const result = await User.create({
      username: "newuser",
      password: "password123",
      role: "default",
      organizationId: testOrganization.id,
    });

    expect(result.user).toBeDefined();
    expect(result.user.organizationId).toBe(testOrganization.id);
  });

  it("should update user's organization", async () => {
    const user = await prisma.users.create({
      data: {
        username: "user1",
        password: "hash1",
        role: "default",
        organizationId: null,
      },
    });

    const result = await User.update(user.id, {
      organizationId: testOrganization.id,
    });

    expect(result.user).toBeDefined();
    expect(result.user.organizationId).toBe(testOrganization.id);
  });

  it("should allow user without organization (super admin)", async () => {
    const user = await User.create({
      username: "superadmin",
      password: "password123",
      role: "admin",
      organizationId: null,
    });

    expect(user.user).toBeDefined();
    expect(user.user.organizationId).toBeNull();
  });
});
