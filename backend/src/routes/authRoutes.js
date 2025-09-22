import express from "express";
import { loginUser, loginMaker, loginChecker } from "../controllers/authController.js";

const router = express.Router();

// separate login endpoints
router.post("/login/user", loginUser);
router.post("/login/maker", loginMaker);
router.post("/login/checker", loginChecker);

export default router;
