import { verifyToken } from "../utils/jwt.js";
import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";
import Admin from "../models/Admin.js"; // ✅ import admin model

// Protect routes
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = verifyToken(token);

            let currentUser = null;

            if (decoded.type === "maker") {
                currentUser = await Maker.findById(decoded.id).select("-password");
            } else if (decoded.type === "checker") {
                currentUser = await Checker.findById(decoded.id).select("-password");
            } else if (decoded.type === "admin") {   
                currentUser = await Admin.findById(decoded.id).select("-password");
            }

            if (!currentUser) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            req.user = currentUser;
            req.userType = decoded.type;
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Not authorized, invalid token" });
        }
    }

    return res.status(401).json({ message: "Not authorized, no token" });
};

// Restrict to specific roles
const authorize = (...allowedTypes) => {
    return (req, res, next) => {
        if (!allowedTypes.includes(req.userType)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
};

export { protect, authorize };
