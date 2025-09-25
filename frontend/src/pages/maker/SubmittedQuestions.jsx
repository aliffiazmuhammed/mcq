import { useEffect, useState } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";

// A reusable component to display content that can be text, an image, or both.
const ContentDisplay = ({ content }) => {
  if (!content) return <p className="text-gray-400 italic">N/A</p>;
  return (
    <>
      {/* Added break-words to prevent long text from overflowing */}
      {content.text && (
        <p className="text-gray-800 break-words">{content.text}</p>
      )}
      {content.image && (
        <img
          src={content.image}
          alt="Question content"
          // --- MODIFIED LINE ---
          // Reduced max-h-72 to max-h-56 to make the image smaller.
          className="mt-2 rounded-lg w-full h-auto max-h-56 object-contain"
        />
      )}
    </>
  );
};

// A reusable component for status badges.
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

export default function SubmittedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComments, setSelectedComments] = useState(null);

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
        // Format status to be consistently capitalized
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

  const handleViewComments = (question) =>
    setSelectedComments(question.checkerComments);
  const handleCloseComments = () => setSelectedComments(null);

  // Get unique course names for the filter dropdown
  const courses = [
    "All",
    ...new Set(questions.map((q) => q.course).filter(Boolean)),
  ];

  // Apply search and filters
  const filteredQuestions = questions.filter((q) => {
    const textToSearch = (q.question?.text || "").toLowerCase();
    const matchesSearch = textToSearch.includes(search.toLowerCase().trim());
    const matchesStatus = filterStatus === "All" || q.status === filterStatus;
    const matchesCourse = filterCourse === "All" || q.course === filterCourse;
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
          <div className="space-y-6">
            {/* Display each question as a detailed card */}
            {filteredQuestions.map((q) => (
              <div
                key={q._id}
                className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white hover:shadow-lg transition-shadow duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left Side: Question Content */}
                  <div className="md:col-span-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Question:
                    </h2>
                    <ContentDisplay content={q.question} />
                  </div>

                  {/* Right Side: Details and Status */}
                  <div className="md:col-span-4 md:border-l md:pl-4">
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold">Status: </span>
                        <StatusBadge status={q.status} />
                      </div>
                      <div>
                        <span className="font-semibold">Course: </span>
                        {q.course}
                      </div>
                      <div>
                        <span className="font-semibold">Grade: </span>
                        {q.grade}
                      </div>
                      <div>
                        <span className="font-semibold">Subject: </span>
                        {q.subject}
                      </div>
                      <div>
                        <span className="font-semibold">Difficulty: </span>
                        {q.complexity}
                      </div>

                      {/* Action for Rejected Questions */}
                      {q.status === "Rejected" && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleViewComments(q)}
                            className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                          >
                            View Rejection Comments
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing comments */}
      {selectedComments && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={handleCloseComments}
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
    </div>
  );
}
