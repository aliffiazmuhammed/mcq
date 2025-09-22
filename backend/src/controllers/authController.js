import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";
import Admin from "../models/Admin.js"; // ✅ import admin model

// Generic login handler
const handleLogin = async (Model, type, req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Model.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = generateToken({
            id: user._id,
            email: user.email,
            type: type, // "maker" | "checker" | "admin"
        });

        return res.json({
            message: `${type} login successful`,
            token,
            user: {
                id: user._id,
                email: user.email,
                type: type,
            },
        });
    } catch (err) {
        console.error(`${type} login error:`, err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Separate login controllers
const loginMaker = (req, res) => handleLogin(Maker, "maker", req, res);
const loginChecker = (req, res) => handleLogin(Checker, "checker", req, res);
const loginAdmin = (req, res) => handleLogin(Admin, "admin", req, res); // ✅ added admin login

export { loginMaker, loginChecker, loginAdmin };
