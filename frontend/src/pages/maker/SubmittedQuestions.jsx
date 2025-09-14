import { useState } from "react";

export default function SubmittedQuestions() {
  // Dummy submitted questions data
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: "What is the capital of France?",
      status: "Approved",
      comments: "",
    },
    {
      id: 2,
      text: "Solve: 12 × 8",
      status: "Rejected",
      comments: "Please recheck the answer options. One option is incorrect.",
    },
    {
      id: 3,
      text: "Who developed the theory of relativity?",
      status: "Pending",
      comments: "",
    },
  ]);

  const [selectedComments, setSelectedComments] = useState(null);

  const handleViewComments = (question) => {
    setSelectedComments(question);
  };

  const handleCloseComments = () => {
    setSelectedComments(null);
  };

  const handleEdit = (id) => {
    alert(`Redirecting to edit page for question ID: ${id}`);
    // Later: Navigate to Create/Edit page with pre-filled data
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Submitted Questions</h1>

      {/* Table for larger screens */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left border-b">ID</th>
              <th className="p-3 text-left border-b">Question</th>
              <th className="p-3 text-left border-b">Status</th>
              <th className="p-3 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="p-3 border-b">{q.id}</td>
                <td className="p-3 border-b">{q.text}</td>
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
                <td className="p-3 border-b space-x-2">
                  {q.status === "Rejected" && (
                    <>
                      <button
                        onClick={() => handleViewComments(q)}
                        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                      >
                        View Comments
                      </button>
                      <button
                        onClick={() => handleEdit(q.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </>
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

      {/* Card layout for mobile */}
      <div className="sm:hidden space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className="border rounded-lg p-4 shadow-sm bg-gray-50"
          >
            <p className="font-semibold mb-2">{q.text}</p>
            <p className="mb-2">
              Status:{" "}
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
            </p>

            {q.status === "Rejected" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewComments(q)}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 w-full"
                >
                  View Comments
                </button>
                <button
                  onClick={() => handleEdit(q.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 w-full"
                >
                  Edit
                </button>
              </div>
            )}

            {q.status === "Pending" && (
              <p className="text-gray-500 text-sm italic">Awaiting review</p>
            )}
            {q.status === "Approved" && (
              <p className="text-green-600 text-sm italic">Finalized</p>
            )}
          </div>
        ))}
      </div>

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
