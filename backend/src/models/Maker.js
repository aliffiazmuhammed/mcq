// models/Maker.js
import mongoose from "mongoose";

const makerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
}, { timestamps: true });

export default mongoose.model("Maker", makerSchema);
