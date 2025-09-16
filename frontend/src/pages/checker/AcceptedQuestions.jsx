import { useState, useEffect } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";

export default function AcceptedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [makerFilter, setMakerFilter] = useState("All");

  // Fetch reviewed questions
  useEffect(() => {
    const fetchReviewedQuestions = async () => {
      try {
        const res = await axios.get(`${host}/api/checker/questions/reviewed`);
        setQuestions(res.data); // backend sends an array of reviewed questions
      } catch (err) {
        console.error("Error fetching reviewed questions:", err);
      }
    };
    fetchReviewedQuestions();
  }, []);

  // Filtered + searched questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.maker?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.course?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || q.status === statusFilter;

    const matchesCourse = courseFilter === "All" || q.course === courseFilter;

    const matchesMaker = makerFilter === "All" || q.maker?.name === makerFilter;

    return matchesSearch && matchesStatus && matchesCourse && matchesMaker;
  });

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reviewed Questions</h1>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by text, maker, or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 w-full sm:w-1/3"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 w-full sm:w-1/5"
        >
          <option value="All">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="border rounded px-3 py-2 w-full sm:w-1/5"
        >
          <option value="All">All Courses</option>
          {[...new Set(questions.map((q) => q.course))].map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        <select
          value={makerFilter}
          onChange={(e) => setMakerFilter(e.target.value)}
          className="border rounded px-3 py-2 w-full sm:w-1/5"
        >
          <option value="All">All Makers</option>
          {[...new Set(questions.map((q) => q.maker?.name))].map((maker) => (
            <option key={maker} value={maker}>
              {maker}
            </option>
          ))}
        </select>
      </div>

      {filteredQuestions.length === 0 ? (
        <p className="text-gray-500">
          No reviewed questions match your filter.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div
              key={q._id}
              className="bg-white p-4 rounded shadow hover:bg-gray-50 cursor-pointer"
              onClick={() =>
                setExpandedQuestion(expandedQuestion?._id === q._id ? null : q)
              }
            >
              {/* Header: Question + Status */}
              <div className="flex justify-between items-center">
                <p className="font-semibold">{q.text}</p>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    q.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {q.status}
                </span>
              </div>

              {/* Expanded Details */}
              {expandedQuestion?._id === q._id && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <p>
                    <span className="font-semibold">Maker:</span>{" "}
                    {q.maker?.name} ({q.maker?.email})
                  </p>
                  <p>
                    <span className="font-semibold">Subject:</span> {q.subject}
                  </p>
                  <p>
                    <span className="font-semibold">Chapter:</span> {q.chapter}
                  </p>
                  <p>
                    <span className="font-semibold">Grade:</span> {q.grade}
                  </p>
                  <p>
                    <span className="font-semibold">Course:</span> {q.course}
                  </p>
                  <p>
                    <span className="font-semibold">Complexity:</span>{" "}
                    {q.complexity}
                  </p>
                  <p>
                    <span className="font-semibold">Keywords:</span>{" "}
                    {q.keywords?.join(", ")}
                  </p>

                  {/* Options */}
                  <div>
                    <p className="font-semibold">Options:</p>
                    <ul className="list-decimal list-inside">
                      {q.options.map((opt, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          {opt.text}
                          {opt.isCorrect && (
                            <span className="text-green-600 font-bold">
                              (Correct)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Explanation */}
                  <p>
                    <span className="font-semibold">Explanation:</span>{" "}
                    {q.explanation}
                  </p>

                  {/* Checker Comment (only for rejected) */}
                  {q.checkerComment && (
                    <p>
                      <span className="font-semibold">Checker Comment:</span>{" "}
                      {q.checkerComment}
                    </p>
                  )}

                  {/* Created/Updated Dates */}
                  <p className="text-sm text-gray-500">
                    Created: {new Date(q.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Updated: {new Date(q.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
