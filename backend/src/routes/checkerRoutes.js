const express = require("express");
const {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions,
} = require("../controllers/checkerController");

const router = express.Router();

router.get("/questions/pending", getPendingQuestions);
router.put("/questions/:id/approve", approveQuestion);
router.put("/questions/:id/reject", rejectQuestion);
router.get("/questions/reviewed", getReviewedQuestions);

module.exports = router;
