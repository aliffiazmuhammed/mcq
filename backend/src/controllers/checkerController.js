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

const updateActionLog = async (Model, userId, logArrayName, questionId, session) => {
    const result = await Model.updateOne(
        { _id: userId, [`${logArrayName}.questionId`]: questionId },
        { $push: { [`${logArrayName}.$.actionDates`]: new Date() } },
        { session }
    );

    if (result.modifiedCount === 0) {
        await Model.findByIdAndUpdate(
            userId,
            { $push: { [logArrayName]: { questionId: questionId, actionDates: [new Date()] } } },
            { session }
        );
    }
};


// Approve a question
const approveQuestion = async (req, res) => {
    const { id } = req.params;
    const currentCheckerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const questionToApprove = await Question.findById(id).session(session);
        if (!questionToApprove) throw new Error("Question not found.");

        const originalCheckerId = questionToApprove.checkedBy;
        const makerId = questionToApprove.maker;
        const questionId = questionToApprove._id;

        // Handle "False Rejection" Logging
        if (questionToApprove.makerComments === "No corrections required" && originalCheckerId) {
            await updateActionLog(Checker, originalCheckerId, 'checkerfalserejections', questionId, session);
        }

        // Update the Question's status
        const updatedQuestion = await Question.findByIdAndUpdate(id, {
            status: "Approved",
            checkedBy: currentCheckerId,
            checkerComments: "",
        }, { new: true, session });

        // Log this approval for the current checker and the maker
        await updateActionLog(Checker, currentCheckerId, 'checkeracceptedquestion', questionId, session);
        await updateActionLog(Maker, makerId, 'makeracceptedquestions', questionId, session);

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
        if (!comments || comments.trim() === "") {
            throw new Error("Comments are required for rejection.");
        }

        const question = await Question.findByIdAndUpdate(id, {
            status: "Rejected",
            checkerComments: comments,
            checkedBy: checkerId
        }, { new: true, session });

        if (!question) {
            throw new Error("Question not found.");
        }

        const questionId = question._id;
        const makerId = question.maker;

        // Log this rejection for the current checker
        await updateActionLog(Checker, checkerId, 'checkerrejectedquestion', questionId, session);

        // Log this rejection for the question's maker
        await updateActionLog(Maker, makerId, 'makerrejectedquestions', questionId, session);

        await session.commitTransaction();
        res.json(question);

    } catch (err) {
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

        // 3. Update the status of all questions at once
        const result = await Question.updateMany(
            { _id: { $in: approvedQuestionIds } },
            { $set: { status: "Approved", checkedBy: currentCheckerId, checkerComments: "" } },
            { session }
        );

        // 4. Prepare for concurrent log updates
        const updatePromises = [];

        for (const question of questionsToApprove) {
            const makerId = question.maker;
            const questionId = question._id;
            const originalCheckerId = question.checkedBy;

            // Log the approval for the current checker
            updatePromises.push(
                updateActionLog(Checker, currentCheckerId, 'checkeracceptedquestion', questionId, session)
            );

            // Log the approval for the question's maker
            updatePromises.push(
                updateActionLog(Maker, makerId, 'makeracceptedquestions', questionId, session)
            );

            // If it was a "false rejection", log that for the original checker
            if (question.makerComments === "No corrections required" && originalCheckerId) {
                updatePromises.push(
                    updateActionLog(Checker, originalCheckerId, 'checkerfalserejections', questionId, session)
                );
            }
        }

        // 5. Execute all historical log updates concurrently
        await Promise.all(updatePromises);

        // 6. If everything succeeds, commit the transaction
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

const getCheckerDashboardStats = async (req, res) => {
    try {
        const { timeframe = 'all' } = req.query; // 'weekly', 'monthly', 'all'

        // 1. Define the date range based on the timeframe filter
        let startDate = new Date(0); // A very old date for 'all' time
        if (timeframe === 'weekly') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === 'monthly') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // 2. Fetch all statistics concurrently for maximum efficiency
        const [
            totalQuestions,
            totalApproved,
            totalRejected,
            totalPending,
            questionsForChart
        ] = await Promise.all([
            Question.countDocuments(), // Total questions of all time
            Question.countDocuments({ status: 'Approved', updatedAt: { $gte: startDate } }),
            Question.countDocuments({ status: 'Rejected', updatedAt: { $gte: startDate } }),
            Question.countDocuments({ status: 'Pending' }), // Pending is a current state, not time-based
            // Fetch questions to build the chart, considering the action date (updatedAt)
            Question.find({
                status: { $in: ['Approved', 'Rejected', 'Pending'] },
                updatedAt: { $gte: startDate }
            }).lean()
        ]);

        // 3. Prepare data for the chart, grouping counts by date
        const chartData = {};
        const processForChart = (question) => {
            // Use updatedAt for actions, createdAt for newly pending questions
            const actionDate = (question.status === 'Pending') ? question.createdAt : question.updatedAt;
            const date = new Date(actionDate).toISOString().split('T')[0];

            if (!chartData[date]) {
                chartData[date] = { date, approved: 0, rejected: 0, pending: 0 };
            }
            if (question.status === 'Approved') chartData[date].approved++;
            if (question.status === 'Rejected') chartData[date].rejected++;
            // Only count pending questions created within the timeframe for the chart
            if (question.status === 'Pending' && new Date(question.createdAt) >= startDate) {
                chartData[date].pending++;
            }
        };

        questionsForChart.forEach(processForChart);

        // Convert chart data from an object to a sorted array for the frontend
        const sortedChartData = Object.values(chartData).sort((a, b) => new Date(a.date) - new Date(b.date));

        // 4. Send the complete statistics and chart data object
        res.json({
            stats: {
                totalQuestions,
                totalApproved,
                totalRejected,
                totalPending,
            },
            chartData: sortedChartData,
        });

    } catch (err) {
        console.error("Error in getCheckerDashboardStats:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions,
    bulkApproveQuestions,
    getQuestionById,
    getPapers,
    getCheckerDashboardStats
};