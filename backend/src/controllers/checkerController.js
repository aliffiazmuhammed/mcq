import Question from "../models/Question.js";

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

// Approve a question
const approveQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.params)
        const question = await Question.findByIdAndUpdate(
            id,
            {
                status: "Approved",
                checkerComments: "", // Clear any previous rejection comments
                checkedBy: req.user._id // THE FIX: Record the checker's ID
            },
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        // Return the updated question directly for better practice
        res.json(question);

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

        // Add validation to ensure comments are not empty
        if (!comments || comments.trim() === "") {
            return res.status(400).json({ message: "Comments are required for rejection." });
        }

        const question = await Question.findByIdAndUpdate(
            id,
            {
                status: "Rejected",
                checkerComments: comments,
                checkedBy: req.user._id // THE FIX: Record the checker's ID
            },
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        // Return the updated question directly
        res.json(question);

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
const bulkApproveQuestions = async (req, res) => {
    try {
        // 1. Get the array of question IDs from the request body.
        const { ids } = req.body;

        // 2. Validate the input to ensure it's a non-empty array.
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "An array of question IDs is required." });
        }

        // 3. Perform a single, efficient database operation to update all matching questions.
        // This is much faster than looping and updating one by one.
        const result = await Question.updateMany(
            {
                _id: { $in: ids }, // Find all documents whose _id is in the provided 'ids' array.
                status: "Pending"     // CRITICAL: Only update questions that are currently 'Pending'.
            },
            {
                $set: {
                    status: "Approved",      // Change the status.
                    checkedBy: req.user._id, // Record the ID of the checker who approved them.
                    checkerComments: ""      // Clear any previous rejection comments.
                }
            }
        );

        // 4. Check if any documents were actually modified.
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "No matching pending questions were found to approve." });
        }

        // 5. Send a success response.
        res.json({
            message: `${result.modifiedCount} question(s) have been successfully approved.`
        });

    } catch (err) {
        console.error("Error during bulk approval:", err);
        res.status(500).json({ message: "A server error occurred during the bulk approval process." });
    }
};

export {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions,
    bulkApproveQuestions
};