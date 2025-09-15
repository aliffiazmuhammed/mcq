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
        options: [
            {
                text: { type: String, required: true },
                isCorrect: { type: Boolean, default: false },
            },
        ],
        referenceFile: {
            type: String, // file path or URL
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
