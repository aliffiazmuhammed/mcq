import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Import separate models
import Maker from "./src/models/Maker.js";    // maker user
import Checker from "./src/models/Checker.js"; // checker user

dotenv.config();

async function seedUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        await Maker.deleteMany();
        await Checker.deleteMany();

        const hashedPassword = await bcrypt.hash("password123", 10);

        // Seed Makers
        const makers = [
            { name: "Maker User", email: "maker@example.com", password: hashedPassword },
        ];
        await Maker.insertMany(makers);

        // Seed Checkers
        const checkers = [
            { name: "Checker User", email: "checker@example.com", password: hashedPassword },
        ];
        await Checker.insertMany(checkers);

        console.log("✅ Users seeded successfully");
        console.log("👉 Normal user login: user@example.com / password123");
        console.log("👉 Maker login: maker@example.com / password123");
        console.log("👉 Checker login: checker@example.com / password123");

        process.exit();
    } catch (err) {
        console.error("❌ Error seeding users:", err);
        process.exit(1);
    }
}

seedUsers();