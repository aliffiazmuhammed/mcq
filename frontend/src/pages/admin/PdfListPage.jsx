import React, { useEffect, useState } from "react";
import axios from "axios";
// The local import for 'host' has been inlined to prevent compilation errors.
// import { host } from "../../utils/APIRoutes";

// --- Inlined Configuration ---
const host = "http://localhost:5000"; // Replace with your actual backend host

// --- Helper Components (Replacing react-icons for compatibility) ---

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const StatusBadge = ({ isClaimed }) => {
  const bgColor = isClaimed ? "bg-yellow-100" : "bg-green-100";
  const textColor = isClaimed ? "text-yellow-800" : "text-green-800";
  const text = isClaimed ? "Claimed" : "Available";
  return (
    <span
      className={`px-3 py-1 text-xs font-bold rounded-full ${bgColor} ${textColor}`}
    >
      {text}
    </span>
  );
};

// --- Main Component ---

export default function PdfListPage() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPdfs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${host}/api/admin/pdfs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setPdfs(res.data.files);
      }
    } catch (err) {
      console.error("Error fetching PDFs:", err);
      alert("Failed to fetch PDFs");
    } finally {
      setLoading(false);
    }
  };
console.log(pdfs)
  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this PDF? This action cannot be undone."
      )
    )
      return;

    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${host}/api/admin/pdfs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        alert("PDF deleted successfully");
        fetchPdfs(); // Re-fetch the list to show the update
      } else {
        alert("Delete failed: " + res.data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPdfs = pdfs.filter((pdf) =>
    pdf.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Uploaded Question Papers
          </h1>
          <p className="text-gray-500 mt-2">
            View and manage all uploaded papers and their current status.
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
                  <th className="p-4">Status</th>
                  <th className="p-4">Claimed By</th>
                  <th className="p-4">Uploaded Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPdfs.map((pdf) => (
                  <tr
                    key={pdf._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {pdf.name}
                    </td>
                    <td className="p-4">
                      <StatusBadge isClaimed={!!pdf.usedBy} />
                    </td>
                    <td className="p-4 font-medium">
                      {pdf.usedBy?.name || "N/A"}
                    </td>
                    <td className="p-4">
                      {new Date(pdf.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <EyeIcon /> View
                        </a>
                        <button
                          onClick={() => handleDelete(pdf._id)}
                          disabled={deletingId === pdf._id}
                          className="flex items-center px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-red-200 disabled:cursor-wait"
                        >
                          <TrashIcon />
                          {deletingId === pdf._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPdfs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center p-10 text-gray-500">
                      No PDFs found.
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
