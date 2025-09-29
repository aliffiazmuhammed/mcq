import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { host } from "../../utils/APIRoutes";

// --- Main Component ---
export default function ClaimedPdfsPage() {
  const [claimedPapers, setClaimedPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); // Initialize navigate

  // Fetch claimed PDFs on component mount
  useEffect(() => {
    const fetchClaimedPdfs = async () => {
      try {
        const token = localStorage.getItem("token");
        // This endpoint fetches papers claimed by the currently logged-in maker
        const res = await axios.get(`${host}/api/questions/papers/claimed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClaimedPapers(res.data);
      } catch (err) {
        console.error("Error fetching claimed PDFs:", err);
        alert("Failed to fetch your claimed papers.");
      } finally {
        setLoading(false);
      }
    };
    fetchClaimedPdfs();
  }, []);

  // Client-side search filtering
  const filteredPapers = claimedPapers.filter((paper) =>
    paper.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Claimed Papers</h1>
        <p className="text-gray-500 mt-2">
          These are the question papers you are currently working on. Select a
          paper to start creating questions for it.
        </p>
        <div className="mt-6">
          <input
            type="text"
            placeholder="Search by paper name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-full max-w-md focus:ring-2 focus:ring-blue-500"
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
                <th className="p-4">Paper Name</th>
                <th className="p-4 text-center">View Files</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPapers.map((paper) => (
                <tr
                  key={paper._id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="p-4 font-medium text-gray-900">
                    {paper.name}
                  </td>
                  {/* --- UPDATED: View Files Column --- */}
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-3">
                      {paper.questionPaperFile?.url ? (
                        <a
                          href={paper.questionPaperFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition-colors text-xs"
                        >
                          View Question
                        </a>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
                          No Question File
                        </span>
                      )}

                      {paper.solutionPaperFile?.url ? (
                        <a
                          href={paper.solutionPaperFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full hover:bg-green-200 transition-colors text-xs"
                        >
                          View Solution
                        </a>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
                          No Solution File
                        </span>
                      )}
                    </div>
                  </td>
                  {/* --- UPDATED: Actions Column --- */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => navigate("/maker/create")} // Navigates to the page for creating questions
                      className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-xs"
                    >
                      Create Question
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPapers.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center p-10 text-gray-500">
                    You have not claimed any papers yet, or no papers match your
                    search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
