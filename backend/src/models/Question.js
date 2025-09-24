import mongoose from "mongoose";
import { QUESTION_STATUS } from "../constants/roles.js";

// Schema for text+image field
const TextImageSchema = new mongoose.Schema(
    {
        text: { type: String },
        image: { type: String }, // URL if uploaded
    },
    { _id: false }
);

const questionSchema = new mongoose.Schema(
    {
        question: TextImageSchema, // ✅ { text, image }

        subject: {
            type: String,
            required: [true, "Subject is required"],
        },
        course: String,
        grade: String,
        chapter: String,

        options: [
            {
                ...TextImageSchema.obj, // ✅ { text, image }
                isCorrect: { type: Boolean, default: false },
            },
        ],

        explanation: TextImageSchema, // ✅ { text, image }
        reference: TextImageSchema,   // ✅ { text, image }

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
        checkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Checker",
        },
    },
    { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
