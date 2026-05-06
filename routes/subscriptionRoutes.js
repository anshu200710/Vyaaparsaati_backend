import express from "express";
import * as subscriptionController from "../controllers/subscriptionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES - No authentication required
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all available subscription plans
 * GET /api/subscription
 */
router.get("/", subscriptionController.getAllSubscriptions);

/**
 * Get user's current subscription status
 * GET /api/subscription/status
 * Protected: Yes (requires user to be logged in)
 */
router.get("/status", protect, subscriptionController.getUserSubscriptionStatus);

/**
 * Get specific subscription by ID
 * GET /api/subscriptions/:id
 */
router.get("/:id", subscriptionController.getSubscriptionById);

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES - Authentication required
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initiate subscription purchase (creates Razorpay order)
 * POST /api/subscription/initiate-purchase
 * Body: { subscriptionId }
 * Protected: Yes
 */
router.post(
  "/initiate-purchase",
  protect,
  subscriptionController.initiatePurchase
);

/**
 * Verify payment and create subscription
 * POST /api/subscription/verify-payment
 * Body: { subscriptionId, paymentId, orderId, signature }
 * Protected: Yes
 */
router.post(
  "/verify-payment",
  protect,
  subscriptionController.verifyPaymentAndCreateSubscription
);

/**
 * Cancel active subscription
 * POST /api/subscription/cancel
 * Body: { reason? }
 * Protected: Yes
 */
router.post("/cancel", protect, subscriptionController.cancelSubscription);

/**
 * Get subscription purchase history
 * GET /api/subscription/history
 * Protected: Yes
 */
router.get("/history", protect, subscriptionController.getSubscriptionHistory);

export default router;
