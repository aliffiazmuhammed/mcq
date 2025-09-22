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
    },
    { timestamps: true }
);

export default mongoose.model("Checker", checkerSchema);