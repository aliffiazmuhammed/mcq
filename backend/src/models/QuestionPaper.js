import mongoose from "mongoose";

/**
 * @desc A reusable sub-schema to store the details of an uploaded file.
 * This keeps the main schema clean and organized.
 */
const fileSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
    },
    { _id: false } // Prevents Mongoose from creating an _id for this sub-document
);


const QuestionPaperSchema = new mongoose.Schema(
    {
        // --- Core File Information ---
        name: {
            type: String,
            required: [true, "A name for the paper is required."],
            trim: true,
        },
        questionPaperFile: {
            type: fileSchema,
            required: true,
        },
        solutionPaperFile: {
            type: fileSchema,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin", // Refers to the user who uploaded the files
            required: true,
        },

        // --- Academic Metadata Fields ---
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course", // This MUST match the model name for your course schema
            required: [true, "A course must be associated with the question paper."],
        },
        subject: {
            type: String,
            required: [true, "Subject is required."],
            trim: true,
        },
        standard: {
            type: String,
            enum: ["4", "5", "6", "7", "8", "9", "10", "11", "12"],
        },
        syllabus: {
            type: String,
            required: [true, "Syllabus is required."],
            enum: ["CBSE", "ICSE", "State Board", "SAT", "Other"],
        },
        examType: {
            type: String,
            required: [true, "Exam type is required."],
            enum: ["Board", "Entrance", "Scholarship", "Other"],
        },
        // --- ADDED: Field for the question paper year ---
        questionPaperYear: {
            type: Number,
            required: [true, "The year of the question paper is required."],
        },
        numberOfQuestions: {
            type: Number,
            default: 0,
        },

        // --- Usage Tracking Field ---
        usedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Maker", // This references your Maker model
            default: null,
        },
    },
    { timestamps: true } // Adds createdAt and updatedAt timestamps automatically
);

export default mongoose.model("QuestionPaper", QuestionPaperSchema);
