const Question = require("../models/Question");
const { QUESTION_STATUS } = require("../constants/roles");

const createOrUpdateQuestion = async (req, res) => {
    try {
        const {
            _id, 
            course,
            grade,
            subject,
            chapter,
            questionText,
            choices,
            correctAnswer,
            explanation,
            complexity,
            keywords,
            status,
        } = req.body;

        let question;

        if (_id) {
            // ✅ Update existing question
            question = await Question.findOne({ _id, maker: req.user._id });
            if (!question) {
                return res.status(404).json({ message: "Question not found or not yours" });
            }

            question.course = course;
            question.grade = grade;
            question.subject = subject;
            question.chapter = chapter;
            question.text = questionText;
            question.options = choices.map((c, i) => ({
                text: c.text,
                isCorrect: i === correctAnswer,
            }));
            question.explanation = explanation;
            question.complexity = complexity;
            question.keywords = keywords;
            question.status = status || QUESTION_STATUS.DRAFT;

            await question.save();
            return res.json({ message: "Question updated successfully", question });
        } else {
            // ✅ Create new question
            question = new Question({
                course,
                grade,
                subject,
                chapter,
                text: questionText,
                options: choices.map((c, i) => ({
                    text: c.text,
                    isCorrect: i === correctAnswer,
                })),
                explanation,
                complexity,
                keywords,
                status: status || QUESTION_STATUS.DRAFT,
                maker: req.user._id,
            });

            await question.save();
            return res.status(201).json({ message: "Question created successfully", question });
        }
    } catch (err) {
        console.error("Error in createOrUpdateQuestion:", err);
        res.status(500).json({ message: "Server error" });
    }
};

const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        // ✅ Allow maker (who created it) or checker
        if (
            req.user.role !== "maker" &&
            (!question.createdBy || question.createdBy.toString() !== req.user._id.toString())
        ) {
            return res.status(403).json({ message: "Not authorized to view this question" });
        }

        return res.json(question);
    } catch (err) {
        console.error("Error fetching question by ID:", err);
        return res.status(500).json({ message: "Server error" });
    }
};


const getDraftQuestions = async (req, res) => {
    try {
        const drafts = await Question.find({
            maker: req.user._id,           
            status: QUESTION_STATUS.DRAFT,    
        }).sort({ createdAt: -1 });         
        res.status(200).json(drafts);
    } catch (err) {
        res.status(500).json({ message: "Error fetching drafts", error: err.message });
    }
};
const deleteQuestions = async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.user._id;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No question IDs provided" });
        }

        // Delete only if the question belongs to the logged-in user
        const result = await Question.deleteMany({
            _id: { $in: ids },
            maker: userId,
        });

        return res.json({
            message: `${result.deletedCount} question(s) deleted successfully`,
        });
    } catch (error) {
        console.error("Error deleting questions:", error);
        res.status(500).json({ message: "Server error while deleting questions" });
    }
};

const submitQuestionsForApproval = async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.user._id;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No question IDs provided" });
        }

        const result = await Question.updateMany(
            { _id: { $in: ids }, maker: userId }, // only maker's drafts
            { $set: { status: "Pending" } }
        );

        return res.json({
            message: `${result.modifiedCount} question(s) submitted for approval successfully`,
        });
    } catch (error) {
        console.error("Error submitting questions for approval:", error);
        res.status(500).json({ message: "Server error while submitting questions" });
    }
};

// Get all submitted questions for a maker
const getSubmittedQuestions = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch questions created by the user
        const questions = await Question.find({ maker: userId }).sort({ createdAt: -1 });

        // Map the data to include only relevant fields
        const response = questions.map((q) => ({
            _id: q._id,
            questionText: q.text,
            status: q.status, // "Pending", "Approved", "Rejected"
            comments: q.rejectionComments || "", // only relevant if rejected
            course: q.course,
            grade: q.grade,
            subject: q.subject,
            chapter: q.chapter,
            complexity: q.complexity,
        }));

        res.json(response);
    } catch (error) {
        console.error("Error fetching submitted questions:", error);
        res.status(500).json({ message: "Server error" });
    }
};



module.exports = { createOrUpdateQuestion, getQuestionById , getDraftQuestions, deleteQuestions, submitQuestionsForApproval ,getSubmittedQuestions};