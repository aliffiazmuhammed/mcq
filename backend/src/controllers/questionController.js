import Question from "../models/Question.js";
import { QUESTION_STATUS } from "../constants/roles.js";
import cloudinary from "../config/cloudinary.js"; 

const createOrUpdateQuestion = async (req, res) => {
    try {
        const {
            _id, course, grade, subject, chapter, questionText,
            correctAnswer, explanation, complexity, keywords, status,
            // When editing, we receive existing image URLs
            existingQuestionImage, existingExplanationImage, existingReferenceImage, existingChoiceImages
        } = req.body;

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

        // --- CORRECTED MAIN IMAGE LOGIC ---
        // 1. If a new file exists, upload it.
        // 2. If not, use the existing image URL sent from the frontend.
        // 3. If neither exist, it will be null.
        const questionImage = req.files?.questionImage
            ? await uploadToCloudinary(req.files.questionImage[0])
            : (existingQuestionImage || null);

        const explanationImage = req.files?.explanationImage
            ? await uploadToCloudinary(req.files.explanationImage[0])
            : (existingExplanationImage || null);

        const referenceImage = req.files?.referenceImage
            ? await uploadToCloudinary(req.files.referenceImage[0])
            : (existingReferenceImage || null);

        // --- CHOICES LOGIC (Already Correct) ---
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

        // --- END OF CHOICES LOGIC ---

        const questionData = {
            course, grade, subject, chapter,
            question: { text: questionText || "", image: questionImage },
            options: mappedChoices,
            explanation: { text: explanation || "", image: explanationImage },
            reference: { text: "", image: referenceImage },
            complexity,
            keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
            status: status || 'Draft',
            maker: req.user._id,
        };

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
        res.status(500).json({ message: "Server error" });
    }
};


const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params; // Get the question ID from the URL
        const userId = req.user._id; // Get the logged-in user's ID
        const userRole = req.user.role; // Get the logged-in user's role

        // 1. Find the question by its ID
        const question = await Question.findById(id);
        console.log(question)

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        // 2. Check for authorization
        const isOwner = question.maker.toString() === userId.toString();

        // You can add other roles that are allowed to view any question here
        const isAuthorizedRole = userRole === 'checker' || userRole === 'admin';

        // 3. Deny access if the user is NOT the owner AND does NOT have an authorized role
        if (!isOwner && !isAuthorizedRole) {
            return res.status(403).json({ message: "Access denied. You are not authorized to view this question." });
        }

        // 4. If authorized, send the question data
        return res.json(question);

    } catch (err) {
        console.error("Error fetching question by ID:", err);
        return res.status(500).json({ message: "Server error" });
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
export { createOrUpdateQuestion, getQuestionById, getDraftQuestions, deleteQuestions, submitQuestionsForApproval, getSubmittedQuestions };