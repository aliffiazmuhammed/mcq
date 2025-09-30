import express from "express";
import {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions,
    bulkApproveQuestions,
    getQuestionById,
    getPapers,
    getCheckerDashboardStats
} from "../controllers/checkerController.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.get("/questions/pending", getPendingQuestions);
router.put("/questions/:id/approve",protect, approveQuestion);
router.put("/questions/:id/reject", protect,rejectQuestion);
router.put('/questions/approve-bulk', protect, bulkApproveQuestions);
router.get("/questions/reviewed", getReviewedQuestions);
router.get('/papers/claimed', protect, authorize('checker'), getPapers);
router.get('/dashboard', protect, authorize('checker'), getCheckerDashboardStats);
router.get("/questions/:id", protect, authorize('checker', 'admin'), getQuestionById);


export default router;