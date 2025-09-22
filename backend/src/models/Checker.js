// models/Checker.js
import mongoose from "mongoose";

const checkerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
}, { timestamps: true });

export default mongoose.model("Checker", checkerSchema);
