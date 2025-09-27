import bcrypt from "bcryptjs";
import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";
import cloudinary from "../config/cloudinary.js";
import QuestionPaper from "../models/QuestionPaper.js";
import Question from "../models/Question.js";
import Course from '../models/Course.js'; 
import mongoose from "mongoose";

// Admin creates a new Maker or Checker
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check role
        if (!["maker", "checker"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'maker' or 'checker'" });
        }

        // Check if email already exists in the chosen role
        const existingUser =
            role === "maker"
                ? await Maker.findOne({ email })
                : await Checker.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser =
            role === "maker"
                ? await Maker.create({ name, email, password: hashedPassword })
                : await Checker.create({ name, email, password: hashedPassword });

        return res.status(201).json({
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role,
            },
        });
    } catch (err) {
        console.error("Admin createUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

//  Get all users
const getAllUsers = async (req, res) => {
    try {
        const makers = await Maker.find().select("-password");
        const checkers = await Checker.find().select("-password");

        return res.json({ makers, checkers });
    } catch (err) {
        console.error("Admin getAllUsers error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

//  Delete user
const deleteUser = async (req, res) => {
    try {
        const { role, id } = req.params;

        if (!["maker", "checker"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'maker' or 'checker'" });
        }

        const Model = role === "maker" ? Maker : Checker;
        const user = await Model.findByIdAndDelete(id);

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully` });
    } catch (err) {
        console.error("Admin deleteUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

const uploadPdfToCloudinary = (fileBuffer, courseTitle, subject, fileType) => {
    return new Promise((resolve, reject) => {
        // Sanitize inputs to create a valid folder path (e.g., "Computer Science" -> "Computer_Science")
        const sanitizedCourse = courseTitle.replace(/\s+/g, '_');
        const sanitizedSubject = subject.replace(/\s+/g, '_');

        // Dynamically create the folder path, e.g., "question_papers/10th_CBSE_Science/question_paper"
        const folderPath = `question_papers/${sanitizedCourse}_${sanitizedSubject}/${fileType}`;

        cloudinary.uploader.upload_stream(
            {
                resource_type: "image", // Correct type for PDFs
                folder: folderPath,   // Use the dynamic folder path
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        ).end(fileBuffer);
    });
};

const uploadPdfs = async (req, res) => {
    try {
        // 1. Destructure all metadata fields, including the new 'questionPaperYear'
        const {
            name,
            course,
            subject,
            standard,
            syllabus,
            examType,
            questionPaperYear, // ADDED
            numberOfQuestions
        } = req.body;

        const questionPaperFile = req.files?.questionPaper?.[0];
        const solutionPaperFile = req.files?.solutionPaper?.[0];

        if (!questionPaperFile) {
            return res.status(400).json({ message: "The Question Paper PDF is required." });
        }

        const courseDoc = await Course.findById(course).select("title");
        if (!courseDoc) {
            return res.status(404).json({ message: "Selected course not found." });
        }
        const courseTitle = courseDoc.title;

        const uploadPromises = [uploadPdfToCloudinary(questionPaperFile.buffer, courseTitle, subject, 'question_paper')];
        if (solutionPaperFile) {
            uploadPromises.push(uploadPdfToCloudinary(solutionPaperFile.buffer, courseTitle, subject, 'solution_paper'));
        }

        const [questionPaperResult, solutionPaperResult] = await Promise.all(uploadPromises);

        // 2. Create the new document data object, including the new field
        const newQuestionPaperData = {
            name,
            course,
            subject,
            standard,
            syllabus,
            examType,
            questionPaperYear, // ADDED
            uploadedBy: req.user._id,
            questionPaperFile: {
                url: questionPaperResult.secure_url,
                publicId: questionPaperResult.public_id,
            },
        };

        if (solutionPaperResult) {
            newQuestionPaperData.solutionPaperFile = {
                url: solutionPaperResult.secure_url,
                publicId: solutionPaperResult.public_id,
            };
        }
        if (numberOfQuestions) {
            newQuestionPaperData.numberOfQuestions = numberOfQuestions;
        }

        const newQuestionPaper = new QuestionPaper(newQuestionPaperData);
        await newQuestionPaper.save();

        res.status(201).json({
            success: true,
            message: "Question paper uploaded successfully!",
            paper: newQuestionPaper,
        });

    } catch (err) {
        console.error("Upload failed:", err);
        // Provide more specific validation error messages if they exist
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: "Server error during file upload." });
    }
};

const getAllPdfs = async (req, res) => {
    try {
        // Fetch all documents from the QuestionPaper collection.
        const allPapers = await QuestionPaper.find({})
            // Populate 'usedBy' to get the maker's name. If null, it remains null.
            .populate('usedBy', 'name')
            // NEW: Also populate the 'course' field to get the course's title.
            .populate('course', 'title')
            // Sort by newest first for a logical default order.
            .sort({ createdAt: -1 });

        // The response will now include both the maker's name and the course title.
        res.json({ success: true, files: allPapers });

    } catch (err) {
        console.error("Error fetching all PDFs:", err);
        res.status(500).json({ success: false, error: "Server error while fetching PDFs." });
    }
};

// Delete a PDF by ID
const deletePdf = async (req, res) => {
    const { id } = req.params;

    // A transaction is crucial here to ensure all or none of the operations complete.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the document within the transaction to ensure it exists.
        const pdf = await QuestionPaper.findById(id).session(session);
        if (!pdf) {
            // If not found, no need to proceed. Abort transaction.
            throw new Error("Question Paper not found.");
        }

        // 2. Prepare to delete files from Cloudinary.
        const cloudinaryPromises = [];

        // Add the mandatory question paper file to the deletion list.
        if (pdf.questionPaperFile?.publicId) {
            cloudinaryPromises.push(
                cloudinary.uploader.destroy(pdf.questionPaperFile.publicId, {
                    resource_type: "image" // Use 'raw' for PDFs
                })
            );
        }

        // If an optional solution paper exists, add it to the deletion list.
        if (pdf.solutionPaperFile?.publicId) {
            cloudinaryPromises.push(
                cloudinary.uploader.destroy(pdf.solutionPaperFile.publicId, {
                    resource_type: "image" // Use 'raw' for PDFs
                })
            );
        }

        // Execute all Cloudinary deletions in parallel.
        await Promise.all(cloudinaryPromises);

        // 3. IMPORTANT: Delete all questions that are linked to this question paper.
        // This prevents orphaned questions in your database.
        await Question.deleteMany({ questionPaper: id }).session(session);

        // 4. Finally, delete the QuestionPaper document from the database.
        await QuestionPaper.findByIdAndDelete(id).session(session);

        // 5. If all steps were successful, commit the transaction.
        await session.commitTransaction();

        res.json({ success: true, message: "Question Paper and all associated questions deleted successfully." });

    } catch (err) {
        // If any step fails, abort the transaction to undo all changes.
        await session.abortTransaction();

        console.error("Error deleting PDF:", err);

        if (err.message.includes("not found")) {
            return res.status(404).json({ success: false, error: err.message });
        }

        res.status(500).json({ success: false, error: "Server error during deletion. Operation was rolled back." });
    } finally {
        // Always end the session.
        session.endSession();
    }
};


const getDashboardStats = async (req, res) => {
    try {
        // 1. Get Summary Card Counts in parallel for speed
        const [totalQuestions, totalApproved, totalRejected, totalPending] = await Promise.all([
            Question.countDocuments(),
            Question.countDocuments({ status: 'Approved' }),
            Question.countDocuments({ status: 'Rejected' }),
            Question.countDocuments({ status: 'Pending' })
        ]);

        // 2. Get Status Distribution using an aggregation pipeline
        const statusDistribution = await Question.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { status: '$_id', count: 1, _id: 0 } }
        ]);

        // 3. Get Maker Performance (questions created and submitted)
        const makerPerformance = await Question.aggregate([
            { $match: { status: { $ne: 'Draft' } } }, // Only count questions that have been submitted
            {
                $group: {
                    _id: '$maker',
                    // Use $cond to conditionally sum counts for each status
                    approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                    totalSubmitted: { $sum: 1 } // Total count of non-draft questions
                }
            },
            { $sort: { totalSubmitted: -1 } }, // Sort by the total number of submitted questions
            { $limit: 10 },
            { $lookup: { from: 'makers', localField: '_id', foreignField: '_id', as: 'makerDetails' } },
            { $unwind: '$makerDetails' },
            {
                // Project the new fields to be sent to the frontend
                $project: {
                    makerName: '$makerDetails.name',
                    approved: 1,
                    rejected: 1,
                    pending: 1,
                    totalSubmitted: 1,
                    _id: 0
                }
            }
        ]);

        // 4. Get Checker Performance (questions reviewed)
        const checkerPerformance = await Question.aggregate([
            { $match: { status: { $in: ['Approved', 'Rejected'] } } }, // Only count reviewed questions
            {
                $group: {
                    _id: '$checkedBy',
                    approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
                    totalReviewed: { $sum: 1 }
                }
            },
            { $sort: { totalReviewed: -1 } },
            { $limit: 10 }, // Get top 10 checkers
            { $lookup: { from: 'checkers', localField: '_id', foreignField: '_id', as: 'checkerDetails' } },
            { $unwind: '$checkerDetails' },
            { $project: { checkerName: '$checkerDetails.name', approved: 1, rejected: 1, totalReviewed: 1, _id: 0 } }
        ]);

        // 5. Send all stats in a single response
        res.json({
            summary: {
                totalQuestions,
                totalApproved,
                totalRejected,
                totalPending
            },
            statusDistribution,
            makerPerformance,
            checkerPerformance
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Server error while fetching dashboard statistics." });
    }
};

const createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            standard,
            category,
            syllabus,
            examType,
            startDate,
            endDate,
            status
        } = req.body;

        // Basic validation
        if (!title || !standard || !syllabus || !examType) {
            return res.status(400).json({ message: "Please fill in all required fields." });
        }

        // ✅ Check if a course with the same title already exists (case-insensitive)
        const existingCourse = await Course.findOne({ title: { $regex: `^${title}$`, $options: 'i' } });
        if (existingCourse) {
            return res.status(409).json({ // 409 Conflict is the appropriate status for duplicates
                message: "A course with this title already exists. Please choose a different title."
            });
        }

        const newCourse = new Course({
            title,
            description,
            standard,
            category,
            syllabus,
            examType,
            startDate,
            endDate,
            status,
            createdBy: req.user._id
        });

        await newCourse.save();

        res.status(201).json({
            success: true,
            message: "Course created successfully!",
            course: newCourse,
        });

    } catch (err) {
        // ✅ Robustly handle the unique constraint error in case of a race condition
        if (err.code === 11000 && err.keyPattern && err.keyPattern.title) {
            return res.status(409).json({ message: "A course with this title already exists." });
        }
        console.error("Error creating course:", err);
        res.status(500).json({ message: "Server error while creating the course." });
    }
};

const getAllCourses = async (req, res) => {
    try {
        // Fetch all course documents
        const courses = await Course.find({})
            .populate("createdBy", "name") // Populates the admin's name who created the course
            .sort({ createdAt: -1 });      // Sort by the most recently created

        res.json(courses);

    } catch (err) {
        console.error("Error fetching courses:", err);
        res.status(500).json({ message: "Server error while fetching courses." });
    }
};

export { createUser, getAllUsers, deleteUser, uploadPdfs ,getAllPdfs,deletePdf,getDashboardStats,createCourse,getAllCourses };
