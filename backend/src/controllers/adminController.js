import bcrypt from "bcryptjs";
import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";
import cloudinary from "../config/cloudinary.js";
import QuestionPaper from "../models/QuestionPaper.js";


// Admin creates a new Maker or Checker
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check role
        if (!["maker", "checker"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'maker' or 'checker'" });
        }

        // Check if email already exists in the chosen role
        const existingUser =
            role === "maker"
                ? await Maker.findOne({ email })
                : await Checker.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser =
            role === "maker"
                ? await Maker.create({ name, email, password: hashedPassword })
                : await Checker.create({ name, email, password: hashedPassword });

        return res.status(201).json({
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role,
            },
        });
    } catch (err) {
        console.error("Admin createUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Optional: Get all users
const getAllUsers = async (req, res) => {
    try {
        const makers = await Maker.find().select("-password");
        const checkers = await Checker.find().select("-password");

        return res.json({ makers, checkers });
    } catch (err) {
        console.error("Admin getAllUsers error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Optional: Delete user
const deleteUser = async (req, res) => {
    try {
        const { role, id } = req.params;

        if (!["maker", "checker"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'maker' or 'checker'" });
        }

        const Model = role === "maker" ? Maker : Checker;
        const user = await Model.findByIdAndDelete(id);

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully` });
    } catch (err) {
        console.error("Admin deleteUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

const uploadPdfs = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: "No files uploaded" });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            // Upload PDF buffer directly to Cloudinary
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: "image", folder: "pdf_uploads" }, // ✅ use "raw" for PDFs
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(file.buffer);
            });

            // Save into MongoDB
            const savedDoc = await QuestionPaper.create({
                name: file.originalname,
                url: result.secure_url,
                publicId: result.public_id,
                uploadedBy: req.user ? req.user._id : null, // optional if you track who uploaded
            });

            uploadedFiles.push(savedDoc);
        }

        res.json({ success: true, files: uploadedFiles });
    } catch (err) {
        console.error("Upload failed:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all uploaded PDFs
const getAllPdfs = async (req, res) => {
    try {
        const pdfs = await QuestionPaper.find().sort({ createdAt: -1 });
        res.json({ success: true, files: pdfs });
    } catch (err) {
        console.error("Error fetching PDFs:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete a PDF by ID
const deletePdf = async (req, res) => {
    const { id } = req.params;

    try {
        const pdf = await QuestionPaper.findById(id);
        if (!pdf) return res.status(404).json({ success: false, error: "PDF not found" });

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(pdf.publicId, { resource_type: "raw" });

        // Delete from DB using deleteOne
        await QuestionPaper.deleteOne({ _id: id });

        res.json({ success: true, message: "PDF deleted successfully" });
    } catch (err) {
        console.error("Error deleting PDF:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export { createUser, getAllUsers, deleteUser ,uploadPdfs ,getAllPdfs,deletePdf };
