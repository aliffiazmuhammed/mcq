const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d", // token valid for 7 days
    });
};

// Verify JWT
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
