import React, { useEffect, useState } from "react";
import { HiOutlineDocument, HiTrash, HiEye } from "react-icons/hi";
import { host } from "../../utils/APIRoutes";

export default function PdfListPage() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // track PDF being deleted
  const token = localStorage.getItem("token");

  // Fetch all PDFs
  const fetchPdfs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${host}/api/admin/pdfs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPdfs(data.files);
    } catch (err) {
      console.error("Error fetching PDFs:", err);
      alert("Failed to fetch PDFs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  // Delete PDF
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PDF?")) return;

    setDeletingId(id); // start deleting
    try {
      const res = await fetch(`${host}/api/admin/pdfs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert("PDF deleted successfully");
        fetchPdfs();
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    } finally {
      setDeletingId(null); // reset
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md relative">
      <h1 className="text-2xl font-bold mb-6">Uploaded PDFs</h1>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {pdfs.length === 0 ? (
        <p className="text-gray-500">No PDFs uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {pdfs.map((pdf, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <HiOutlineDocument size={20} className="text-indigo-500" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {pdf.name}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={pdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <HiEye size={16} className="mr-1" /> View
                </a>
                <button
                  onClick={() => handleDelete(pdf._id)}
                  disabled={deletingId === pdf._id} // disable while deleting
                  className={`flex items-center px-3 py-1 rounded ${
                    deletingId === pdf._id
                      ? "bg-red-200 text-red-400 cursor-not-allowed"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  <HiTrash size={16} className="mr-1" />
                  {deletingId === pdf._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
