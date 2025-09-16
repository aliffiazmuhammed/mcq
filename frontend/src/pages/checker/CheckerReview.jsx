import { useEffect, useState } from "react";
import axios from "axios";
import { host } from "../../utils/APIRoutes";

export default function CheckerReview() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [comments, setComments] = useState({}); // store comments per question

  // Fetch pending questions from backend
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
      }
    };
    fetchPending();
  }, []);

  // Toggle selection for bulk approve
  const toggleSelect = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedQuestions.map((id) =>
          axios.put(
            `${host}/api/checker/questions/${id}/approve`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      setQuestions((prev) =>
        prev.map((q) =>
          selectedQuestions.includes(q._id) ? { ...q, status: "Approved" } : q
        )
      );
      setSelectedQuestions([]);
    } catch (err) {
      console.error("Bulk approve failed", err);
    }
  };

  // Approve single
  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${host}/api/checker/questions/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions((prev) =>
        prev.map((q) => (q._id === id ? { ...q, status: "Approved" } : q))
      );
    } catch (err) {
      console.error("Approve failed", err);
    }
  };

  // Reject single
  const handleReject = async (id) => {
    if (!comments[id]) return alert("Enter rejection comment!");
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${host}/api/checker/questions/${id}/reject`,
        { comments: comments[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === id
            ? { ...q, status: "Rejected", comments: comments[id] }
            : q
        )
      );
      setComments((prev) => ({ ...prev, [id]: "" })); // clear comment only for that question
    } catch (err) {
      console.error("Reject failed", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Review Questions</h1>

      {/* Bulk Approve */}
      {selectedQuestions.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleBulkApprove}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Approve Selected ({selectedQuestions.length})
          </button>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q._id}
            className="bg-white p-4 rounded shadow hover:bg-gray-50 cursor-pointer"
            onClick={() =>
              setExpandedQuestion(expandedQuestion?._id === q._id ? null : q)
            }
          >
            {/* Header: Question + Status + Checkbox */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(q._id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelect(q._id);
                  }}
                  className="w-4 h-4"
                />
                <p className="font-semibold">{q.text}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  q.status === "Pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : q.status === "Approved"
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
                  {q.maker?.name || "Unknown"}
                </p>
                <p>
                  <span className="font-semibold">Subject:</span> {q.subject}
                </p>
                <p>
                  <span className="font-semibold">Chapter:</span> {q.chapter}
                </p>
                <p>
                  <span className="font-semibold">Question:</span> {q.text}
                </p>

                {/* Options */}
                <div>
                  <p className="font-semibold">Options:</p>
                  <ul className="list-decimal list-inside">
                    {q.options.map((opt, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {opt.text}{" "}
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

                {/* Rejection Comment (displayed if rejected) */}
                {q.status === "Rejected" && (
                  <p className="text-red-600">
                    <span className="font-semibold">Rejection Comment:</span>{" "}
                    {q.comments}
                  </p>
                )}

                {/* Approve / Reject Actions */}
                {q.status === "Pending" && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(q._id);
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>

                    <input
                      type="text"
                      placeholder="Rejection comment"
                      value={comments[q._id] || ""}
                      onChange={(e) => {
                        e.stopPropagation();
                        setComments((prev) => ({
                          ...prev,
                          [q._id]: e.target.value,
                        }));
                      }}
                      className="border px-2 py-1 rounded flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(q._id);
                      }}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
