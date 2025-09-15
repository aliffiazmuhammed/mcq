const mongoose = require("mongoose");
const { QUESTION_STATUS } = require("../constants/roles");

// Question Schema
const questionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, "Question text is required"],
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
        },
        course: {
            type: String,
        },
        grade: {
            type: String,
        },
        chapter: {
            type: String,
        },
        options: [
            {
                text: { type: String, required: true },
                isCorrect: { type: Boolean, default: false },
                // image will be added later
            },
        ],
        explanation: {
            type: String,
        },
        complexity: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Easy",
        },
        keywords: {
            type: [String], // store as array for easy search
        },
        referenceFile: {
            type: String, // for image/pdf uploads later
        },
        maker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(QUESTION_STATUS),
            default: QUESTION_STATUS.PENDING,
        },
        checkerComments: {
            type: String,
        },
        checkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
