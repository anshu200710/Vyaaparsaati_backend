/**
 * Create Admin User Script
 * Run this once to create an admin account
 * Usage: node scripts/createAdminUser.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import connectDB from "../config/db.js";

dotenv.config();

async function createAdminUser() {
  try {
    await connectDB();
    console.log("✓ Connected to database");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@vyaapaar.com" });
    if (existingAdmin) {
      console.log("✗ Admin user already exists!");
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      firstName: "Admin",
      lastName: "VyaaparSaathi",
      email: "admin@vyaapaar.com",
      password: "Admin@12345", // Change this to a secure password
      phoneNumber: "9999999999",
      accountType: "individual",
      role: "admin",
      isEmailVerified: true,
    });

    await adminUser.save();

    console.log("\n✓ Admin user created successfully!");
    console.log("\n📋 Admin Credentials:");
    console.log("   Email: admin@vyaapaar.com");
    console.log("   Password: Admin@12345");
    console.log("\n⚠️  Important:");
    console.log("   1. Change the password immediately after first login");
    console.log("   2. Update the email to your own admin email");
    console.log("   3. Keep credentials secure!\n");

    process.exit(0);
  } catch (error) {
    console.error("✗ Error creating admin user:", error.message);
    process.exit(1);
  }
}

createAdminUser();
