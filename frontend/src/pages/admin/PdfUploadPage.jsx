import React, { useState } from "react";
import { HiOutlineDocument } from "react-icons/hi";

export default function PdfUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      alert("Please select a valid PDF file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("pdfFile", selectedFile);

    try {
      // Replace with your actual API endpoint for PDF upload
      // const response = await fetch("/api/upload-pdf", {
      //   method: "POST",
      //   body: formData,
      // });

      // const result = await response.json();
      // console.log("Upload success:", result);

      // Simulate API call for demonstration
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("PDF uploaded successfully:", selectedFile.name);

      alert("PDF uploaded successfully!");
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("PDF upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md relative">
      <h1 className="text-2xl font-bold mb-6">Upload PDF Document</h1>

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
            Select PDF File
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
        </div>

        {/* Selected File Display */}
        {selectedFile && (
          <div className="flex items-center space-x-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <HiOutlineDocument size={24} className="text-indigo-500" />
            <span className="flex-1 text-sm font-medium text-gray-700 truncate">
              {selectedFile.name}
            </span>
            <span className="text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </span>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={!selectedFile || loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
              ${
                selectedFile && !loading
                  ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  : "bg-indigo-400 cursor-not-allowed"
              }`}
          >
            Upload PDF
          </button>
        </div>
      </form>
    </div>
  );
}
