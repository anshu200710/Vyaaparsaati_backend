import Subscription from "../models/Subscription.js";
import UserSubscription from "../models/UserSubscription.js";
import User from "../models/User.js";

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT CONTROLLERS - User-facing subscription operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all available subscriptions
 * GET /api/subscriptions
 */
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ isActive: true }).sort({
      displayOrder: 1,
    });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscriptions",
      error: error.message,
    });
  }
};

/**
 * Get subscription by ID
 * GET /api/subscriptions/:id
 */
export const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscription",
      error: error.message,
    });
  }
};

/**
 * Get user's current subscription status
 * GET /api/subscription/status
 */
export const getUserSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get active subscription
    const userSubscription = await UserSubscription.getActiveSubscription(
      userId
    );

    // Get user data
    const user = await User.findById(userId);

    if (!userSubscription) {
      return res.status(200).json({
        success: true,
        hasActiveSubscription: false,
        subscriptionTier: "free",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      hasActiveSubscription: true,
      subscriptionTier: userSubscription.subscriptionId?.interval || "free",
      data: {
        subscription: userSubscription.subscriptionId,
        startDate: userSubscription.startDate,
        endDate: userSubscription.endDate,
        status: userSubscription.status,
        autoRenew: userSubscription.autoRenew,
        daysRemaining: Math.ceil(
          (userSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscription status",
      error: error.message,
    });
  }
};

/**
 * Initiate subscription purchase (Razorpay order creation)
 * POST /api/subscription/initiate-purchase
 */
export const initiatePurchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "Subscription ID is required",
      });
    }

    // Check if subscription exists
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Check if user already has active subscription
    const existingSubscription =
      await UserSubscription.getActiveSubscription(userId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "User already has an active subscription",
      });
    }

    // Here you would integrate with Razorpay to create an order
    // For now, return order details structure
    const orderData = {
      subscriptionId: subscription._id,
      subscriptionName: subscription.name,
      amount: subscription.price * 100, // Convert to paise
      currency: "INR",
      description: `${subscription.name} Plan - ₹${subscription.price}`,
      receipt: `subscription_${userId}_${Date.now()}`,
      // Razorpay will be handled on client side with order ID
    };

    res.status(200).json({
      success: true,
      message: "Order data prepared",
      data: orderData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error initiating purchase",
      error: error.message,
    });
  }
};

/**
 * Verify payment and create subscription
 * POST /api/subscription/verify-payment
 */
export const verifyPaymentAndCreateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscriptionId, paymentId, orderId, signature } = req.body;

    if (!subscriptionId || !paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment details",
      });
    }

    // Verify Razorpay signature (TODO: implement actual Razorpay verification)
    // const isSignatureValid = verifyRazorpaySignature(orderId, paymentId, signature);
    // if (!isSignatureValid) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Payment signature verification failed",
    //   });
    // }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + subscription.durationInDays);

    // Create user subscription
    const userSubscription = new UserSubscription({
      userId,
      subscriptionId,
      status: "active",
      startDate,
      endDate,
      paymentId,
      orderId,
      amount: subscription.price * 100,
      autoRenew: true,
    });

    await userSubscription.save();

    // Update user subscription fields
    await User.findByIdAndUpdate(userId, {
      "subscription.hasActiveSubscription": true,
      "subscription.currentSubscriptionId": userSubscription._id,
      "subscription.subscriptionTier": subscription.interval,
      "subscription.subscriptionEndDate": endDate,
    });

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: {
        subscription: userSubscription,
        endDate,
        daysValid: subscription.durationInDays,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

/**
 * Cancel user's subscription
 * POST /api/subscription/cancel
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    // Find active subscription
    const userSubscription = await UserSubscription.findOne({
      userId,
      status: "active",
    });

    if (!userSubscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    // Cancel subscription
    userSubscription.status = "cancelled";
    userSubscription.cancelledAt = new Date();
    userSubscription.cancelReason = reason || "User requested cancellation";
    await userSubscription.save();

    // Update user subscription fields
    await User.findByIdAndUpdate(userId, {
      "subscription.hasActiveSubscription": false,
      "subscription.subscriptionTier": "free",
    });

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: userSubscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling subscription",
      error: error.message,
    });
  }
};

/**
 * Get subscription purchase history
 * GET /api/subscription/history
 */
export const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await UserSubscription.find({ userId })
      .populate("subscriptionId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscription history",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CONTROLLERS - Subscription management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new subscription (Admin)
 * POST /api/admin/subscription
 */
export const createSubscription = async (req, res) => {
  try {
    const {
      name,
      price,
      interval,
      durationInDays,
      description,
      features,
      benefits,
      badge,
      displayOrder,
      isActive,
    } = req.body;

    // Validate required fields
    if (!name || price == null || !interval || durationInDays == null) {
      return res.status(400).json({
        success: false,
        message: "Name, price, interval, and durationInDays are required",
      });
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ name });
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Subscription with this name already exists",
      });
    }

    const subscription = new Subscription({
      name,
      price,
      interval,
      durationInDays,
      description,
      features: Array.isArray(features) ? features : [],
      benefits: Array.isArray(benefits) ? benefits : [],
      badge,
      displayOrder: typeof displayOrder === "number" ? displayOrder : undefined,
      isActive: typeof isActive === "boolean" ? isActive : undefined,
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription data",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating subscription",
      error: error.message,
    });
  }
};

/**
 * Update subscription details (Admin)
 * PATCH /api/admin/subscription/:id
 */
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove immutable fields
    delete updateData._id;
    delete updateData.createdAt;

    const subscription = await Subscription.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating subscription",
      error: error.message,
    });
  }
};

/**
 * Get all subscriptions (Admin)
 * GET /api/admin/subscriptions
 */
export const getAllSubscriptionsAdmin = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ displayOrder: 1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscriptions",
      error: error.message,
    });
  }
};

/**
 * Get subscription statistics (Admin)
 * GET /api/admin/subscription-stats
 */
export const getSubscriptionStats = async (req, res) => {
  try {
    const totalActiveSubscriptions = await UserSubscription.countDocuments({
      status: "active",
    });

    const subscriptionsByType = await UserSubscription.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "subscriptions",
          localField: "subscriptionId",
          foreignField: "_id",
          as: "subscription",
        },
      },
      { $unwind: "$subscription" },
      {
        $group: {
          _id: "$subscription.name",
          count: { $sum: 1 },
          totalRevenue: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const totalRevenue = subscriptionsByType.reduce(
      (sum, item) => sum + item.totalRevenue,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        totalActiveSubscriptions,
        subscriptionsByType,
        totalRevenue: totalRevenue / 100, // Convert from paise to rupees
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscription statistics",
      error: error.message,
    });
  }
};

/**
 * Toggle subscription active status (Admin)
 * PATCH /api/admin/subscription/:id/toggle
 */
export const toggleSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    subscription.isActive = !subscription.isActive;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Subscription ${subscription.isActive ? "activated" : "deactivated"}`,
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling subscription status",
      error: error.message,
    });
  }
};

/**
 * Delete subscription plan
 * DELETE /api/admin/subscription/:id
 */
export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Delete all user subscriptions associated with this plan
    await UserSubscription.deleteMany({ subscriptionId: id });

    // Delete the subscription plan
    await Subscription.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting subscription",
      error: error.message,
    });
  }
};
