/**
 * Billing Service
 * Handles billing-related operations including subscription status, seat limits, and webhooks
 * 
 * This is a placeholder service for future integration with payment providers like Stripe or Paddle.
 */

const { Organization } = require("../models/organization");
const User = require("../models/user");
const { EventLogs } = require("../models/eventLogs");

/**
 * Seat limit configuration per plan
 */
const PLAN_SEAT_LIMITS = {
  free: 5,
  pro: 25,
  enterprise: 100,
};

/**
 * Check if organization has exceeded seat limit
 * @param {number} organizationId - Organization ID
 * @returns {Promise<{exceeded: boolean, current: number, limit: number, remaining: number}>}
 */
async function checkSeatLimit(organizationId) {
  try {
    const organization = await Organization.get({ id: organizationId });
    if (!organization) {
      return { exceeded: false, current: 0, limit: 0, remaining: 0 };
    }

    const usersCount = await Organization.getUsersCount(organizationId);
    const seatLimit = organization.seatLimit || PLAN_SEAT_LIMITS[organization.plan] || PLAN_SEAT_LIMITS.free;
    const remaining = Math.max(0, seatLimit - usersCount);

    return {
      exceeded: usersCount >= seatLimit,
      current: usersCount,
      limit: seatLimit,
      remaining,
    };
  } catch (error) {
    console.error("Error checking seat limit:", error.message);
    return { exceeded: false, current: 0, limit: 0, remaining: 0 };
  }
}

/**
 * Enforce seat limit - prevent adding users if limit reached
 * @param {number} organizationId - Organization ID
 * @returns {Promise<boolean>} True if under limit, false otherwise
 */
async function enforceSeatLimit(organizationId) {
  const { exceeded } = await checkSeatLimit(organizationId);
  
  if (exceeded) {
    return false;
  }
  
  return true;
}

/**
 * Handle Stripe webhook events (placeholder)
 * @param {Object} event - Stripe event object
 * @returns {Promise<{success: boolean, message: string|null}>}
 */
async function handleStripeWebhook(event) {
  try {
    const eventType = event.type;
    const data = event.data.object;

    switch (eventType) {
      case "customer.subscription.created":
      await handleSubscriptionCreated(data);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(data);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(data);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(data);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(data);
        break;
      default:
        console.log(`Unhandled Stripe webhook event: ${eventType}`);
    }

    return { success: true, message: null };
  } catch (error) {
    console.error("Error handling Stripe webhook:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Handle Paddle webhook events (placeholder)
 * @param {Object} event - Paddle event object
 * @returns {Promise<{success: boolean, message: string|null}>}
 */
async function handlePaddleWebhook(event) {
  try {
    const eventType = event.event_type;
    const data = event.data;

    switch (eventType) {
      case "subscription.created":
        await handleSubscriptionCreated(data);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(data);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(data);
        break;
      case "subscription.payment_succeeded":
        await handlePaymentSucceeded(data);
        break;
      case "subscription.payment_failed":
        await handlePaymentFailed(data);
        break;
      default:
        console.log(`Unhandled Paddle webhook event: ${eventType}`);
    }

    return { success: true, message: null };
  } catch (error) {
    console.error("Error handling Paddle webhook:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Handle subscription created event
 * @param {Object} data - Subscription data
 */
async function handleSubscriptionCreated(data) {
  // Find organization by subscription ID (customer ID)
  const subscriptionId = data.customer_id || data.customer || data.subscription_id;
  
  const orgs = await Organization.where({
    subscriptionId: String(subscriptionId),
  });

  for (const org of orgs) {
    await Organization.update(org.id, {
      status: "active",
      subscriptionId: String(subscriptionId),
    });

    await EventLogs.logEvent(
      "subscription_created",
      {
        organizationId: org.id,
        subscriptionId: String(subscriptionId),
      },
      org.id
    );
  }
}

/**
 * Handle subscription updated event
 * @param {Object} data - Subscription data
 */
async function handleSubscriptionUpdated(data) {
  const subscriptionId = data.customer_id || data.customer || data.subscription_id;
  
  const orgs = await Organization.where({
    subscriptionId: String(subscriptionId),
  });

  for (const org of orgs) {
    await Organization.update(org.id, {
      status: data.status === "active" || data.status === "trialing" ? "active" : "suspended",
    });

    await EventLogs.logEvent(
      "subscription_updated",
      {
        organizationId: org.id,
        subscriptionId: String(subscriptionId),
        status: data.status,
      },
      org.id
    );
  }
}

/**
 * Handle subscription deleted/cancelled event
 * @param {Object} data - Subscription data
 */
async function handleSubscriptionCancelled(data) {
  const subscriptionId = data.customer_id || data.customer || data.subscription_id;
  
  const orgs = await Organization.where({
    subscriptionId: String(subscriptionId),
  });

  for (const org of orgs) {
    await Organization.update(org.id, {
      status: "suspended",
      subscriptionId: null,
    });

    await EventLogs.logEvent(
      "subscription_cancelled",
      {
        organizationId: org.id,
        subscriptionId: String(subscriptionId),
      },
      org.id
    );
  }
}

/**
 * Handle payment succeeded event
 * @param {Object} data - Payment data
 */
async function handlePaymentSucceeded(data) {
  const subscriptionId = data.customer_id || data.customer || data.subscription_id;
  
  const orgs = await Organization.where({
    subscriptionId: String(subscriptionId),
  });

  for (const org of orgs) {
    await Organization.update(org.id, {
      status: "active",
    });

    await EventLogs.logEvent(
      "payment_succeeded",
      {
        organizationId: org.id,
        amount: data.amount || data.total,
        currency: data.currency,
      },
      org.id
    );
  }
}

/**
 * Handle payment failed event
 * @param {Object} data - Payment data
 */
async function handlePaymentFailed(data) {
  const subscriptionId = data.customer_id || data.customer || data.subscription_id;
  
  const orgs = await Organization.where({
    subscriptionId: String(subscriptionId),
  });

  for (const org of orgs) {
    await Organization.update(org.id, {
      status: "suspended",
    });

    await EventLogs.logEvent(
      "payment_failed",
      {
        organizationId: org.id,
        error: data.last_payment_error || "Payment failed",
      },
      org.id
    );
  }
}

/**
 * Update organization plan
 * @param {number} organizationId - Organization ID
 * @param {string} plan - Plan name (free, pro, enterprise)
 * @returns {Promise<{success: boolean, message: string|null}>}
 */
async function updatePlan(organizationId, plan) {
  try {
    const organization = await Organization.get({ id: organizationId });
    if (!organization) {
      return { success: false, message: "Organization not found" };
    }

    const seatLimit = PLAN_SEAT_LIMITS[plan] || PLAN_SEAT_LIMITS.free;

    await Organization.update(organizationId, {
      plan,
      seatLimit,
    });

    await EventLogs.logEvent(
      "plan_updated",
      {
        organizationId,
        newPlan: plan,
        seatLimit,
      },
      organizationId
    );

    return { success: true, message: null };
  } catch (error) {
    console.error("Error updating plan:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Verify webhook signature (placeholder for Stripe)
 * @param {string} payload - Raw webhook payload
 * @param {string} signature - Webhook signature
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  // Placeholder implementation - actual implementation depends on payment provider
  // For Stripe: use stripe.webhooks.constructEvent(payload, signature)
  // For Paddle: use their signature verification method
  return process.env.NODE_ENV === "development" || !!signature;
}

module.exports = {
  PLAN_SEAT_LIMITS,
  checkSeatLimit,
  enforceSeatLimit,
  handleStripeWebhook,
  handlePaddleWebhook,
  verifyWebhookSignature,
  updatePlan,
};
