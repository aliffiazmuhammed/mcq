const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

// Protect routes (must be logged in)
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = verifyToken(token);

            req.user = await User.findById(decoded.id).select("-password");
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Not authorized, invalid token" });
        }
    }

    return res.status(401).json({ message: "Not authorized, no token" });
};
// Restrict routes to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
};

module.exports = { protect, authorize };
