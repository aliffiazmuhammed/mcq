import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Async function to upload buffer to Cloudinary
const uploadToCloudinary = async (fileBuffer, folder = "questions") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
        });
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

export default uploadToCloudinary;