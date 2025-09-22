import mongoose from "mongoose";

const makerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a name"],
        },
        email: {
            type: String,
            required: [true, "Please add an email"],
            unique: true,
            // Simple regex for basic email format validation
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

export default mongoose.model("Maker", makerSchema);