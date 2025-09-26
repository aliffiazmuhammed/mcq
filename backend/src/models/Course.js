import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Course title is required."],
            trim: true,
            unique: true // ✅ Ensures every course has a unique title
        },
        description: {
            type: String,
            trim: true
        },
        standard: {
            type: String,
            trim: true,
            required: [true, "Standard (e.g., grade/class) is required."]
        },
        category: {
            type: String,
            trim: true
        },
        syllabus: {
            type: String,
            enum: ["CBSE", "ICSE", "State Board", "SAT", "Other"],
            required: [true, "Syllabus is required."]
        },
        examType: {
            type: String,
            required: [true, "Exam type is required."],
            enum: ["Board", "Entrance", "Scholarship", "Other"],
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true
        },
    },
    { timestamps: true }
);

export default mongoose.model("Course", courseSchema);