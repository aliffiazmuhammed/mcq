import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";

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
            type : type, // "user" | "maker" | "checker"
        });

        return res.json({
            message: `${type} login successful`,
            token,
            user: {
                id: user._id,
                email: user.email,
                type : type,
            },
        });
    } catch (err) {
        console.error(`${type} login error:`, err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Separate login controllers
const loginUser = (req, res) => handleLogin(User, "user", req, res);
const loginMaker = (req, res) => handleLogin(Maker, "maker", req, res);
const loginChecker = (req, res) => handleLogin(Checker, "checker", req, res);

export { loginUser, loginMaker, loginChecker };
