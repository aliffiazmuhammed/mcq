import React, { useState } from "react";
import { HiOutlineDocument, HiX } from "react-icons/hi";

export default function PdfUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle file selection, adding new files to the existing list
const handleFileChange = (e) => {
  const newFiles = Array.from(e.target.files);
  const validPdfs = newFiles.filter((file) => file.type === "application/pdf");

  if (validPdfs.length > 0) {
    setSelectedFiles((prevFiles) => {
      // Create a set of existing file names for efficient lookup
      const existingFileNames = new Set(prevFiles.map((file) => file.name));

      // Filter out files that already exist in the list
      const uniqueNewFiles = validPdfs.filter(
        (file) => !existingFileNames.has(file.name)
      );

      // Alert the user if any duplicate files were ignored
      if (uniqueNewFiles.length < validPdfs.length) {
        alert("Some duplicate files were not added.");
      }

      return [...prevFiles, ...uniqueNewFiles];
    });
  } else {
    // Only alert if the user selected invalid files
    if (newFiles.length > 0) {
      alert("Only PDF files are allowed. Invalid files were not added.");
    }
  }
  // Clear the input value to allow the same file(s) to be selected again
  e.target.value = null;
};

  // Remove a specific file from the list
  const removeFile = (fileToRemove) => {
    setSelectedFiles(selectedFiles.filter((file) => file !== fileToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert("Please select files to upload.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      formData.append(`pdfFile${index}`, file);
    });

    try {
      // API call to handle bulk upload
      // const response = await fetch("/api/bulk-upload-pdf", {
      //   method: "POST",
      //   body: formData,
      // });

      // Simulate API call for demonstration
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(
        "PDFs uploaded successfully:",
        selectedFiles.map((file) => file.name)
      );

      alert(`${selectedFiles.length} file(s) uploaded successfully!`);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("File upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md relative">
      <h1 className="text-2xl font-bold mb-6">Upload PDF Documents</h1>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Input */}
        <div>
          <label
            htmlFor="pdf-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select PDF File(s)
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            multiple // This attribute enables bulk selection
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>

        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Selected Files ({selectedFiles.length})
            </h2>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-3 border border-gray-300 rounded-lg bg-gray-50"
              >
                <HiOutlineDocument size={20} className="text-indigo-500" />
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <HiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={selectedFiles.length === 0 || loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
              ${
                selectedFiles.length > 0 && !loading
                  ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  : "bg-indigo-400 cursor-not-allowed"
              }`}
          >
            {loading ? "Uploading..." : "Upload PDF(s)"}
          </button>
        </div>
      </form>
    </div>
  );
}
