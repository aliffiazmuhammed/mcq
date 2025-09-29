import Question from "../models/Question.js";
import QuestionPaper from "../models/QuestionPaper.js";
import mongoose from "mongoose";
import Checker from "../models/Checker.js";
import Maker from "../models/Maker.js";

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
    const currentCheckerId = req.user._id; // The checker performing the approval

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the question *before* updating to check its prior state
        const questionToApprove = await Question.findById(id).session(session);

        if (!questionToApprove) {
            throw new Error("Question not found.");
        }

        const originalCheckerId = questionToApprove.checkedBy;
        const makerId = questionToApprove.maker;
        const questionId = questionToApprove._id;

        // 2. Check for the "false rejection" condition
        if (questionToApprove.makerComments === "No corrections required") {
            if (originalCheckerId) {
                // First, try to find and increment the count for this question
                const result = await Checker.updateOne(
                    { _id: originalCheckerId, "checkerfalserejections.questionId": questionId },
                    { $inc: { "checkerfalserejections.$.count": 1 } },
                    { session }
                );
                // If no document was updated, it means the question isn't in the array yet, so add it.
                if (result.modifiedCount === 0) {
                    await Checker.findByIdAndUpdate(
                        originalCheckerId,
                        { $push: { checkerfalserejections: { questionId: questionId, count: 1 } } },
                        { session }
                    );
                }
            }
        }

        // 3. Update the question document itself
        const updatedQuestion = await Question.findByIdAndUpdate(
            id,
            {
                status: "Approved",
                checkedBy: currentCheckerId,
                checkerComments: "",
            },
            { new: true, session }
        );

        // 4. Update the current checker's accepted list
        const checkerResult = await Checker.updateOne(
            { _id: currentCheckerId, "checkeracceptedquestion.questionId": questionId },
            { $inc: { "checkeracceptedquestion.$.count": 1 } },
            { session }
        );
        if (checkerResult.modifiedCount === 0) {
            await Checker.findByIdAndUpdate(
                currentCheckerId,
                { $push: { checkeracceptedquestion: { questionId: questionId } } }, // default count is 1
                { session }
            );
        }

        // 5. Update the maker's accepted list
        const makerResult = await Maker.updateOne(
            { _id: makerId, "makeracceptedquestions.questionId": questionId },
            { $inc: { "makeracceptedquestions.$.count": 1 } },
            { session }
        );
        if (makerResult.modifiedCount === 0) {
            await Maker.findByIdAndUpdate(
                makerId,
                { $push: { makeracceptedquestions: { questionId: questionId } } }, // default count is 1
                { session }
            );
        }

        // 7. If all operations succeed, commit the transaction
        await session.commitTransaction();
        res.json(updatedQuestion);

    } catch (err) {
        await session.abortTransaction();
        console.error("Error in approveQuestion transaction:", err);
        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: "Server error during approval. The operation was rolled back." });
    } finally {
        session.endSession();
    }
};


const rejectQuestion = async (req, res) => {
    const { id } = req.params;
    const { comments } = req.body;
    const checkerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate input
        if (!comments || comments.trim() === "") {
            throw new Error("Comments are required for rejection.");
        }

        // 2. Update the question document
        const question = await Question.findByIdAndUpdate(
            id,
            {
                status: "Rejected",
                checkerComments: comments,
                checkedBy: checkerId
            },
            { new: true, session }
        );

        if (!question) {
            throw new Error("Question not found.");
        }

        const questionId = question._id;
        const makerId = question.maker;

        // 3. Update the checker's rejected list
        // First, try to find and increment the count for this question
        const checkerResult = await Checker.updateOne(
            { _id: checkerId, "checkerrejectedquestion.questionId": questionId },
            { $inc: { "checkerrejectedquestion.$.count": 1 } },
            { session }
        );
        // If no document was updated, it means the question isn't in the array yet, so add it.
        if (checkerResult.modifiedCount === 0) {
            await Checker.findByIdAndUpdate(
                checkerId,
                { $push: { checkerrejectedquestion: { questionId: questionId } } }, // default count is 1
                { session }
            );
        }

        // 4. Update the maker's rejected list
        const makerResult = await Maker.updateOne(
            { _id: makerId, "makerrejectedquestions.questionId": questionId },
            { $inc: { "makerrejectedquestions.$.count": 1 } },
            { session }
        );
        if (makerResult.modifiedCount === 0) {
            await Maker.findByIdAndUpdate(
                makerId,
                { $push: { makerrejectedquestions: { questionId: questionId } } }, // default count is 1
                { session }
            );
        }

        // 5. If all operations succeed, commit the transaction
        await session.commitTransaction();

        res.json(question);

    } catch (err) {
        // 6. If any error occurs, abort the transaction
        await session.abortTransaction();
        console.error("Error in rejectQuestion transaction:", err);

        if (err.message.includes("Comments are required")) {
            return res.status(400).json({ message: err.message });
        }
        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: "Server error during rejection. The operation was rolled back." });
    } finally {
        // 7. Always end the session
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
    const currentCheckerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate input
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new Error("An array of question IDs is required.");
        }

        // 2. Find all valid questions to get their makers, original checkers, and comments
        const questionsToApprove = await Question.find(
            { _id: { $in: ids }, status: "Pending" },
            'maker checkedBy makerComments' // Projection to get all needed fields
        ).session(session);

        if (questionsToApprove.length === 0) {
            await session.abortTransaction();
            return res.status(404).json({ message: "No matching pending questions were found to approve." });
        }

        const approvedQuestionIds = questionsToApprove.map(q => q._id);

        // 3. Aggregate data for various updates
        const makerQuestionIds = {};           // Groups questions by maker for acceptance update
        const falseRejectionsByChecker = {}; // Groups questions by original checker for false rejection update
        const cleanupData = {};              // Groups questions by original checker/maker for rejection list cleanup

        for (const q of questionsToApprove) {
            const makerId = q.maker.toString();
            const questionId = q._id;
            const originalCheckerId = q.checkedBy ? q.checkedBy.toString() : null;

            // Group for maker acceptance
            if (!makerQuestionIds[makerId]) makerQuestionIds[makerId] = [];
            makerQuestionIds[makerId].push(questionId);

            // Group for false rejection logging if the condition is met
            if (q.makerComments === "No corrections required" && originalCheckerId) {
                if (!falseRejectionsByChecker[originalCheckerId]) falseRejectionsByChecker[originalCheckerId] = [];
                falseRejectionsByChecker[originalCheckerId].push(questionId);
            }

            // Group for cleanup if the question was previously rejected (indicated by makerComments)
            if (q.makerComments && originalCheckerId) {
                if (!cleanupData[originalCheckerId]) cleanupData[originalCheckerId] = { checker: [], maker: {} };
                if (!cleanupData[originalCheckerId].maker[makerId]) cleanupData[originalCheckerId].maker[makerId] = [];
                cleanupData[originalCheckerId].checker.push(questionId);
                cleanupData[originalCheckerId].maker[makerId].push(questionId);
            }
        }

        // 4. Update the status of all questions
        const result = await Question.updateMany(
            { _id: { $in: approvedQuestionIds } },
            { $set: { status: "Approved", checkedBy: currentCheckerId, checkerComments: "" } },
            { session }
        );

        // Create an array to hold all concurrent database update promises
        const updatePromises = [];

        // 5. Update the current checker's accepted list
        for (const questionId of approvedQuestionIds) {
            const promise = Checker.updateOne(
                { _id: currentCheckerId, "checkeracceptedquestion.questionId": questionId },
                { $inc: { "checkeracceptedquestion.$.count": 1 } },
                { session }
            ).then(res => {
                if (res.modifiedCount === 0) {
                    return Checker.findByIdAndUpdate(currentCheckerId, { $push: { checkeracceptedquestion: { questionId } } }, { session });
                }
            });
            updatePromises.push(promise);
        }

        // 6. Update each maker's accepted list
        for (const makerId in makerQuestionIds) {
            for (const questionId of makerQuestionIds[makerId]) {
                const promise = Maker.updateOne(
                    { _id: makerId, "makeracceptedquestions.questionId": questionId },
                    { $inc: { "makeracceptedquestions.$.count": 1 } },
                    { session }
                ).then(res => {
                    if (res.modifiedCount === 0) {
                        return Maker.findByIdAndUpdate(makerId, { $push: { makeracceptedquestions: { questionId } } }, { session });
                    }
                });
                updatePromises.push(promise);
            }
        }

        // 7. Update false rejection lists
        for (const checkerId in falseRejectionsByChecker) {
            for (const questionId of falseRejectionsByChecker[checkerId]) {
                const promise = Checker.updateOne(
                    { _id: checkerId, "checkerfalserejections.questionId": questionId },
                    { $inc: { "checkerfalserejections.$.count": 1 } },
                    { session }
                ).then(res => {
                    if (res.modifiedCount === 0) {
                        return Checker.findByIdAndUpdate(checkerId, { $push: { checkerfalserejections: { questionId } } }, { session });
                    }
                });
                updatePromises.push(promise);
            }
        }

        // Execute all updates concurrently
        await Promise.all(updatePromises);

        // 9. If everything succeeds, commit the transaction
        await session.commitTransaction();

        res.json({ message: `${result.modifiedCount} question(s) have been successfully approved.` });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error during bulk approval transaction:", err);
        if (err.message.includes("IDs is required")) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "A server error occurred. The bulk approval was rolled back." });
    } finally {
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
            .populate("questionPaper", "name solutionPaperFile questionPaperFile");

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
console.log(claimedPapers)
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