const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
const { ROLES } = require("./src/constants/roles");
const dotenv = require("dotenv");

dotenv.config();

async function seedUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ Connected to MongoDB");

        // Clear existing users (optional, for clean seeding)
        await User.deleteMany();

        const hashedPassword = await bcrypt.hash("password123", 10);

        const users = [
            {
                name: "Maker User",
                email: "maker@example.com",
                password: hashedPassword,
                role: ROLES.MAKER,
            },
            {
                name: "Checker User",
                email: "checker@example.com",
                password: hashedPassword,
                role: ROLES.CHECKER,
            },
        ];

        await User.insertMany(users);

        console.log("✅ Users seeded successfully");
        console.log("👉 Maker login: maker@example.com / password123");
        console.log("👉 Checker login: checker@example.com / password123");

        process.exit();
    } catch (err) {
        console.error("❌ Error seeding users:", err);
        process.exit(1);
    }
}

seedUsers();
