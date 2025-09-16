import { useEffect, useState } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";

export default function SubmittedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComments, setSelectedComments] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMaker, setFilterMaker] = useState("All");
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

  const handleViewComments = (question) => setSelectedComments(question);
  const handleCloseComments = () => setSelectedComments(null);

  // Unique values for dropdowns
  const makers = [
    "All",
    ...new Set(questions.map((q) => q.maker?.name).filter(Boolean)),
  ];
  const courses = [
    "All",
    ...new Set(questions.map((q) => q.course).filter(Boolean)),
  ];

  // Apply search + filters
  const filteredQuestions = questions.filter((q) => {
    const textToSearch = (q.text || q.questionText || "").toLowerCase();
    const matchesSearch = textToSearch.includes(search.toLowerCase().trim());

    const matchesStatus = filterStatus === "All" || q.status === filterStatus;

    const matchesMaker = filterMaker === "All" || q.maker?.name === filterMaker;

    const matchesCourse = filterCourse === "All" || q.course === filterCourse;

    return matchesSearch && matchesStatus && matchesMaker && matchesCourse;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Submitted Questions</h1>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search question text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full sm:w-1/3"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          {courses.map((c, idx) => (
            <option key={idx} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <p className="text-gray-500">No questions match your filters.</p>
      ) : (
        <>
          {/* Table for desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border border-gray-300 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left border-b">Question</th>
                  <th className="p-3 text-left border-b">Course</th>
                  <th className="p-3 text-left border-b">Grade</th>
                  <th className="p-3 text-left border-b">Subject</th>
                  <th className="p-3 text-left border-b">Chapter</th>
                  <th className="p-3 text-left border-b">Difficulty</th>
                  <th className="p-3 text-left border-b">Status</th>
                  <th className="p-3 text-left border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{q.questionText || q.text}</td>
                    <td className="p-3 border-b">{q.course}</td>
                    <td className="p-3 border-b">{q.grade}</td>
                    <td className="p-3 border-b">{q.subject}</td>
                    <td className="p-3 border-b">{q.chapter}</td>
                    <td className="p-3 border-b">{q.complexity}</td>
                    <td className="p-3 border-b">
                      {q.status === "Approved" && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                          Approved
                        </span>
                      )}
                      {q.status === "Rejected" && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                          Rejected
                        </span>
                      )}
                      {q.status === "Pending" && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-sm rounded">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3 border-b">
                      {q.status === "Rejected" && (
                        <button
                          onClick={() => handleViewComments(q)}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        >
                          View Comments
                        </button>
                      )}
                      {q.status === "Pending" && (
                        <span className="text-gray-500 text-sm italic">
                          Awaiting review
                        </span>
                      )}
                      {q.status === "Approved" && (
                        <span className="text-green-600 text-sm italic">
                          Finalized
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4 mt-4">
            {filteredQuestions.map((q) => (
              <div
                key={q._id}
                className="border rounded-lg p-4 shadow-sm bg-gray-50"
              >
                <p className="font-semibold mb-1">{q.questionText || q.text}</p>
                <p className="text-sm mb-1">
                  Subject: {q.subject} | Chapter: {q.chapter}
                </p>
                <p className="text-sm mb-1">Difficulty: {q.complexity}</p>
                <p className="text-sm mb-2">
                  Status:{" "}
                  {q.status === "Approved" && (
                    <span className="text-green-700">Approved</span>
                  )}
                  {q.status === "Rejected" && (
                    <span className="text-red-700">Rejected</span>
                  )}
                  {q.status === "Pending" && (
                    <span className="text-yellow-700">Pending</span>
                  )}
                </p>
                {q.status === "Rejected" && (
                  <button
                    onClick={() => handleViewComments(q)}
                    className="bg-gray-500 text-white px-3 py-1 rounded w-full"
                  >
                    View Comments
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal for comments */}
      {selectedComments && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Rejection Comments</h2>
            <p className="text-gray-700 mb-4">{selectedComments.comments}</p>
            <div className="flex justify-end">
              <button
                onClick={handleCloseComments}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
