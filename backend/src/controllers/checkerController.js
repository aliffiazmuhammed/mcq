import Question from "../models/Question.js";
import QuestionPaper from "../models/QuestionPaper.js";


const getPendingQuestions = async (req, res) => {
    try {
        // Find all questions with the status "Pending".
        const questions = await Question.find({ status: "Pending" })
            // --- UPDATED ---
            // Chain multiple .populate() calls to retrieve related data.

            // Populate the 'maker' field with the user's name and email.
            .populate("maker", "name email")

            // Populate the 'course' field with its 'title'.
            .populate("course", "title")

            // Populate the 'questionPaper' field with its 'name'.
            .populate("questionPaper", "name");

        // The response will now contain the full maker, course, and question paper objects.
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
        })
            // Populate the maker's details
            .populate("maker", "name email")
            // --- UPDATED: Populate the course title ---
            .populate("course", "title")
            // --- UPDATED: Populate the question paper name ---
            .populate("questionPaper", "name")
            .sort({ updatedAt: -1 }); // Sort by last updated time

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


const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the question by its ID.
        // --- UPDATED: Chained additional .populate() calls ---
        const question = await Question.findById(id)
            // Populate the 'maker' who created the question.
            .populate("maker", "name email")

            // Populate the 'checkedBy' user if the question has been reviewed.
            .populate("checkedBy", "name email")

            // Populate the 'course' to get its title.
            .populate("course", "title")

            // Populate the 'questionPaper' and select both its 'name' and 'url'.
            // This is the key change to send the PDF URL to the frontend.
            .populate("questionPaper", "name url");

        if (!question) {
            return res.status(404).json({ message: "Question not found." });
        }

        // The question object sent in the response will now include a 'questionPaper'
        // object with the name and url, e.g., 
        // questionPaper: { _id: '...', name: 'Sample Paper 2024', url: 'http://...' }
        return res.json(question);

    } catch (err) {
        console.error("Error fetching question by ID:", err);
        if (err.kind === 'ObjectId') {
            // This handles cases where the provided ID is not a valid MongoDB ObjectId format.
            return res.status(400).json({ message: "Invalid question ID format." });
        }
        return res.status(500).json({ message: "Server error." });
    }
};

const getPapers = async (req, res) => {
    try {
        // Find all documents where 'usedBy' is NOT null.
        // This finds all papers that have been locked by a maker.
        const claimedPapers = await QuestionPaper.find({ usedBy: { $ne: null } })
            .populate("usedBy", "name") // CRITICAL: Get the name of the maker who claimed it.
            .sort({ updatedAt: -1 });  // Show the most recently claimed papers first.

        res.json(claimedPapers);
    } catch (err) {
        console.error("Error fetching claimed papers:", err);
        res.status(500).json({ message: "Server error while fetching claimed papers." });
    }
};

export {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions,
    bulkApproveQuestions,
    getQuestionById,
    getPapers
};