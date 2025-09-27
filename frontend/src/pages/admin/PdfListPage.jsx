import React, { useEffect, useState } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";


// --- Reusable Modal Components ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{message}</h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

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

// --- Helper Components (Inline SVGs) ---

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const StatusBadge = ({ isClaimed }) => {
  const bgColor = isClaimed ? "bg-yellow-100" : "bg-green-100";
  const textColor = isClaimed ? "text-yellow-800" : "text-green-800";
  return (
    <span
      className={`px-3 py-1 text-xs font-bold rounded-full ${bgColor} ${textColor}`}
    >
      {isClaimed ? "Claimed" : "Available"}
    </span>
  );
};

// --- Main Component ---

export default function PdfListPage() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State for modals and filters
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
    isError: false,
  });
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterYear, setFilterYear] = useState("All"); // ADDED: State for year filter

  const fetchPdfs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${host}/api/admin/pdfs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setPdfs(res.data.files);
      }
    } catch (err) {
      console.error("Error fetching PDFs:", err);
      setNotification({
        isOpen: true,
        message: "Failed to fetch PDFs from the server.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const proceedWithDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${host}/api/admin/pdfs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setNotification({
          isOpen: true,
          message: "PDF deleted successfully",
          isError: false,
        });
        fetchPdfs(); // Re-fetch
      } else {
        setNotification({
          isOpen: true,
          message: `Delete failed: ${res.data.error}`,
          isError: true,
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        isOpen: true,
        message: "An error occurred while deleting the PDF.",
        isError: true,
      });
    }
    setConfirmation({ isOpen: false });
  };

  const handleDelete = (id) => {
    setConfirmation({
      isOpen: true,
      message:
        "Are you sure you want to delete this PDF? This action cannot be undone.",
      onConfirm: () => proceedWithDelete(id),
    });
  };

  // Deriving unique values for filter dropdowns
  const courses = [
    "All",
    ...new Set(pdfs.map((pdf) => pdf.course?.title).filter(Boolean)),
  ];
  const subjects = [
    "All",
    ...new Set(pdfs.map((pdf) => pdf.subject).filter(Boolean)),
  ];
  const years = [
    "All",
    ...new Set(pdfs.map((pdf) => pdf.questionPaperYear).filter(Boolean)),
  ].sort(); // ADDED: Get unique years

  const filteredPdfs = pdfs.filter((pdf) => {
    const matchesSearch = pdf.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCourse =
      filterCourse === "All" || pdf.course?.title === filterCourse;
    const matchesSubject =
      filterSubject === "All" || pdf.subject === filterSubject;
    const matchesYear =
      filterYear === "All" || pdf.questionPaperYear == filterYear; // ADDED: Year filter logic
    return matchesSearch && matchesCourse && matchesSubject && matchesYear;
  });

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Uploaded Question Papers
          </h1>
          <p className="text-gray-500 mt-2">
            View and manage all uploaded papers and their current status.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <input
              type="text"
              placeholder="Search by paper name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {courses.map((name, idx) => (
                <option key={idx} value={name}>
                  {name === "All" ? "All Courses" : name}
                </option>
              ))}
            </select>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {subjects.map((name, idx) => (
                <option key={idx} value={name}>
                  {name === "All" ? "All Subjects" : name}
                </option>
              ))}
            </select>
            {/* ADDED: Year Filter Dropdown */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {years.map((year, idx) => (
                <option key={idx} value={year}>
                  {year === "All" ? "All Years" : year}
                </option>
              ))}
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
                  <th className="p-4">Paper Name</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Year</th>
                  <th className="p-4 text-center">Question Paper</th>
                  <th className="p-4 text-center">Solution Paper</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Claimed By</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPdfs.map((pdf) => (
                  <tr
                    key={pdf._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {pdf.name}
                    </td>
                    <td className="p-4">{pdf.course?.title || "N/A"}</td>
                    <td className="p-4">{pdf.subject || "N/A"}</td>
                    <td className="p-4 text-center">
                      {pdf.questionPaperYear || "N/A"}
                    </td>
                    <td className="p-4 text-center">
                      <a
                        href={pdf.questionPaperFile?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-xs font-semibold"
                      >
                        <EyeIcon /> View
                      </a>
                    </td>
                    <td className="p-4 text-center">
                      {pdf.solutionPaperFile?.url ? (
                        <a
                          href={pdf.solutionPaperFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-semibold"
                        >
                          <EyeIcon /> View
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge isClaimed={!!pdf.usedBy} />
                    </td>
                    <td className="p-4 font-medium">
                      {pdf.usedBy?.name || "N/A"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(pdf._id)}
                        title="Delete Paper"
                        className="flex items-center justify-center mx-auto p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPdfs.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center p-10 text-gray-500">
                      No PDFs found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        message={confirmation.message}
      />
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        message={notification.message}
        isError={notification.isError}
      />
    </div>
  );
}
