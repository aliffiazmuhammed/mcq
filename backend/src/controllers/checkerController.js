const Question = require("../models/Question");

// Fetch all pending questions for checker
const getPendingQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ status: "Pending" }).populate("maker", "name email");
        res.json(questions);
    } catch (err) {
        console.error("Error fetching pending questions:", err);
        res.status(500).json({ message: "Server error fetching pending questions" });
    }
};

// Accept a question
const approveQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question.findByIdAndUpdate(
            id,
            { status: "Approved", checkerComments: "" },
            { new: true }
        );

        if (!question) return res.status(404).json({ message: "Question not found" });
        res.json({ message: "Question approved successfully", question });
    } catch (err) {
        console.error("Error approving question:", err);
        res.status(500).json({ message: "Server error approving question" });
    }
};


// Reject a question with comments
const rejectQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;

        const question = await Question.findByIdAndUpdate(
            id,
            { status: "Rejected", checkerComments:comments },
            { new: true }
        );

        if (!question) return res.status(404).json({ message: "Question not found" });
        res.json({ message: "Question rejected successfully", question });
    } catch (err) {
        console.error("Error rejecting question:", err);
        res.status(500).json({ message: "Server error rejecting question" });
    }
};

// Fetch all reviewed questions (Approved + Rejected)
const getReviewedQuestions = async (req, res) => {
    try {
        const questions = await Question.find({
            status: { $in: ["Approved", "Rejected"] }
        }).populate("maker", "name email");

        res.json(questions);
    } catch (err) {
        console.error("Error fetching reviewed questions:", err);
        res.status(500).json({ message: "Server error fetching reviewed questions" });
    }
};

module.exports = {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions
};
