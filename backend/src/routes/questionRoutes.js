const express = require("express");
const { createOrUpdateQuestion, getQuestionById , getDraftQuestions , deleteQuestions, submitQuestionsForApproval , getSubmittedQuestions} = require("../controllers/questionController");
const { protect,authorize } = require("../middlewares/authmiddleware");
const { ROLES } = require("../constants/roles");

const router = express.Router();


router.post("/create", protect, createOrUpdateQuestion);
router.get("/drafts", protect, authorize(ROLES.MAKER), getDraftQuestions);
router.delete("/delete", protect, deleteQuestions);
router.put("/submit", protect, submitQuestionsForApproval);
router.get("/submitted", protect, getSubmittedQuestions);
router.get("/:id", protect, getQuestionById);


module.exports = router;
