import express from "express";
import { createOrUpdateQuestion, getQuestionById, getDraftQuestions, deleteQuestions, 
    submitQuestionsForApproval, getSubmittedQuestions ,getAvailablePapers,claimPaper, 
    getClaimedPapers ,getAllCourses ,getClaimedPapersByMaker,getQuestionPaperById ,getMakerDashboardStats} from "../controllers/questionController.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";
import { ROLES } from "../constants/roles.js";
import upload from "../middlewares/uploadmiddleware.js";

const router = express.Router();

router.post(
    "/create",
    protect,
    upload.fields([
        { name: "questionImage", maxCount: 1 },
        { name: "explanationImage", maxCount: 1 },
        // UPDATED: Replaced 'referenceImage' with two new fields
        { name: "referenceImage1", maxCount: 1 },
        { name: "referenceImage2", maxCount: 1 },
        // This handles all images for the answer choices
        { name: "choicesImage", maxCount: 10 },
    ]),
    createOrUpdateQuestion
);
router.get("/drafts", protect, authorize(ROLES.MAKER), getDraftQuestions);
router.delete("/delete", protect, deleteQuestions);
router.put("/submit", protect, submitQuestionsForApproval);
router.get("/submitted", protect, getSubmittedQuestions);
router.get('/available', protect, authorize('maker'), getAvailablePapers);
router.put('/papers/:id/claim', protect, authorize('maker'), claimPaper);
router.get('/papers/claimed', protect, authorize('maker'), getClaimedPapers);
router.get("/all", protect, getAllCourses);
router.get("/papers/makerclaimed", protect, getClaimedPapersByMaker);
router.get("/dashboard", protect, getMakerDashboardStats)
router.get("/question-papers/:id",protect,getQuestionPaperById)
router.get("/:id", protect, getQuestionById);

export default router;