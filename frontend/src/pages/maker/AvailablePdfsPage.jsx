import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";

// --- Main Component ---
export default function AvailablePdfsPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionInProgress, setActionInProgress] = useState(null); // Tracks which paper is being "taken"
  const navigate = useNavigate();

  // Fetch all available PDFs on component mount
  const fetchAvailablePdfs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${host}/api/questions/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Assuming the API now returns papers with all necessary details
      setPapers(res.data);
    } catch (err) {
      console.error("Error fetching available PDFs:", err);
      alert("Failed to fetch available papers.");
    } finally {
      setLoading(false);
    }
  };
console.log(papers)
  useEffect(() => {
    fetchAvailablePdfs();
  }, []);

  // "Take PDF" action handler
  const handleTakePdf = async (paperId) => {
    if (
      !window.confirm(
        "Are you sure you want to start working on this paper? It will be locked for other users."
      )
    )
      return;

    setActionInProgress(paperId);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${host}/api/questions/papers/${paperId}/claim`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(
        "Paper assigned successfully! You can now create questions for it."
      );
      navigate(`/maker/create`);
    } catch (err) {
      console.error("Error taking PDF:", err);
      alert(
        err.response?.data?.message ||
          "Failed to take this paper. It might have been taken by another user."
      );
      fetchAvailablePdfs(); // Refresh the list
    } finally {
      setActionInProgress(null);
    }
  };

  // Client-side search filtering
  const filteredPapers = papers.filter((paper) => {
    const term = searchTerm.toLowerCase();
    return (
      paper.name.toLowerCase().includes(term) ||
      (paper.course?.title || "").toLowerCase().includes(term) ||
      (paper.subject || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Available Question Papers
          </h1>
          <p className="text-gray-500 mt-2">
            Select a paper to start creating questions. Once you take a paper,
            it will be locked for other makers.
          </p>
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search by name, course, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full max-w-md focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Paper Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Year
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Question PDF
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Solution PDF
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPapers.map((paper) => (
                  <tr
                    key={paper._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {paper.name}
                    </td>
                    <td className="px-6 py-4">
                      {paper.course?.title || "N/A"}
                    </td>
                    <td className="px-6 py-4">{paper.subject || "N/A"}</td>
                    <td className="px-6 py-4">
                      {paper.questionPaperYear || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {paper.questionPaperFile ? (
                        <a
                          href={paper.questionPaperFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">
                          Not Available
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {paper.solutionPaperFile ? (
                        <a
                          href={paper.solutionPaperFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">
                          Not Available
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleTakePdf(paper._id)}
                        disabled={actionInProgress === paper._id}
                        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait transition-colors"
                      >
                        {actionInProgress === paper._id
                          ? "Taking..."
                          : "Take Paper"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPapers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center p-10 text-gray-500">
                      {papers.length > 0
                        ? "No papers match your search."
                        : "There are currently no available papers."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
