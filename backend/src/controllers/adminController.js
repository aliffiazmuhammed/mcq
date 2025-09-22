import bcrypt from "bcryptjs";
import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";

// Admin creates a new Maker or Checker
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check role
        if (!["maker", "checker"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'maker' or 'checker'" });
        }

        // Check if email already exists in the chosen role
        const existingUser =
            role === "maker"
                ? await Maker.findOne({ email })
                : await Checker.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser =
            role === "maker"
                ? await Maker.create({ name, email, password: hashedPassword })
                : await Checker.create({ name, email, password: hashedPassword });

        return res.status(201).json({
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role,
            },
        });
    } catch (err) {
        console.error("Admin createUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Optional: Get all users
const getAllUsers = async (req, res) => {
    try {
        const makers = await Maker.find().select("-password");
        const checkers = await Checker.find().select("-password");

        return res.json({ makers, checkers });
    } catch (err) {
        console.error("Admin getAllUsers error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Optional: Delete user
const deleteUser = async (req, res) => {
    try {
        const { role, id } = req.params;

        if (!["maker", "checker"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'maker' or 'checker'" });
        }

        const Model = role === "maker" ? Maker : Checker;
        const user = await Model.findByIdAndDelete(id);

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully` });
    } catch (err) {
        console.error("Admin deleteUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

export { createUser, getAllUsers, deleteUser };
