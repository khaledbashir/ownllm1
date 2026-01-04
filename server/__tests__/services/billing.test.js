const {
  checkSeatLimit,
  enforceSeatLimit,
  updatePlan,
  PLAN_SEAT_LIMITS,
} = require("../../services/billing");
const { Organization } = require("../../models/organization");
const User = require("../../models/user");
const prisma = require("../../utils/prisma");

describe("Billing Service", () => {
  let testOrganization;

  beforeEach(async () => {
    // Clean up
    await prisma.organizations.deleteMany({});
    await prisma.users.deleteMany({});
    jest.clearAllMocks();

    testOrganization = await prisma.organizations.create({
      data: {
        name: "Test Organization",
        slug: "test-org",
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

  describe("PLAN_SEAT_LIMITS", () => {
    it("should have correct seat limits for all plans", () => {
      expect(PLAN_SEAT_LIMITS.free).toBe(5);
      expect(PLAN_SEAT_LIMITS.pro).toBe(25);
      expect(PLAN_SEAT_LIMITS.enterprise).toBe(100);
    });
  });

  describe("checkSeatLimit", () => {
    it("should return correct seat usage for empty organization", async () => {
      const result = await checkSeatLimit(testOrganization.id);

      expect(result.exceeded).toBe(false);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(5);
    });

    it("should return correct seat usage with users", async () => {
      // Add 2 users
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

      const result = await checkSeatLimit(testOrganization.id);

      expect(result.exceeded).toBe(false);
      expect(result.current).toBe(2);
      expect(result.remaining).toBe(3);
    });

    it("should detect when seat limit is exceeded", async () => {
      // Fill all seats
      for (let i = 0; i < 5; i++) {
        await prisma.users.create({
          data: {
            username: `user${i}`,
            password: `hash${i}`,
            role: "default",
            organizationId: testOrganization.id,
          },
        });
      }

      const result = await checkSeatLimit(testOrganization.id);

      expect(result.exceeded).toBe(true);
      expect(result.current).toBe(5);
      expect(result.remaining).toBe(0);
    });

    it("should handle non-existent organization gracefully", async () => {
      const result = await checkSeatLimit(99999);

      expect(result.exceeded).toBe(false);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(0);
      expect(result.remaining).toBe(0);
    });

    it("should use organization's seatLimit if set", async () => {
      // Create org with custom seat limit
      const customOrg = await prisma.organizations.create({
        data: {
          name: "Custom Org",
          slug: "custom-org",
          plan: "pro",
          seatLimit: 50, // Custom limit different from plan default
          status: "active",
        },
      });

      const result = await checkSeatLimit(customOrg.id);

      expect(result.limit).toBe(50);
    });
  });

  describe("enforceSeatLimit", () => {
    it("should return true when under limit", async () => {
      const result = await enforceSeatLimit(testOrganization.id);

      expect(result).toBe(true);
    });

    it("should return false when limit exceeded", async () => {
      // Fill all seats
      for (let i = 0; i < 5; i++) {
        await prisma.users.create({
          data: {
            username: `user${i}`,
            password: `hash${i}`,
            role: "default",
            organizationId: testOrganization.id,
          },
        });
      }

      const result = await enforceSeatLimit(testOrganization.id);

      expect(result).toBe(false);
    });

    it("should return false for non-existent organization", async () => {
      const result = await enforceSeatLimit(99999);

      expect(result).toBe(false);
    });
  });

  describe("updatePlan", () => {
    it("should update organization plan", async () => {
      const result = await updatePlan(testOrganization.id, "pro");

      expect(result.success).toBe(true);
      expect(result.message).toBeNull();

      // Verify update
      const updated = await prisma.organizations.findUnique({
        where: { id: testOrganization.id },
      });
      expect(updated.plan).toBe("pro");
      expect(updated.seatLimit).toBe(25);
    });

    it("should update seat limit based on plan", async () => {
      await updatePlan(testOrganization.id, "enterprise");

      const updated = await prisma.organizations.findUnique({
        where: { id: testOrganization.id },
      });
      expect(updated.seatLimit).toBe(100);
    });

    it("should return error for non-existent organization", async () => {
      const result = await updatePlan(99999, "pro");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Organization not found");
    });

    it("should handle invalid plan gracefully", async () => {
      const result = await updatePlan(testOrganization.id, "invalid");

      expect(result.success).toBe(true); // Prisma handles this
    });
  });

  describe("Seat Limit Scenarios", () => {
    it("should handle zero remaining seats", async () => {
      // Fill 4 out of 5 seats
      for (let i = 0; i < 4; i++) {
        await prisma.users.create({
          data: {
            username: `user${i}`,
            password: `hash${i}`,
            role: "default",
            organizationId: testOrganization.id,
          },
        });
      }

      const result = await checkSeatLimit(testOrganization.id);

      expect(result.exceeded).toBe(false);
      expect(result.current).toBe(4);
      expect(result.remaining).toBe(0);
    });

    it("should correctly update seat limit on plan upgrade", async () => {
      // Fill all 5 seats
      for (let i = 0; i < 5; i++) {
        await prisma.users.create({
          data: {
            username: `user${i}`,
            password: `hash${i}`,
            role: "default",
            organizationId: testOrganization.id,
          },
        });
      }

      // Check before upgrade
      const beforeUpgrade = await checkSeatLimit(testOrganization.id);
      expect(beforeUpgrade.exceeded).toBe(true);

      // Upgrade to pro
      await updatePlan(testOrganization.id, "pro");

      // Check after upgrade
      const afterUpgrade = await checkSeatLimit(testOrganization.id);
      expect(afterUpgrade.exceeded).toBe(false);
      expect(afterUpgrade.remaining).toBe(20);
    });

    it("should correctly update seat limit on plan downgrade", async () => {
      // Create pro org with 10 users
      const proOrg = await prisma.organizations.create({
        data: {
          name: "Pro Organization",
          slug: "pro-org",
          plan: "pro",
          seatLimit: 25,
          status: "active",
        },
      });

      for (let i = 0; i < 10; i++) {
        await prisma.users.create({
          data: {
            username: `prouser${i}`,
            password: `hash${i}`,
            role: "default",
            organizationId: proOrg.id,
          },
        });
      }

      // Downgrade to free
      await updatePlan(proOrg.id, "free");

      const result = await checkSeatLimit(proOrg.id);
      expect(result.limit).toBe(5);
      expect(result.exceeded).toBe(true); // Now exceeds limit
    });
  });
});
