import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "pending"],
      default: "pending",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
      // Razorpay payment ID
    },
    orderId: {
      type: String,
      default: null,
      // Razorpay order ID
    },
    amount: {
      type: Number,
      required: true,
      // Amount paid in paise (Razorpay format)
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    renewalAttempts: {
      type: Number,
      default: 0,
    },
    lastRenewalDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active subscriptions
userSubscriptionSchema.index({ userId: 1, status: 1 });
userSubscriptionSchema.index({ endDate: 1, status: 1 });

// Virtual to check if subscription is expired
userSubscriptionSchema.virtual("isExpired").get(function () {
  return new Date() > this.endDate;
});

// Instance method to check if subscription is active
userSubscriptionSchema.methods.isActive = function () {
  return (
    this.status === "active" &&
    !this.isExpired &&
    new Date() >= this.startDate &&
    new Date() <= this.endDate
  );
};

// Static method to get user's active subscription
userSubscriptionSchema.statics.getActiveSubscription = async function (userId) {
  return this.findOne({
    userId,
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  }).populate("subscriptionId");
};

export default mongoose.model("UserSubscription", userSubscriptionSchema);
