import Question from "../models/Question.js";
import { QUESTION_STATUS } from "../constants/roles.js";
import cloudinary from "../config/cloudinary.js"; 
import QuestionPaper from "../models/QuestionPaper.js";
import Course from "../models/Course.js"
import mongoose from 'mongoose';

const createOrUpdateQuestion = async (req, res) => {
    try {
        const {
            _id, course, unit, subject, chapter, questionText,
            questionPaper, questionNumber, // Destructure new fields
            correctAnswer, explanation, complexity, keywords, status,
            existingQuestionImage, existingExplanationImage, existingReferenceImage, existingChoiceImages
        } = req.body;

        // --- Find Course ID from title ---
        let courseId;
        if (mongoose.Types.ObjectId.isValid(course)) {
            courseId = course;
        } else {
            const courseDoc = await Course.findOne({ title: course });
            if (!courseDoc) {
                return res.status(400).json({ message: `Invalid course provided: "${course}" not found.` });
            }
            courseId = courseDoc._id;
        }

        const uploadToCloudinary = async (file) => {
            if (!file) return null;
            const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
            try {
                const result = await cloudinary.uploader.upload(base64, { folder: "questions" });
                return result.secure_url;
            } catch (err) {
                console.error("Cloudinary upload error:", err);
                return null;
            }
        };

        const questionImage = req.files?.questionImage
            ? await uploadToCloudinary(req.files.questionImage[0])
            : (existingQuestionImage || null);

        const explanationImage = req.files?.explanationImage
            ? await uploadToCloudinary(req.files.explanationImage[0])
            : (existingExplanationImage || null);

        const referenceImage = req.files?.referenceImage
            ? await uploadToCloudinary(req.files.referenceImage[0])
            : (existingReferenceImage || null);

        let choiceTexts = req.body.choicesText || [];
        if (!Array.isArray(choiceTexts)) choiceTexts = [choiceTexts];

        const hasImageFlags = req.body.hasImage || [];
        const choiceFiles = req.files?.choicesImage || [];
        let existingImages = req.body.existingChoiceImages || [];
        if (existingImages && !Array.isArray(existingImages)) existingImages = [existingImages];

        const newImageUrls = await Promise.all(
            (choiceFiles || []).map(file => uploadToCloudinary(file))
        );

        let fileCounter = 0;
        const finalImageUrls = hasImageFlags.map((hasImage, i) => {
            if (hasImage !== 'true') return null;
            if (existingImages[i]) {
                return existingImages[i];
            } else {
                return newImageUrls[fileCounter++];
            }
        });

        const mappedChoices = choiceTexts.map((text, i) => ({
            text: text || "",
            image: finalImageUrls[i],
            isCorrect: Number(correctAnswer) === i,
        }));

        // --- UPDATED: Construct questionData with new optional fields ---
        const questionData = {
            course: courseId,
            unit, subject, chapter,
            question: { text: questionText || "", image: questionImage },
            options: mappedChoices,
            explanation: { text: explanation || "", image: explanationImage },
            reference: { text: "", image: referenceImage },
            complexity,
            keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
            status: status || 'Draft',
            maker: req.user._id,
        };

        // Add optional fields only if they have a value. This prevents saving
        // empty strings for fields that should be null or non-existent.
        if (questionPaper) {
            questionData.questionPaper = questionPaper;
        }
        if (questionNumber) {
            questionData.questionNumber = questionNumber;
        }
        // --- END OF UPDATE ---

        let question;
        if (_id) {
            question = await Question.findByIdAndUpdate(_id, questionData, { new: true });
            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }
            return res.json({ message: "Question updated successfully", question });
        } else {
            question = new Question(questionData);
            await question.save();
            return res.status(201).json({ message: "Question created successfully", question });
        }
    } catch (err) {
        console.error("Error in createOrUpdateQuestion:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('course', 'title') // Populates 'course' and selects only the 'title' field
            .populate('questionPaper', 'name'); // Populates 'questionPaper' and selects the 'name'

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.json(question);
    } catch (err) {
        console.error("Error fetching question by ID:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


const getDraftQuestions = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all questions with "Draft" status created by the current user.
        // We send the full question object to the frontend.
        const drafts = await Question.find({
            maker: userId,
            status: "Draft",
        }).sort({ updatedAt: -1 }); // Sort by most recently updated

        // No mapping needed; the full object contains all necessary data.
        res.json(drafts);

    } catch (error) {
        console.error("Error fetching draft questions:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteQuestions = async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.user._id;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No question IDs provided." });
        }

        // 1. Find all questions that the user owns and intends to delete.
        const questionsToDelete = await Question.find({
            _id: { $in: ids },
            maker: userId,
        });

        if (questionsToDelete.length === 0) {
            return res.json({ message: "No matching questions found to delete." });
        }

        // 2. Collect all Cloudinary public IDs from all image fields.
        const publicIdsToDelete = [];

        // Helper function to safely extract the public ID from a Cloudinary URL
        const getPublicIdFromUrl = (url) => {
            if (!url) return null;
            // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/public_id.jpg
            // We want to extract "folder/public_id"
            const match = url.match(/v\d+\/(.+)\.\w{3,4}$/);
            return match ? match[1] : null;
        };

        for (const q of questionsToDelete) {
            // Add main images
            if (q.question?.image) publicIdsToDelete.push(getPublicIdFromUrl(q.question.image));
            if (q.explanation?.image) publicIdsToDelete.push(getPublicIdFromUrl(q.explanation.image));
            if (q.reference?.image) publicIdsToDelete.push(getPublicIdFromUrl(q.reference.image));

            // Add all choice images
            if (q.options) {
                for (const opt of q.options) {
                    if (opt.image) publicIdsToDelete.push(getPublicIdFromUrl(opt.image));
                }
            }
        }

        // 3. If there are images, delete them from Cloudinary.
        // We filter out any null values that may have resulted from empty image fields.
        const validPublicIds = publicIdsToDelete.filter(id => id);

        if (validPublicIds.length > 0) {
            try {
                // Use Cloudinary's bulk deletion API for efficiency
                await cloudinary.api.delete_resources(validPublicIds);
            } catch (cloudinaryError) {
                // Log the Cloudinary error but proceed with database deletion.
                // This prevents a Cloudinary issue from blocking the user's primary action.
                console.error("Cloudinary deletion failed for some assets, but proceeding with DB deletion:", cloudinaryError);
            }
        }

        // 4. Finally, delete the questions from the database.
        const result = await Question.deleteMany({
            _id: { $in: ids },
            maker: userId,
        });

        return res.json({
            message: `${result.deletedCount} question(s) deleted successfully.`,
        });

    } catch (error) {
        console.error("Error deleting questions:", error);
        res.status(500).json({ message: "Server error while deleting questions." });
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

        // Fetch questions that were created by the user AND are NOT in 'Draft' status.
        const questions = await Question.find({
            maker: userId,
            status: { $ne: "Draft" } // <-- THE FIX: Exclude drafts from the results.
        })
            .populate("maker", "name") // Optional: Still useful for filtering on some pages
            .sort({ createdAt: -1 });

        // Now, this 'questions' array will only contain questions with statuses
        // like "Pending", "Approved", or "Rejected".
        res.json(questions);

    } catch (error) {
        console.error("Error fetching submitted questions:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const getAvailablePapers = async (req, res) => {
    try {
        // Find all documents in the QuestionPaper collection where the 'usedBy' field is null.
        // This effectively gets all "unlocked" or "available" papers.
        const availablePapers = await QuestionPaper.find({ usedBy: null })
            .populate("uploadedBy", "name") // Optional: gets the name of the admin who uploaded it
            .sort({ createdAt: -1 });      // Shows the newest papers first

        res.json(availablePapers);

    } catch (err) {
        console.error("Error fetching available papers:", err);
        res.status(500).json({ message: "Server error while fetching available papers." });
    }
};

const claimPaper = async (req, res) => {
    try {
        const paperId = req.params.id;
        const makerId = req.user._id; // The logged-in maker's ID (from the 'protect' middleware)

        // This is a critical atomic operation. It finds a document that matches BOTH conditions:
        // 1. The _id matches the one the user clicked.
        // 2. The 'usedBy' field is STILL null.
        // If it finds a match, it updates 'usedBy' to the current maker's ID.
        const updatedPaper = await QuestionPaper.findOneAndUpdate(
            { _id: paperId, usedBy: null },
            { $set: { usedBy: makerId } },
            { new: true } // This option tells Mongoose to return the document AFTER the update
        );

        // If 'updatedPaper' is null, it means the paper was not found OR another maker
        // claimed it in the moments after the page was loaded. This prevents a race condition.
        if (!updatedPaper) {
            return res.status(409).json({ // 409 Conflict is the appropriate status code
                message: "This paper is no longer available. It may have been taken by another user. Please refresh and select a different one."
            });
        }

        res.json({
            success: true,
            message: "Paper successfully assigned to you.",
            paper: updatedPaper
        });

    } catch (err) {
        console.error("Error claiming paper:", err);
        res.status(500).json({ message: "Server error while claiming the paper." });
    }
};

const getClaimedPapers = async (req, res) => {
    try {
        const makerId = req.user._id; // Get the maker's ID from the auth middleware

        // Find all documents in the QuestionPaper collection where the 'usedBy' field
        // matches the currently logged-in maker's ID.
        const claimedPapers = await QuestionPaper.find({ usedBy: makerId })
            .populate("uploadedBy", "name") // Optional: gets the name of the admin who uploaded it
            .sort({ updatedAt: -1 });      // Shows the most recently claimed/updated papers first

        res.json(claimedPapers);

    } catch (err) {
        console.error("Error fetching claimed papers:", err);
        res.status(500).json({ message: "Server error while fetching claimed papers." });
    }
};

const getAllCourses = async (req, res) => {
    try {
        // Find all courses with an "Active" status to populate the dropdown.
        // .sort({ title: 1 }) sorts them alphabetically by title.
        // .select('title') ensures you only fetch the title field for efficiency.
        const courses = await Course.find({ status: "Active" })
            .sort({ title: 1 })
            .select("title");

        // Send the list of courses back as a JSON response.
        res.status(200).json(courses);

    } catch (error) {
        // Log the error for debugging purposes.
        console.error("Error fetching courses:", error);

        // Send a generic server error response to the client.
        res.status(500).json({ message: "Server error, could not fetch courses." });
    }
};

const getClaimedPapersByMaker = async (req, res) => {
    try {
        // req.user._id is populated by your authentication middleware
        const makerId = req.user._id;

        if (!makerId) {
            return res.status(401).json({ message: "Not authorized, no user ID found." });
        }

        // Find all question papers where the 'usedBy' field matches the maker's ID
        const claimedPapers = await QuestionPaper.find({ usedBy: makerId });

        if (!claimedPapers) {
            // This case is unlikely with .find(), which returns [] if nothing is found,
            // but it's good practice to handle it.
            return res.status(404).json({ message: "No claimed question papers found for this user." });
        }

        res.status(200).json(claimedPapers);
    } catch (err) {
        console.error("Error fetching claimed question papers:", err);
        res.status(500).json({ message: "Server error while fetching papers", error: err.message });
    }
};

export { createOrUpdateQuestion, getQuestionById, getDraftQuestions, deleteQuestions, submitQuestionsForApproval, getSubmittedQuestions , getAvailablePapers,claimPaper,getClaimedPapers,getAllCourses,getClaimedPapersByMaker};