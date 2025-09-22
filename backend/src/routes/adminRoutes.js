import express from "express";
import { protect, authorize } from "../middlewares/authmiddleware.js";
import { createUser, getAllUsers, deleteUser } from "../controllers/adminController.js";

const router = express.Router();

// Only admin can access these routes
router.use(protect);
router.use(authorize("admin"));

// Create a user
router.post("/create-user", createUser);

// Get all users
router.get("/users", getAllUsers);

// Delete a user
router.delete("/user/:role/:id", deleteUser);

export default router;
