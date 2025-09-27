import mongoose from "mongoose";

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
            // A simple regex for basic email validation
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please add a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Please add a password"],
            minlength: 6, // Enforces a minimum password length
            select: false, // Prevents password from being returned in queries
        },
        // --- ADDED FIELDS ---
        rejectedquestioncount: {
            type: Number,
            default: 0, // Default to 0 for new checkers
        },
        acceptedquestioncount: {
            type: Number,
            default: 0, // Default to 0 for new checkers
        },
        // --- END OF ADDED FIELDS ---
    },
    { timestamps: true }
);

export default mongoose.model("Checker", checkerSchema);
