import mongoose from "mongoose";

// A sub-schema to track a question and a count associated with it.
const QuestionHistorySchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    count: {
        type: Number,
        default: 1
    }
}, { _id: false }); // No separate _id for sub-documents in this array

const checkerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a name"],
        },
        email: {
            type: String,
            required: [true, "Please add an email"],
            unique: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please add a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Please add a password"],
            minlength: 6,
            select: false,
        },

        // --- UPDATED FIELDS: Now an array of objects with questionId and count ---

        checkeracceptedquestion: [QuestionHistorySchema],
        checkerrejectedquestion: [QuestionHistorySchema],
        checkerfalserejections: [QuestionHistorySchema],

        // --- END OF UPDATED FIELDS ---
    },
    { timestamps: true }
);

export default mongoose.model("Checker", checkerSchema);