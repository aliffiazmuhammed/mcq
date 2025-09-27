import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";
// --- Reusable Modal Components ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{message}</h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-semibold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
        <p className="text-gray-800 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
};

const ImageModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-4 relative">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 text-3xl text-white font-bold"
        >
          &times;
        </button>
        <img
          src={src}
          alt="Full size content"
          className="rounded-lg w-full h-auto max-h-[80vh] object-contain"
        />
      </div>
    </div>
  );
};

// --- Main Component ---

export default function CheckerReview() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // State for modals
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
  });

  // State for filters
  const [filterMaker, setFilterMaker] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${host}/api/checker/questions/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions(res.data);
      } catch (err) {
        console.error("Error fetching pending questions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  // UPDATED: Correctly extracts titles from populated course objects
  const makers = [
    "All",
    ...new Set(questions.map((q) => q.maker?.name).filter(Boolean)),
  ];
  const courses = [
    "All",
    ...new Set(questions.map((q) => q.course?.title).filter(Boolean)),
  ];

  // UPDATED: Filters based on the course title
  const filteredQuestions = questions.filter((q) => {
    const matchesMaker = filterMaker === "All" || q.maker?.name === filterMaker;
    const matchesCourse =
      filterCourse === "All" || q.course?.title === filterCourse;
    return matchesMaker && matchesCourse;
  });

  const handleToggleSelect = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map((q) => q._id));
    }
  };

  const proceedWithBulkApprove = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${host}/api/checker/questions/approve-bulk`,
        { ids: selectedQuestions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions((prev) =>
        prev.filter((q) => !selectedQuestions.includes(q._id))
      );
      setSelectedQuestions([]);
      setNotification({
        isOpen: true,
        message: `${selectedQuestions.length} question(s) approved successfully.`,
      });
    } catch (err) {
      console.error("Bulk approve failed:", err);
      setNotification({
        isOpen: true,
        message: "An error occurred during bulk approval.",
      });
    }
    setConfirmation({ isOpen: false, message: "", onConfirm: () => {} });
  };

  const handleBulkApprove = () => {
    if (selectedQuestions.length === 0) return;
    setConfirmation({
      isOpen: true,
      message: `Are you sure you want to approve ${selectedQuestions.length} selected question(s)?`,
      onConfirm: proceedWithBulkApprove,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Questions for Review ({filteredQuestions.length})
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t">
            <select
              value={filterMaker}
              onChange={(e) => setFilterMaker(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500"
            >
              {makers.map((name, idx) => (
                <option key={idx} value={name}>
                  {name === "All" ? "All Makers" : name}
                </option>
              ))}
            </select>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500"
            >
              {courses.map((name, idx) => (
                <option key={idx} value={name}>
                  {name === "All" ? "All Courses" : name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredQuestions.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="selectAll"
                checked={
                  selectedQuestions.length > 0 &&
                  selectedQuestions.length === filteredQuestions.length
                }
                onChange={handleSelectAll}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <label
                htmlFor="selectAll"
                className="ml-3 font-medium text-gray-700"
              >
                {selectedQuestions.length > 0
                  ? `${selectedQuestions.length} selected`
                  : "Select All"}
              </label>
            </div>
            <button
              onClick={handleBulkApprove}
              disabled={selectedQuestions.length === 0}
              className="bg-green-600 text-white px-5 py-2 rounded-md font-semibold disabled:bg-gray-400"
            >
              Approve Selected
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="p-4 w-4"></th>
                  <th className="p-4">Question</th>
                  <th className="p-4">Maker</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4">Question Paper</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr
                    key={q._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(q._id)}
                        onChange={() => handleToggleSelect(q._id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-900 max-w-xs">
                 
                      <span className="line-clamp-2 block mb-2">
                        {q.question.text || "No text"}
                       
                      </span>
                    
                      {q.question.image && (
                        <img
                          src={q.question.image}
                          alt="Q"
                          className="h-10 w-16 object-contain rounded border cursor-pointer"
                          onClick={() => setImageModalSrc(q.question.image)}
                        />
                      )}
                  
                    </td>
                    <td className="p-4">{q.maker?.name || "N/A"}</td>
                    <td className="p-4">{q.course?.title || "N/A"}</td>
                    <td className="p-4">{q.unit || "N/A"}</td>
                    <td className="p-4">{q.questionPaper?.name || "N/A"}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => navigate(`/checker/details/${q._id}`)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredQuestions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center p-10 text-gray-500">
                      No pending questions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        message={confirmation.message}
      />
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        message={notification.message}
      />
      <ImageModal src={imageModalSrc} onClose={() => setImageModalSrc(null)} />
    </div>
  );
}
