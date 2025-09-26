import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// The local import for 'host' has been inlined to prevent compilation errors.
import { host } from "../../utils/APIRoutes";



const StatusBadge = ({ status }) => {
  const statusStyles = {
    Active: "bg-green-100 text-green-800",
    Inactive: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-3 py-1 text-xs font-bold rounded-full ${
        statusStyles[status] || ""
      }`}
    >
      {status}
    </span>
  );
};

// --- Main Component ---

export default function ViewCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State for filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSyllabus, setFilterSyllabus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/admin/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        alert("Failed to fetch course data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Deriving unique values for syllabus filter
  const syllabuses = [
    "All",
    ...new Set(courses.map((c) => c.syllabus).filter(Boolean)),
  ];

  // Apply filters to the courses list
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.standard.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || course.status === filterStatus;
    const matchesSyllabus =
      filterSyllabus === "All" || course.syllabus === filterSyllabus;
    return matchesSearch && matchesStatus && matchesSyllabus;
  });

  // Function to format date strings
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Manage Courses</h1>
            <button
              onClick={() => navigate("/admin/create-course")}
              className="mt-4 sm:mt-0 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 font-semibold transition"
            >
              + Add New Course
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t">
            <input
              type="text"
              placeholder="Search by title or standard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:col-span-1 border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterSyllabus}
              onChange={(e) => setFilterSyllabus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
            >
              {syllabuses.map((s, idx) => (
                <option key={idx} value={s}>
                  {s === "All" ? "All Syllabuses" : s}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="p-4">Course Title</th>
                  <th className="p-4">Standard</th>
                  <th className="p-4">Syllabus</th>
                  <th className="p-4">Exam Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4">Created By</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {course.title}
                    </td>
                    <td className="p-4">{course.standard}</td>
                    <td className="p-4">{course.syllabus}</td>
                    <td className="p-4">{course.examType}</td>
                    <td className="p-4">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="p-4">{formatDate(course.startDate)}</td>
                    <td className="p-4">{formatDate(course.endDate)}</td>
                    <td className="p-4">{course.createdBy?.name || "N/A"}</td>
                  </tr>
                ))}
                {filteredCourses.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center p-10 text-gray-500">
                      {courses.length > 0
                        ? "No courses match your filters."
                        : "No courses have been created yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
