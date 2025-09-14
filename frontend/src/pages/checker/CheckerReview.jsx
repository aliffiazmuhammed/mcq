import { useState } from "react";

export default function CheckerReview() {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: "What is the capital of France?",
      maker: "John Doe",
      subject: "Geography",
      chapter: "Europe",
      status: "Pending",
      choices: [
        { text: "Paris", image: null },
        { text: "London", image: null },
        { text: "Rome", image: null },
        { text: "Berlin", image: null },
      ],
      correctAnswer: 0,
      explanation: "Paris is the capital city of France.",
      referenceImage: null,
      comments: "",
    },
    {
      id: 2,
      text: "Solve 12 × 8",
      maker: "Jane Smith",
      subject: "Math",
      chapter: "Multiplication",
      status: "Pending",
      choices: [
        { text: "90", image: null },
        { text: "96", image: null },
        { text: "108", image: null },
        { text: "84", image: null },
      ],
      correctAnswer: 1,
      explanation: "12 × 8 = 96",
      referenceImage: null,
      comments: "",
    },
  ]);

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [rejectionComment, setRejectionComment] = useState("");

  // Toggle selection for bulk approve
  const toggleSelect = (id) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter((q) => q !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const handleBulkApprove = () => {
    setQuestions((prev) =>
      prev.map((q) =>
        selectedQuestions.includes(q.id) ? { ...q, status: "Approved" } : q
      )
    );
    setSelectedQuestions([]);
  };

  const handleReject = (id) => {
    if (!rejectionComment) return alert("Enter rejection comment!");
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, status: "Rejected", comments: rejectionComment }
          : q
      )
    );
    setRejectionComment("");
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
            key={q.id}
            className="bg-white p-4 rounded shadow hover:bg-gray-50 cursor-pointer"
            onClick={() =>
              setExpandedQuestion(expandedQuestion?.id === q.id ? null : q)
            }
          >
            {/* Header: Question + Status + Checkbox */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(q.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelect(q.id);
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
            {expandedQuestion?.id === q.id && (
              <div className="mt-4 border-t pt-4 space-y-3">
                <p>
                  <span className="font-semibold">Maker:</span> {q.maker}
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

                {/* Choices */}
                <div>
                  <p className="font-semibold">Choices:</p>
                  <ul className="list-decimal list-inside">
                    {q.choices.map((c, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {c.text}
                        {q.correctAnswer === idx && (
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

                {/* Reference Image */}
                {q.referenceImage && (
                  <img
                    src={URL.createObjectURL(q.referenceImage)}
                    alt="Reference"
                    className="max-h-48 mt-2"
                  />
                )}

                {/* Rejection Comment */}
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
                        setQuestions((prev) =>
                          prev.map((ques) =>
                            ques.id === q.id
                              ? { ...ques, status: "Approved" }
                              : ques
                          )
                        );
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>

                    <input
                      type="text"
                      placeholder="Rejection comment"
                      value={rejectionComment}
                      onChange={(e) => {
                        e.stopPropagation();
                        setRejectionComment(e.target.value);
                      }}
                      className="border px-2 py-1 rounded flex-1"
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(q.id);
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
