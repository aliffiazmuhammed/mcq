import { useEffect, useState } from "react";

// Dummy data (replace with API later)
const dummyDrafts = [
  {
    id: 1,
    subject: "Mathematics",
    chapter: "Algebra",
    question: "What is the value of x if 2x + 3 = 7?",
    status: "Draft",
    createdAt: "2025-09-14",
  },
  {
    id: 2,
    subject: "Physics",
    chapter: "Mechanics",
    question: "State Newton’s second law of motion.",
    status: "Draft",
    createdAt: "2025-09-13",
  },
  {
    id: 3,
    subject: "Chemistry",
    chapter: "Organic Chemistry",
    question: "What is the molecular formula of benzene?",
    status: "Draft",
    createdAt: "2025-09-12",
  },
];

export default function DraftQuestions() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  // Simulate API fetch
  useEffect(() => {
    setTimeout(() => {
      setDrafts(dummyDrafts);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  const handleSubmitForApproval = () => {
    alert(`Submitting ${selected.length} questions for approval...`);
    setSelected([]);
  };

  const handleDeleteSelected = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selected.length} draft(s)?`
      )
    ) {
      setDrafts((prev) => prev.filter((q) => !selected.includes(q.id)));
      setSelected([]);
    }
  };

  const filteredDrafts = drafts.filter(
    (q) =>
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.subject.toLowerCase().includes(search.toLowerCase()) ||
      q.chapter.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen pb-24 md:pb-6">
      {/* Header */}
      <div className="p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
          Draft Questions
        </h1>

        {/* Search & Bulk Actions (desktop only) */}
        <div className="hidden md:flex items-center justify-between gap-3 mb-6">
          <input
            type="text"
            placeholder="Search drafts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="flex gap-2">
            <button
              disabled={selected.length === 0}
              onClick={handleDeleteSelected}
              className={`px-4 py-2 rounded text-white transition ${
                selected.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Delete Selected
            </button>
            <button
              disabled={selected.length === 0}
              onClick={handleSubmitForApproval}
              className={`px-4 py-2 rounded text-white transition ${
                selected.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Submit for Approval ({selected.length})
            </button>
          </div>
        </div>

        {/* Search (mobile) */}
        <div className="md:hidden mb-4">
          <input
            type="text"
            placeholder="Search drafts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Loader */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <p className="text-gray-500">No draft questions found.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {filteredDrafts.map((q) => (
              <div
                key={q.id}
                className="border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <input
                    type="checkbox"
                    checked={selected.includes(q.id)}
                    onChange={() => handleSelect(q.id)}
                    className="w-4 h-4 mt-1 accent-blue-600"
                  />
                  <span className="text-xs text-gray-400">{q.createdAt}</span>
                </div>
                <h2 className="font-semibold text-base md:text-lg mt-2 line-clamp-2">
                  {q.question}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  <span className="font-medium">Subject:</span> {q.subject} |{" "}
                  <span className="font-medium">Chapter:</span> {q.chapter}
                </p>
                <p className="text-xs mt-2 text-gray-500">Status: {q.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Action Bar (mobile only) */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t shadow-md p-3 flex gap-2">
        <button
          disabled={selected.length === 0}
          onClick={handleDeleteSelected}
          className={`flex-1 px-4 py-2 rounded text-white transition ${
            selected.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Delete
        </button>
        <button
          disabled={selected.length === 0}
          onClick={handleSubmitForApproval}
          className={`flex-1 px-4 py-2 rounded text-white transition ${
            selected.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Submit ({selected.length})
        </button>
      </div>
    </div>
  );
}
