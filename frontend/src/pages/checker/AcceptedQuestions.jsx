import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";
// --- Reusable Helper Components ---

const StatusBadge = ({ status }) => {
  const statusStyles = {
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full ${
        statusStyles[status] || ""
      }`}
    >
      {status}
    </span>
  );
};

const ImageModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-4 relative">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 text-3xl text-white font-bold"
        >
          &times;
        </button>
        <img
          src={src}
          alt="Full size content"
          className="rounded-lg w-full h-auto max-h-[80vh] object-contain"
        />
      </div>
    </div>
  );
};

// --- Main Component ---

export default function AcceptedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State for modals and filters
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMaker, setFilterMaker] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");

  useEffect(() => {
    const fetchReviewed = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/checker/questions/reviewed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions(res.data);
      } catch (err) {
        console.error("Error fetching reviewed questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviewed();
  }, []);

  // Deriving unique values for filter dropdowns from populated data
  const makers = [
    "All",
    ...new Set(questions.map((q) => q.maker?.name).filter(Boolean)),
  ];
  const courses = [
    "All",
    ...new Set(questions.map((q) => q.course?.title).filter(Boolean)),
  ];

  // UPDATED: Apply filters to the questions list using populated data
  const filteredQuestions = questions.filter((q) => {
    const matchesStatus = filterStatus === "All" || q.status === filterStatus;
    const matchesMaker = filterMaker === "All" || q.maker?.name === filterMaker;
    const matchesCourse =
      filterCourse === "All" || q.course?.title === filterCourse;
    return matchesStatus && matchesMaker && matchesCourse;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              Reviewed Questions
            </h1>
            <span className="mt-2 sm:mt-0 text-lg font-medium text-gray-600">
              {filteredQuestions.length} Result(s)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Filter by Maker
              </label>
              <select
                value={filterMaker}
                onChange={(e) => setFilterMaker(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
              >
                {makers.map((name, idx) => (
                  <option key={idx} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Filter by Course
              </label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
              >
                {courses.map((name, idx) => (
                  <option key={idx} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="p-4">Question</th>
                  <th className="p-4">Maker</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Question Paper</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr
                    key={q._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium text-gray-900 max-w-xs">
                      <span className="line-clamp-2 block mb-2">
                        {q.question.text || "No text"}
                      </span>

                      {q.question.image && (
                        <img
                          src={q.question.image}
                          alt="Q"
                          className="h-10 w-16 object-contain rounded border cursor-pointer"
                          onClick={() => setImageModalSrc(q.question.image)}
                        />
                      )}
                    </td>
                    <td className="p-4">{q.maker?.name || "N/A"}</td>
                    <td className="p-4">{q.course?.title || "N/A"}</td>
                    <td className="p-4">{q.questionPaper?.name || "N/A"}</td>
                    <td className="p-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => navigate(`/checker/details/${q._id}`)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredQuestions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center p-10 text-gray-500">
                      No reviewed questions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ImageModal src={imageModalSrc} onClose={() => setImageModalSrc(null)} />
    </div>
  );
}
