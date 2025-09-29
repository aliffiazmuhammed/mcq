import mongoose from "mongoose";
import { QUESTION_STATUS } from "../constants/roles.js";

// Schema for a reusable text + image field
const TextImageSchema = new mongoose.Schema(
    {
        text: { type: String },
        image: { type: String }, // URL if uploaded
    },
    { _id: false }
);

const questionSchema = new mongoose.Schema(
    {
        question: TextImageSchema,

        // --- Metadata Fields ---

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "A course must be associated with the question."],
        },
        subject: {
            type: String,
            required: [true, "Subject is required."],
            trim: true,
        },
        questionPaperYear: {
            type: Number,
            required: [true, "The year of the question paper is required."],
        },
        unit: {
            type: String,
            trim: true,
        },
        chapter: String,

        questionPaper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuestionPaper", // This ref must match the QuestionPaper model name
            required: [true, "Question paper is required."],
            default: null,
        },
        questionNumber: {
            type: String,
            required: [true, "Question number is required."],
            trim: true,
            default: null,
        },

        FrequentlyAsked: {
            type: Boolean,
            default: false,
        },
        options: [
            {
                ...TextImageSchema.obj,
                isCorrect: { type: Boolean, default: false },
            },
        ],
        explanation: TextImageSchema,

        reference: {
            image1: { type: String, default: null },
            image2: { type: String, default: null },
        },

        complexity: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Easy",
        },
        keywords: { type: [String] },
        maker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Maker",
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(QUESTION_STATUS),
            default: QUESTION_STATUS.PENDING,
        },
        checkerComments: String,

        // --- NEWLY ADDED FIELD ---
        makerComments: String,
        // -------------------------

        checkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Checker",
        },
    },
    { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;