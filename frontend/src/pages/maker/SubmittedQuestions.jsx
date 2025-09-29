import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { host } from "../../utils/APIRoutes";

// --- Reusable Components ---

const ContentDisplay = ({ content, onImageClick }) => {
  if (!content || (!content.text && !content.image)) {
    return <p className="text-gray-400 italic">N/A</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {content.text && (
        <p className="text-gray-800 break-words line-clamp-3">{content.text}</p>
      )}
      {content.image && (
        <img
          src={content.image}
          alt="Question thumbnail"
          onClick={() => onImageClick(content.image)}
          className="mt-1 rounded-md w-20 h-14 object-cover cursor-pointer hover:opacity-80 transition"
        />
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusStyles = {
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Draft: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`px-3 py-1 text-sm font-medium rounded-full ${
        statusStyles[status] || statusStyles.Draft
      }`}
    >
      {status}
    </span>
  );
};

// --- Main Component ---

export default function SubmittedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComments, setSelectedComments] = useState(null);
  const [imageInView, setImageInView] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/questions/submitted`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map((q) => ({
          ...q,
          status:
            q.status.charAt(0).toUpperCase() + q.status.slice(1).toLowerCase(),
        }));
        setQuestions(formatted);
      } catch (err) {
        console.error("Error fetching submitted questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const courses = [
    "All",
    ...new Set(questions.map((q) => q.course?.title).filter(Boolean)),
  ];

  const filteredQuestions = questions.filter((q) => {
    const textToSearch = (q.question?.text || "").toLowerCase();
    const matchesSearch = textToSearch.includes(search.toLowerCase().trim());
    const matchesStatus = filterStatus === "All" || q.status === filterStatus;
    const matchesCourse =
      filterCourse === "All" || q.course?.title === filterCourse;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          My Submitted Questions
        </h1>

        {/* Filters + Search Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b">
          <input
            type="text"
            placeholder="Search question text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-md w-full sm:w-auto sm:flex-grow"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border px-3 py-2 rounded-md"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="border px-3 py-2 rounded-md"
          >
            {courses.map((c, idx) => (
              <option key={idx} value={c}>
                {c === "All" ? "All Courses" : c}
              </option>
            ))}
          </select>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No questions match your filters. 🧐
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Question
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Course
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    Unit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                  >
                    Question Paper
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((q) => (
                  <tr key={q._id}>
                    <td className="px-6 py-4 whitespace-normal max-w-sm">
                      <ContentDisplay
                        content={q.question}
                        onImageClick={setImageInView}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {q.course?.title || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                      {q.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                      {q.questionPaper?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* --- UPDATED: Actions column --- */}
                      {q.status === "Rejected" && (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() =>
                              setSelectedComments(q.checkerComments)
                            }
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Comments
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/maker/editrejected/${q._id}`)
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for viewing comments */}
      {selectedComments && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setSelectedComments(null)}
              className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Rejection Comments</h2>
            <p className="text-gray-700 bg-red-50 p-4 rounded-md border border-red-200">
              {selectedComments}
            </p>
          </div>
        </div>
      )}

      {/* Modal for viewing images */}
      {imageInView && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4"
          onClick={() => setImageInView(null)}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-4 relative">
            <button
              onClick={() => setImageInView(null)}
              className="absolute -top-4 -right-4 text-3xl text-white font-bold"
            >
              &times;
            </button>
            <img
              src={imageInView}
              alt="Full size question content"
              className="rounded-lg w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
