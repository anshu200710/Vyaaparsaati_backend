/**
 * Subscription Initialization Script
 * Run this once to set up default subscriptions in the database
 * Usage: node scripts/initializeSubscriptions.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Subscription from "../models/Subscription.js";
import connectDB from "../config/db.js";

dotenv.config();

const subscriptionData = [
  {
    name: "Monthly",
    price: 1000,
    interval: "monthly",
    durationInDays: 30,
    description: "Perfect for getting started with premium features",
    features: [
      "fast_delivery",
      "premium_templates",
      "whatsapp_messages",
      "invoice_maker",
      "visiting_cards",
      "priority_support",
    ],
    benefits: [
      "Fast document delivery (2-3x faster than free)",
      "Premium templates & freebies",
      "Exclusive WhatsApp message templates",
      "Advanced invoice maker with GST calculation",
      "Professional visiting card generator",
      "Priority customer support",
      "Early access to new features",
    ],
    badge: "POPULAR",
    displayOrder: 0,
    isActive: true,
  },
  {
    name: "Yearly",
    price: 10000,
    interval: "yearly",
    durationInDays: 365,
    description: "Save 17% with yearly subscription - Best value",
    features: [
      "fast_delivery",
      "premium_templates",
      "whatsapp_messages",
      "invoice_maker",
      "visiting_cards",
      "priority_support",
      "quarterly_bonuses",
    ],
    benefits: [
      "Fast document delivery (2-3x faster than free)",
      "Premium templates & freebies",
      "Exclusive WhatsApp message templates",
      "Advanced invoice maker with GST calculation",
      "Professional visiting card generator",
      "Priority customer support",
      "Early access to new features",
      "Quarterly bonus templates & tools",
      "Save ₹2,000 compared to monthly",
    ],
    badge: "SAVE ₹2,000",
    displayOrder: 1,
    isActive: true,
  },
];

async function initializeSubscriptions() {
  try {
    await connectDB();
    console.log("Connected to database");

    // Check if subscriptions already exist
    const existingCount = await Subscription.countDocuments();
    if (existingCount > 0) {
      console.log(
        `Found ${existingCount} existing subscriptions. Skipping initialization.`
      );
      console.log(
        "To reset, run: db.subscriptions.deleteMany({}) in MongoDB"
      );
      process.exit(0);
    }

    // Insert subscription data
    const result = await Subscription.insertMany(subscriptionData);
    console.log(`✓ Successfully created ${result.length} subscriptions:`);
    result.forEach((sub) => {
      console.log(`  - ${sub.name}: ₹${sub.price}/${sub.interval}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error initializing subscriptions:", error);
    process.exit(1);
  }
}

initializeSubscriptions();
