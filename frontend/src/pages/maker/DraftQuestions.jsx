import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DraftQuestions() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch drafts from backend
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/questions/drafts",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDrafts(res.data)
      } catch (err) {
        console.error("Error fetching drafts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

const handleSubmitForApproval = async () => {
  if (selected.length === 0) return;

  if (!window.confirm(`Submit ${selected.length} draft(s) for approval?`))
    return;

  try {
    const token = localStorage.getItem("token");
    const res = await axios.put(
      "http://localhost:5000/api/questions/submit",
      { ids: selected },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert(res.data.message);

    // Remove submitted drafts from the list
    setDrafts((prev) => prev.filter((q) => !selected.includes(q._id)));

    setSelected([]); // clear selection
  } catch (err) {
    console.error("Submit for approval failed", err);
    alert("Failed to submit drafts");
  }
};


  const handleDeleteSelected = async () => {
    if (window.confirm(`Delete ${selected.length} draft(s)?`)) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete("http://localhost:5000/api/questions/delete", {
          headers: { Authorization: `Bearer ${token}` },
          data: { ids: selected },
        });
        setDrafts((prev) => prev.filter((q) => !selected.includes(q._id)));
        setSelected([]);
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  // Safe filtering to prevent crashes
  const filteredDrafts = drafts.filter((q) => {
    const text = q?.questionText || "";
    const subject = q?.subject || "";
    const chapter = q?.chapter || "";

    return (
      text.toLowerCase().includes(search.toLowerCase()) ||
      subject.toLowerCase().includes(search.toLowerCase()) ||
      chapter.toLowerCase().includes(search.toLowerCase())
    );
  });

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
                key={q._id}
                className="border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <input
                    type="checkbox"
                    checked={selected.includes(q._id)}
                    onChange={() => handleSelect(q._id)}
                    className="w-4 h-4 mt-1 accent-blue-600"
                  />
                  <span className="text-xs text-gray-400">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="font-semibold text-base md:text-lg mt-2 line-clamp-2">
                  {q.text || "Untitled Question"}
                </h2>

                {/* Details */}
                <div className="text-xs md:text-sm text-gray-600 mt-1 space-y-1">
                  <p>
                    <span className="font-medium">Course:</span>{" "}
                    {q.course || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Grade:</span>{" "}
                    {q.grade || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Subject:</span>{" "}
                    {q.subject || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Chapter:</span>{" "}
                    {q.chapter || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Difficulty:</span>{" "}
                    {q.complexity || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {q.status || "N/A"}
                  </p>
                </div>

                {/* Edit Draft Button */}
                <button
                  onClick={() => navigate(`/maker/create/${q._id}`)}
                  className="mt-3 px-3 py-1 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  Edit Draft
                </button>
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
