import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import Admin from "./src/models/Admin.js"; // ✅ Import Admin model

dotenv.config();

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Clear existing admins
        await Admin.deleteMany();

        const hashedPassword = await bcrypt.hash("admin123", 10);

        // Seed Admin
        const admin = {
            name: "Super Admin",
            email: "admin@example.com",
            password: hashedPassword,
        };

        await Admin.create(admin);

        console.log("✅ Admin seeded successfully");
        console.log("👉 Admin login: admin@example.com / admin123");

        process.exit();
    } catch (err) {
        console.error("❌ Error seeding admin:", err);
        process.exit(1);
    }
}

seedAdmin();
