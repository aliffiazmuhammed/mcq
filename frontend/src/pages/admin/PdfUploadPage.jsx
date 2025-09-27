import React, { useState, useEffect } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";

// --- Reusable Helper Components ---

const NotificationModal = ({ isOpen, onClose, message, isError }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
        <p className={`mb-4 ${isError ? "text-red-600" : "text-gray-800"}`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={`px-6 py-2 rounded-md font-semibold text-white ${
            isError
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

const FileInput = ({ label, name, selectedFile, onFileChange, onRemove }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {!selectedFile ? (
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => onFileChange(name, e.target.files[0])}
        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
      />
    ) : (
      <div className="mt-2 flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          {/* SVG for Document Icon */}
          <svg
            className="w-5 h-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-800 truncate">
            {selectedFile.name}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(name)}
          className="text-gray-400 hover:text-red-600"
        >
          {/* SVG for 'X' Icon */}
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    )}
  </div>
);

// --- Main Component ---

export default function PdfUploadPage() {
  const initialState = {
    name: "",
    course: "",
    examType: "Board",
    subject: "",
    syllabus: "CBSE",
    standard: "10",
    questionPaperYear: new Date().getFullYear(), // ADDED
    numberOfQuestions: "",
    questionPaperFile: null,
    solutionPaperFile: null,
  };

  const [formData, setFormData] = useState(initialState);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
    isError: false,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/admin/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setNotification({
          isOpen: true,
          message: "Could not load courses from the server.",
          isError: true,
        });
      }
    };
    fetchCourses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, file) => {
    if (file && file.type === "application/pdf") {
      setFormData((prev) => ({ ...prev, [name]: file }));
    } else if (file) {
      setNotification({
        isOpen: true,
        message: "Invalid file type. Only PDF files are allowed.",
        isError: true,
      });
    }
  };

  const removeFile = (name) => {
    setFormData((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // UPDATED: Validation including questionPaperYear
    if (
      !formData.name ||
      !formData.subject ||
      !formData.course ||
      !formData.questionPaperYear
    ) {
      setNotification({
        isOpen: true,
        message:
          "Please fill in all required fields: Paper Name, Course, Subject, and Year.",
        isError: true,
      });
      return;
    }
    if (!formData.questionPaperFile) {
      setNotification({
        isOpen: true,
        message: "Please upload the Question Paper PDF.",
        isError: true,
      });
      return;
    }

    setLoading(true);

    const formPayload = new FormData();
    for (const key in formData) {
      if (
        key !== "questionPaperFile" &&
        key !== "solutionPaperFile" &&
        formData[key]
      ) {
        formPayload.append(key, formData[key]);
      }
    }
    formPayload.append("questionPaper", formData.questionPaperFile);
    if (formData.solutionPaperFile) {
      formPayload.append("solutionPaper", formData.solutionPaperFile);
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${host}/api/admin/pdfs`, formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setNotification({
        isOpen: true,
        message: "Question Paper uploaded successfully!",
        isError: false,
      });
      setFormData(initialState);
    } catch (err) {
      console.error("Upload failed:", err);
      const errorMessage =
        err.response?.data?.message || "An unknown error occurred.";
      setNotification({
        isOpen: true,
        message: `Upload failed: ${errorMessage}`,
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg relative">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Upload New Question Paper
        </h1>
        <p className="text-gray-500 mb-8 border-b pb-4">
          Provide the paper details and upload the question and solution PDFs.
        </p>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-50 rounded-xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Paper Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Course
              </label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="">Select a Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {/* ADDED: Question Paper Year Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Question Paper Year
              </label>
              <input
                type="number"
                name="questionPaperYear"
                value={formData.questionPaperYear}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2023"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Number of Questions
              </label>
              <input
                type="number"
                name="numberOfQuestions"
                value={formData.numberOfQuestions}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Standard / Grade
              </label>
              <select
                name="standard"
                value={formData.standard}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {["4", "5", "6", "7", "8", "9", "10", "11", "12"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Syllabus
              </label>
              <select
                name="syllabus"
                value={formData.syllabus}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {["CBSE", "ICSE", "State Board", "SAT", "Other"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Exam Type
              </label>
              <select
                name="examType"
                value={formData.examType}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {["Board", "Entrance", "Scholarship", "Other"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
            <FileInput
              label="Question Paper PDF"
              name="questionPaperFile"
              selectedFile={formData.questionPaperFile}
              onFileChange={handleFileChange}
              onRemove={removeFile}
            />
            <FileInput
              label="Solution Paper PDF (Optional)"
              name="solutionPaperFile"
              selectedFile={formData.solutionPaperFile}
              onFileChange={handleFileChange}
              onRemove={removeFile}
            />
          </div>

          <div className="pt-6 border-t text-right">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {loading ? "Uploading..." : "Upload Paper"}
            </button>
          </div>
        </form>
      </div>
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() =>
          setNotification({ isOpen: false, message: "", isError: false })
        }
        message={notification.message}
        isError={notification.isError}
      />
    </div>
  );
}
