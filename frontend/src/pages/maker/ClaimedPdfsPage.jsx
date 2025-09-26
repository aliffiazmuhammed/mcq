import React, { useEffect, useState } from "react";
import axios from "axios";
// The local import for 'host' has been inlined to prevent compilation errors.
 import { host } from "../../utils/APIRoutes";

// --- Main Component ---
export default function ClaimedPdfsPage() {
  const [claimedPapers, setClaimedPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch claimed PDFs on component mount
  useEffect(() => {
    const fetchClaimedPdfs = async () => {
      try {
        const token = localStorage.getItem("token");
        // Corrected the API endpoint to be consistent with the maker-specific routes
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
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            My Claimed Papers
          </h1>
          <p className="text-gray-500 mt-2">
            These are the question papers you are currently working on.
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
                    <td className="p-4 text-center">
                      {/* The button is now an anchor tag for viewing the PDF */}
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                      >
                        View PDF
                      </a>
                    </td>
                  </tr>
                ))}
                {filteredPapers.length === 0 && (
                  <tr>
                    {/* Corrected colspan to 2 */}
                    <td colSpan="2" className="text-center p-10 text-gray-500">
                      You have not claimed any papers yet.
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
