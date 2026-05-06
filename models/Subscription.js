import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    interval: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    durationInDays: {
      type: Number,
      required: true,
      // 30 for monthly, 365 for yearly
    },
    description: {
      type: String,
      default: "",
    },
    features: [
      {
        type: String,
        // Examples: "fast_delivery", "premium_templates", "whatsapp_messages", etc.
      },
    ],
    benefits: [
      {
        type: String,
        // Detailed benefits description
      },
    ],
    savingsPercentage: {
      type: Number,
      default: 0,
      // For yearly: (monthly_price * 12 - yearly_price) / (monthly_price * 12) * 100
    },
    badge: {
      type: String,
      default: "",
      // Example: "POPULAR" or "SAVE 17%"
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      // 0 for monthly, 1 for yearly
    },
  },
  {
    timestamps: true,
  }
);

// Calculate savings percentage automatically
subscriptionSchema.pre("save", function (next) {
  if (this.interval === "yearly") {
    const monthlyPrice = 1000; // Assuming monthly is 1000
    this.savingsPercentage = Math.round(
      ((monthlyPrice * 12 - this.price) / (monthlyPrice * 12)) * 100
    );
  }
  next();
});

export default mongoose.model("Subscription", subscriptionSchema);
