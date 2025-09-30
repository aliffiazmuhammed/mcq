import mongoose from "mongoose";

// NEW: A more robust sub-schema to log every action instance with a timestamp.
const QuestionLogSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    actionDates: [{
        type: Date,
        default: Date.now
    }]
}, { _id: false });

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

        // --- UPDATED FIELDS: Now logs each action with a timestamp ---

        checkeracceptedquestion: [QuestionLogSchema],
        checkerrejectedquestion: [QuestionLogSchema],
        checkerfalserejections: [QuestionLogSchema],

        // --- END OF UPDATED FIELDS ---
    },
    { timestamps: true }
);

export default mongoose.model("Checker", checkerSchema);