import { useEffect, useState } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";

// --- Helper Components ---

const ImageModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative p-4">
        <img
          src={src}
          alt="Enlarged question content"
          className="max-w-screen-lg max-h-screen-lg object-contain"
        />
        <button
          onClick={onClose}
          className="absolute top-0 right-0 m-4 text-white text-3xl font-bold"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

const QuestionDetailsModal = ({ question, onClose, onAction }) => {
  const [comment, setComment] = useState("");

  if (!question) return null;

  const handleReject = () => {
    if (!comment.trim()) {
      alert("Please provide a comment before rejecting.");
      return;
    }
    onAction("reject", question._id, comment);
  };

  const handleApprove = () => {
    onAction("approve", question._id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Review Question Details
          </h2>
          <button
            onClick={onClose}
            className="text-3xl text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Question Section */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Question:</h3>
            {question.question.image && (
              <img
                src={question.question.image}
                alt="Question"
                className="rounded-lg max-h-72 w-auto mb-2 border"
              />
            )}
            <p>{question.question.text}</p>
          </div>

          {/* Options Section */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Options:</h3>
            <ul className="space-y-2">
              {question.options.map((opt, idx) => (
                <li
                  key={idx}
                  className={`p-3 rounded-md flex items-start gap-3 ${
                    opt.isCorrect
                      ? "bg-green-100 border-green-300 border"
                      : "bg-gray-100"
                  }`}
                >
                  <span className="font-bold">{idx + 1}.</span>
                  <div className="flex-grow">
                    {opt.image && (
                      <img
                        src={opt.image}
                        alt={`Option ${idx + 1}`}
                        className="rounded max-h-32 w-auto mb-1 border"
                      />
                    )}
                    <p>{opt.text}</p>
                  </div>
                  {opt.isCorrect && (
                    <span className="font-bold text-green-700">
                      (Correct Answer)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Explanation Section */}
          {question.explanation?.text && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Explanation:</h3>
              {question.explanation.image && (
                <img
                  src={question.explanation.image}
                  alt="Explanation"
                  className="rounded-lg max-h-72 w-auto mb-2 border"
                />
              )}
              <p className="p-3 bg-blue-50 rounded-md">
                {question.explanation.text}
              </p>
            </div>
          )}

          {/* Rejection Comment Section */}
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Feedback / Rejection Comment:
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide clear feedback if rejecting..."
              className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-4 bg-gray-50">
          <button
            onClick={handleReject}
            className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700 transition"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function CheckerReview() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // State for modals
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [detailsModalQuestion, setDetailsModalQuestion] = useState(null);

  // State for filters
  const [filterMaker, setFilterMaker] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/checker/questions/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions(res.data);
      } catch (err) {
        console.error("Error fetching pending questions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);
  const makers = [
    "All",
    ...new Set(questions.map((q) => q.maker?.name).filter(Boolean)),
  ];
  const courses = [
    "All",
    ...new Set(questions.map((q) => q.course).filter(Boolean)),
  ];

  const filteredQuestions = questions.filter((q) => {
    const matchesMaker = filterMaker === "All" || q.maker?.name === filterMaker;
    const matchesCourse = filterCourse === "All" || q.course === filterCourse;
    return matchesMaker && matchesCourse;
  });

  const handleToggleSelect = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map((q) => q._id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedQuestions.length === 0) return;
    if (
      !window.confirm(
        `Approve ${selectedQuestions.length} selected question(s)?`
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${host}/api/checker/questions/approve-bulk`,
        { ids: selectedQuestions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions((prev) =>
        prev.filter((q) => !selectedQuestions.includes(q._id))
      );
      setSelectedQuestions([]);
      alert(`${selectedQuestions.length} question(s) approved.`);
    } catch (err) {
      console.error("Bulk approve failed:", err);
      alert("An error occurred during bulk approval.");
    }
  };

  const handleSingleAction = async (action, id, comment = "") => {
    try {
      console.log(id)
      const token = localStorage.getItem("token");
      if (action === "approve") {
        await axios.put(
          `${host}/api/checker/questions/${id}/approve`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (action === "reject") {
        await axios.put(
          `${host}/api/checker/questions/${id}/reject`,
          { comments: comment },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Remove the question from the list and close the modal
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      setDetailsModalQuestion(null);
      alert(`Question has been ${action}ed.`);
    } catch (err) {
      console.error(`Failed to ${action} question:`, err);
      alert(`An error occurred while trying to ${action} the question.`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Questions for Review ({filteredQuestions.length})
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t">
            {/* Filter Controls */}
            <select
              value={filterMaker}
              onChange={(e) => setFilterMaker(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500"
            >
              {makers.map((name, idx) => (
                <option key={idx} value={name}>
                  {name === "All" ? "All Makers" : name}
                </option>
              ))}
            </select>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500"
            >
              {courses.map((name, idx) => (
                <option key={idx} value={name}>
                  {name === "All" ? "All Courses" : name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredQuestions.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="selectAll"
                checked={
                  selectedQuestions.length > 0 &&
                  selectedQuestions.length === filteredQuestions.length
                }
                onChange={handleSelectAll}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <label
                htmlFor="selectAll"
                className="ml-3 font-medium text-gray-700"
              >
                {selectedQuestions.length > 0
                  ? `${selectedQuestions.length} selected`
                  : "Select All"}
              </label>
            </div>
            <button
              onClick={handleBulkApprove}
              disabled={selectedQuestions.length === 0}
              className="bg-green-600 text-white px-5 py-2 rounded-md font-semibold disabled:bg-gray-400"
            >
              Approve Selected
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="p-4 w-4"></th>
                  <th className="p-4">Question</th>
                  <th className="p-4">Maker</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Grade</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr
                    key={q._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(q._id)}
                        onChange={() => handleToggleSelect(q._id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                      {q.question.image && (
                        <img
                          src={q.question.image}
                          alt="Q"
                          className="h-10 w-16 object-contain rounded border cursor-pointer"
                          onClick={() => setImageModalSrc(q.question.image)}
                        />
                      )}
                      <span className="line-clamp-2">
                        {q.question.text || "No text"}
                      </span>
                    </td>
                    <td className="p-4">{q.maker?.name || "N/A"}</td>
                    <td className="p-4">{q.course || "N/A"}</td>
                    <td className="p-4">{q.grade || "N/A"}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setDetailsModalQuestion(q)}
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
                      No pending questions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ImageModal src={imageModalSrc} onClose={() => setImageModalSrc(null)} />
      <QuestionDetailsModal
        question={detailsModalQuestion}
        onClose={() => setDetailsModalQuestion(null)}
        onAction={handleSingleAction}
      />
    </div>
  );
}
