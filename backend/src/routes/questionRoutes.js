import express from "express";
import { createOrUpdateQuestion, getQuestionById, getDraftQuestions, deleteQuestions, submitQuestionsForApproval, getSubmittedQuestions } from "../controllers/questionController.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post("/create", protect, createOrUpdateQuestion);
router.get("/drafts", protect, authorize(ROLES.MAKER), getDraftQuestions);
router.delete("/delete", protect, deleteQuestions);
router.put("/submit", protect, submitQuestionsForApproval);
router.get("/submitted", protect, getSubmittedQuestions);
router.get("/:id", protect, getQuestionById);

export default router;