import express from "express";
import {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions,
} from "../controllers/checkerController.js";

const router = express.Router();

router.get("/questions/pending", getPendingQuestions);
router.put("/questions/:id/approve", approveQuestion);
router.put("/questions/:id/reject", rejectQuestion);
router.get("/questions/reviewed", getReviewedQuestions);

export default router;