import mongoose from "mongoose";

const QuestionPaperSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
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
            ref: "User", 
        },
    },
    { timestamps: true }
);

export default mongoose.model("QuestionPaper", QuestionPaperSchema);
