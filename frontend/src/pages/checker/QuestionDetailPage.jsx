import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
 import { host } from "../../utils/APIRoutes";

// --- Helper Components ---

const Section = ({ title, children, className = "" }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
    <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">
      {title}
    </h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm font-semibold text-gray-500">{label}</p>
    <p className="text-md text-gray-800">{value || "N/A"}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusStyles = {
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Draft: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`px-4 py-1.5 text-sm font-bold rounded-full ${
        statusStyles[status] || ""
      }`}
    >
      {status}
    </span>
  );
};

// --- Main Component ---

export default function QuestionDetailPage() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState(""); // State for the rejection comment
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        // This endpoint needs to be authorized for checkers
        const res = await axios.get(`${host}/api/checker/questions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestion(res.data);
      } catch (err) {
        console.error("Error fetching question details:", err);
        setError(
          "Failed to load question. It may not exist or you may not have permission to view it."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id]);

  // --- Action Handlers ---

  const handleApprove = useCallback(async () => {
    if (!window.confirm("Are you sure you want to approve this question?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${host}/api/checker/questions/${id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Question approved successfully!");
      navigate(-1); // Go back to the previous page
    } catch (err) {
      console.error("Error approving question:", err);
      alert("Failed to approve the question.");
    }
  }, [id, navigate]);

  const handleReject = useCallback(async () => {
    if (!comment.trim()) {
      alert("Please provide a comment before rejecting.");
      return;
    }
    if (!window.confirm("Are you sure you want to reject this question?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${host}/api/checker/questions/${id}/reject`,
        { comments: comment },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Question rejected successfully!");
      navigate(-1); // Go back to the previous page
    } catch (err) {
      console.error("Error rejecting question:", err);
      alert("Failed to reject the question.");
    }
  }, [id, comment, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-20 text-gray-500">
        No question data found.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-white px-4 py-2 rounded-md shadow-sm text-gray-700 hover:bg-gray-100 font-semibold"
          >
            &larr; Back to List
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Section */}
          <Section title="Question Overview">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <DetailItem label="Subject" value={question.subject} />
              <div className="flex-shrink-0">
                <StatusBadge status={question.status} />
              </div>
            </div>
          </Section>

          {/* Question Content Section */}
          <Section title="Question">
            {question.question.image && (
              <img
                src={question.question.image}
                alt="Question"
                className="rounded-lg max-h-96 w-auto mb-4 border p-2"
              />
            )}
            <p className="text-lg whitespace-pre-wrap">
              {question.question.text}
            </p>
          </Section>

          {/* Options Section */}
          <Section title="Options">
            <ul className="space-y-3">
              {question.options.map((opt, idx) => (
                <li
                  key={idx}
                  className={`p-4 rounded-lg flex items-start gap-4 ${
                    opt.isCorrect
                      ? "bg-green-100 border-green-300 border-2"
                      : "bg-gray-100"
                  }`}
                >
                  <span
                    className={`font-bold text-lg ${
                      opt.isCorrect ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    {idx + 1}.
                  </span>
                  <div className="flex-grow">
                    {opt.image && (
                      <img
                        src={opt.image}
                        alt={`Option ${idx + 1}`}
                        className="rounded max-h-40 w-auto mb-2 border"
                      />
                    )}
                    <p>{opt.text}</p>
                  </div>
                  {opt.isCorrect && (
                    <span className="font-bold text-green-700 self-center">
                      (Correct Answer)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          {/* Explanation Section */}
          {question.explanation?.text && (
            <Section title="Explanation">
              {question.explanation.image && (
                <img
                  src={question.explanation.image}
                  alt="Explanation"
                  className="rounded-lg max-h-96 w-auto mb-4 border p-2"
                />
              )}
              <p className="p-4 bg-blue-50 rounded-md whitespace-pre-wrap">
                {question.explanation.text}
              </p>
            </Section>
          )}

          {/* Metadata Section */}
          <Section title="Metadata">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <DetailItem label="Course" value={question.course} />
              <DetailItem label="Grade" value={question.grade} />
              <DetailItem label="Chapter" value={question.chapter} />
              <DetailItem label="Complexity" value={question.complexity} />
              <DetailItem
                label="Keywords"
                value={
                  Array.isArray(question.keywords)
                    ? question.keywords.join(", ")
                    : "N/A"
                }
              />
            </div>
          </Section>

          {/* Review Information Section */}
          <Section title="Review Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DetailItem
                label="Created By (Maker)"
                value={question.maker?.name}
              />
              <DetailItem
                label="Reviewed By (Checker)"
                value={question.checkedBy?.name}
              />
            </div>
            {question.status === "Rejected" && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-500">
                  Rejection Comments
                </p>
                <p className="text-md text-red-700 bg-red-50 p-3 rounded-md mt-1">
                  {question.checkerComments}
                </p>
              </div>
            )}
          </Section>

          {/* --- CONDITIONAL ACTION SECTION --- */}
          {question.status === "Pending" && (
            <Section title="Actions">
              <div>
                <label
                  htmlFor="rejection-comment"
                  className="font-semibold text-lg mb-2 block"
                >
                  Feedback / Rejection Comment:
                </label>
                <textarea
                  id="rejection-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Provide clear feedback if rejecting..."
                  className="w-full h-28 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end gap-4">
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
            </Section>
          )}

          <div className="text-center text-xs text-gray-400 pt-4">
            <p>Created: {new Date(question.createdAt).toLocaleString()}</p>
            <p>Last Updated: {new Date(question.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
