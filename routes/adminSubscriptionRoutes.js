import express from "express";
import * as subscriptionController from "../controllers/subscriptionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Admin middleware - verify user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES - Authentication required + Admin role
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create new subscription plan
 * POST /api/admin/subscription
 * Body: {
 *   name: "Monthly" | "Yearly",
 *   price: 1000,
 *   interval: "monthly" | "yearly",
 *   durationInDays: 30 | 365,
 *   description?: "...",
 *   features?: ["feature1", "feature2"],
 *   benefits?: ["benefit1", "benefit2"],
 *   badge?: "POPULAR"
 * }
 * Protected: Yes (Admin only)
 */
router.post(
  "/",
  protect,
  adminOnly,
  subscriptionController.createSubscription
);

/**
 * Get all subscription plans
 * GET /api/admin/subscriptions
 * Protected: Yes (Admin only)
 */
router.get(
  "/",
  protect,
  adminOnly,
  subscriptionController.getAllSubscriptionsAdmin
);

/**
 * Update subscription plan details
 * PATCH /api/admin/subscription/:id
 * Body: {
 *   price?: 1000,
 *   description?: "...",
 *   features?: [...],
 *   benefits?: [...],
 *   badge?: "...",
 *   isActive?: true
 * }
 * Protected: Yes (Admin only)
 */
router.patch(
  "/:id",
  protect,
  adminOnly,
  subscriptionController.updateSubscription
);

/**
 * Toggle subscription active/inactive status
 * PATCH /api/admin/subscription/:id/toggle
 * Protected: Yes (Admin only)
 */
router.patch(
  "/:id/toggle",
  protect,
  adminOnly,
  subscriptionController.toggleSubscriptionStatus
);

/**
 * Delete subscription plan
 * DELETE /api/admin/subscription/:id
 * Protected: Yes (Admin only)
 */
router.delete(
  "/:id",
  protect,
  adminOnly,
  subscriptionController.deleteSubscription
);

/**
 * Get subscription statistics
 * GET /api/admin/subscription-stats
 * Returns:
 *   - totalActiveSubscriptions
 *   - subscriptionsByType
 *   - totalRevenue
 * Protected: Yes (Admin only)
 */
router.get(
  "/stats",
  protect,
  adminOnly,
  subscriptionController.getSubscriptionStats
);

export default router;
