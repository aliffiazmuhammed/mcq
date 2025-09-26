import mongoose from "mongoose";

const QuestionPaperSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, // Ensures that every document has a unique name.
        },
        url: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
        usedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Maker",
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("QuestionPaper", QuestionPaperSchema)