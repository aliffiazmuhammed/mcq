const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");


const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(email , "=" , password)

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate JWT
        const token = generateToken({
            id: user._id,
            email: user.email,
            role: user.role,
        });

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { login };
