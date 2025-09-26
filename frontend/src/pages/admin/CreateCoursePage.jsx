import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// The local import for 'host' has been inlined to prevent compilation errors.
import { host } from "../../utils/APIRoutes";

// --- Main Component ---
export default function CreateCoursePage() {
  const initialState = {
    title: "",
    description: "",
    standard: "5",
    category: "",
    syllabus: "CBSE",
    examType: "Board",
    startDate: "",
    endDate: "",
    status: "Active",
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  console.log(formData)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.standard) {
      return alert("Please provide a Title and Standard for the course.");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${host}/api/admin/courses`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Course created successfully!");
      window.location.reload();
      navigate("/admin/create-courses"); // Navigate to a course list page (you'll create this next)
    } catch (err) {
      console.error("Failed to create course:", err);
      const errorMessage =
        err.response?.data?.message || "An unknown error occurred.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg relative">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Create New Course
        </h1>
        <p className="text-gray-500 mb-8 border-b pb-4">
          Fill in the details below to add a new course to the system.
        </p>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-50 rounded-xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Course Title*
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            {/* Standard & Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Standard / Grade*
              </label>
              <select
                name="standard"
                value={formData.standard}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {[5 , 6 ,7, 8 ,9,10,11,12,"Higher Studies"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Science, Commerce"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Syllabus & Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Syllabus*
              </label>
              <select
                name="syllabus"
                value={formData.syllabus}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                Exam Type*
              </label>
              <select
                name="examType"
                value={formData.examType}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {["Board", "Entrance", "Scholarship", "Other"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates & Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
          </div>

          {/* --- Submit Button --- */}
          <div className="pt-6 border-t text-right">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {loading ? "Saving..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
