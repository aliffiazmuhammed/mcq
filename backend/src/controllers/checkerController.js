import Question from "../models/Question.js";
import QuestionPaper from "../models/QuestionPaper.js";
import mongoose from "mongoose";
import Checker from "../models/Checker.js";

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
    const { id } = req.params;
    const checkerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Update the question document
        const question = await Question.findByIdAndUpdate(
            id,
            {
                status: "Approved",
                checkerComments: "", // Clear any previous rejection comments
                checkedBy: checkerId
            },
            { new: true, session }
        );

        if (!question) {
            throw new Error("Question not found.");
        }

        // 2. Increment the accepted question count for the checker
        await Checker.findByIdAndUpdate(
            checkerId,
            { $inc: { acceptedquestioncount: 1 } },
            { session }
        );

        // 3. If both succeed, commit the transaction
        await session.commitTransaction();

        res.json(question);

    } catch (err) {
        // 4. If any error occurs, abort the transaction
        await session.abortTransaction();

        console.error("Error in approveQuestion transaction:", err);

        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }

        res.status(500).json({ message: "Server error during approval. The operation was rolled back." });
    } finally {
        // 5. Always end the session
        session.endSession();
    }
};


const rejectQuestion = async (req, res) => {
    const { id } = req.params;
    const { comments } = req.body;
    const checkerId = req.user._id;

    // Start a Mongoose session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate input
        if (!comments || comments.trim() === "") {
            // Throwing an error here will be caught and will abort the transaction
            throw new Error("Comments are required for rejection.");
        }

        // 2. Update the question document within the transaction
        const question = await Question.findByIdAndUpdate(
            id,
            {
                status: "Rejected",
                checkerComments: comments,
                checkedBy: checkerId
            },
            { new: true, session } // Pass the session to this operation
        );

        if (!question) {
            throw new Error("Question not found.");
        }

        // 3. Increment the rejected question count for the checker within the transaction
        // Using the $inc operator is atomic and efficient.
        await Checker.findByIdAndUpdate(
            checkerId,
            { $inc: { rejectedquestioncount: 1 } },
            { session } // Pass the session to this operation
        );

        // 4. If both operations succeed, commit the transaction
        await session.commitTransaction();

        res.json(question);

    } catch (err) {
        // 5. If any error occurs, abort the transaction to roll back all changes
        await session.abortTransaction();

        console.error("Error in rejectQuestion transaction:", err);

        // Send appropriate error responses
        if (err.message.includes("Comments are required")) {
            return res.status(400).json({ message: err.message });
        }
        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }

        res.status(500).json({ message: "Server error during rejection. The operation was rolled back." });
    } finally {
        // 6. Always end the session
        session.endSession();
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
    const { ids } = req.body;
    const checkerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate input
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new Error("An array of question IDs is required.");
        }

        // 2. Update all matching questions within the transaction
        const result = await Question.updateMany(
            { _id: { $in: ids }, status: "Pending" },
            {
                $set: {
                    status: "Approved",
                    checkedBy: checkerId,
                    checkerComments: ""
                }
            },
            { session }
        );

        // 3. If questions were modified, increment the checker's count
        if (result.modifiedCount > 0) {
            await Checker.findByIdAndUpdate(
                checkerId,
                { $inc: { acceptedquestioncount: result.modifiedCount } },
                { session }
            );
        } else {
            // If no documents were modified, it's not an error, but we can inform the client.
            // We can let the transaction commit safely.
            return res.status(404).json({ message: "No matching pending questions were found to approve." });
        }

        // 4. If all operations succeed, commit the transaction
        await session.commitTransaction();

        res.json({ message: `${result.modifiedCount} question(s) have been successfully approved.` });

    } catch (err) {
        // 5. If any error occurs, abort the transaction
        await session.abortTransaction();

        console.error("Error during bulk approval transaction:", err);

        if (err.message.includes("IDs is required")) {
            return res.status(400).json({ message: err.message });
        }

        res.status(500).json({ message: "A server error occurred. The bulk approval was rolled back." });
    } finally {
        // 6. Always end the session
        session.endSession();
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