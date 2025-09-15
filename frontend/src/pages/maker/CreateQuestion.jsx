import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { getCroppedImg } from "../../utils/cropImage";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function CreateQuestion() {

  const { id } = useParams();

  

  const initialFormData = {
    course: "",
    grade: "",
    subject: "",
    chapter: "",
    questionText: "",
    questionImage: null,
    choices: [
      { text: "", image: null },
      { text: "", image: null },
    ],
    correctAnswer: 0,
    explanation: "",
    explanationImage: null,
    complexity: "Easy",
    keywords: "",
    referenceImage: null,
  };

  const [formData, setFormData] = useState(initialFormData);

  const [cropModal, setCropModal] = useState({
    open: false,
    src: null,
    type: "",
    index: null,
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);


 useEffect(() => {
   if (id) {
     const fetchDraft = async () => {
       try {
         const token = localStorage.getItem("token");
         const res = await axios.get(
           `http://localhost:5000/api/questions/${id}`,
           {
             headers: { Authorization: `Bearer ${token}` },
           }
         );

         const q = res.data;

         // Map backend Question → formData shape
         setFormData({
           _id: q._id,
           course: q.course || "",
           grade: q.grade || "",
           subject: q.subject || "",
           chapter: q.chapter || "",
           questionText: q.text || "", // backend has "text"
           questionImage: null, // load images later if needed
           choices: q.options?.map((opt) => ({
             text: opt.text,
             image: null,
           })) || [
             { text: "", image: null },
             { text: "", image: null },
           ],
           correctAnswer: q.options?.findIndex((opt) => opt.isCorrect) ?? 0,
           explanation: q.explanation || "",
           explanationImage: null,
           complexity: q.complexity || "Easy",
           keywords: q.keywords || "",
           referenceImage: null,
         });
       } catch (err) {
         console.error("Error loading draft", err);
       }
     };
     fetchDraft();
   }
 }, [id]);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle normal input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle choice text
  const handleChoiceChange = (index, value) => {
    const updatedChoices = [...formData.choices];
    updatedChoices[index].text = value;
    setFormData((prev) => ({ ...prev, choices: updatedChoices }));
  };

  // Add a new choice
  const addChoice = () => {
    setFormData((prev) => ({
      ...prev,
      choices: [...prev.choices, { text: "", image: null }],
    }));
  };

  // Remove a choice
  const removeChoice = (index) => {
    setFormData((prev) => {
      const updated = prev.choices.filter((_, i) => i !== index);
      return {
        ...prev,
        choices: updated,
        correctAnswer: Math.min(prev.correctAnswer, updated.length - 1), // ✅ Keep valid answer
      };
    });
  };

  // File change → open crop modal
  const handleFileChange = (e, field, index = null) => {
    const file = e.target.files[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    setCropModal({ open: true, src, type: field, index });
  };

  // Apply cropping
  const applyCrop = async () => {
    try {
      setLoading(true);
      const blob = await getCroppedImg(cropModal.src, croppedAreaPixels, zoom);
      const croppedFile = new File([blob], "cropped.jpg", {
        type: "image/jpeg",
      });

      if (cropModal.type === "questionImage")
        setFormData((prev) => ({ ...prev, questionImage: croppedFile }));
      else if (cropModal.type === "explanationImage")
        setFormData((prev) => ({ ...prev, explanationImage: croppedFile }));
      else if (cropModal.type === "referenceImage")
        setFormData((prev) => ({ ...prev, referenceImage: croppedFile }));
      else if (cropModal.type === "choiceImage" && cropModal.index !== null) {
        const updatedChoices = [...formData.choices];
        updatedChoices[cropModal.index].image = croppedFile;
        setFormData((prev) => ({ ...prev, choices: updatedChoices }));
      }

      setCropModal({ open: false, src: null, type: "", index: null });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Submit question (Draft / Submit)
const handleSubmit = async (type) => {
  setLoading(true);
  try {
    const payload = {
      _id: formData._id || undefined,
      course: formData.course,
      grade: formData.grade,
      subject: formData.subject,
      chapter: formData.chapter,
      questionText: formData.questionText,
      choices: formData.choices.map((c) => ({ text: c.text })),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation,
      complexity: formData.complexity,
      keywords: formData.keywords,
      status: type === "Draft" ? "Draft" : "Pending",
    };

    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://localhost:5000/api/questions/create",
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    alert(
      `Question ${
        type === "Draft" ? "saved as draft" : "submitted"
      } successfully!`
    );
    setFormData(initialFormData); // ✅ Reset form
  } catch (err) {
    console.error(err);
    alert("Error saving question");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md relative">
      <h1 className="text-2xl font-bold mb-6">Create New Question</h1>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Course / Grade / Subject / Chapter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {["course", "grade", "subject", "chapter"].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={handleInputChange}
            className="border px-3 py-2 rounded w-full"
          />
        ))}
      </div>

      {/* Question Text & Image */}
      <div className="mb-4">
        <textarea
          name="questionText"
          placeholder="Question Text"
          value={formData.questionText}
          onChange={handleInputChange}
          className="border px-3 py-2 rounded w-full h-24"
        />
        <input
          type="file"
          onChange={(e) => handleFileChange(e, "questionImage")}
          className="mt-2"
        />
        {formData.questionImage && (
          <img
            src={URL.createObjectURL(formData.questionImage)}
            alt="Question"
            className="mt-2 max-h-48"
          />
        )}
      </div>

      {/* Choices */}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Choices</h2>
        {formData.choices.map((choice, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row items-center gap-2 mb-2 border p-2 rounded"
          >
            <input
              type="text"
              placeholder={`Choice ${index + 1}`}
              value={choice.text}
              onChange={(e) => handleChoiceChange(index, e.target.value)}
              className="border px-3 py-2 rounded w-full"
            />
            <input
              type="file"
              onChange={(e) => handleFileChange(e, "choiceImage", index)}
              className="w-full sm:w-auto"
            />
            {choice.image && (
              <img
                src={URL.createObjectURL(choice.image)}
                alt={`Choice ${index + 1}`}
                className="max-h-24"
              />
            )}
            {formData.choices.length > 2 && (
              <button
                onClick={() => removeChoice(index)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addChoice}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mt-2"
        >
          + Add Choice
        </button>
      </div>

      {/* Correct Answer */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Correct Answer</label>
        <select
          value={formData.correctAnswer}
          onChange={(e) =>
            setFormData({ ...formData, correctAnswer: Number(e.target.value) })
          }
          className="border px-3 py-2 rounded w-full"
        >
          {formData.choices.map((_, index) => (
            <option key={index} value={index}>
              Choice {index + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Explanation */}
      <div className="mb-4">
        <textarea
          name="explanation"
          placeholder="Explanation"
          value={formData.explanation}
          onChange={handleInputChange}
          className="border px-3 py-2 rounded w-full h-20"
        />
        <input
          type="file"
          onChange={(e) => handleFileChange(e, "explanationImage")}
          className="mt-2"
        />
        {formData.explanationImage && (
          <img
            src={URL.createObjectURL(formData.explanationImage)}
            alt="Explanation"
            className="mt-2 max-h-48"
          />
        )}
      </div>

      {/* Complexity, Keywords, Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <select
          value={formData.complexity}
          onChange={(e) =>
            setFormData({ ...formData, complexity: e.target.value })
          }
          className="border px-3 py-2 rounded w-full"
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <input
          type="text"
          name="keywords"
          placeholder="Keywords"
          value={formData.keywords}
          onChange={handleInputChange}
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="file"
          onChange={(e) => handleFileChange(e, "referenceImage")}
        />
        {formData.referenceImage && (
          <img
            src={URL.createObjectURL(formData.referenceImage)}
            alt="Reference"
            className="mt-2 max-h-48 col-span-full"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => handleSubmit("Draft")}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Save as Draft
        </button>
        <button
          onClick={() => handleSubmit("Submit")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Submit for Approval
        </button>
      </div>

      {/* Crop Modal */}
      <Modal
        isOpen={cropModal.open}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="bg-white p-4 rounded-lg max-w-lg w-full relative">
          <h2 className="text-xl font-bold mb-4">Crop Image</h2>
          {cropModal.src && (
            <div className="relative w-full h-64 bg-gray-200">
              <Cropper
                image={cropModal.src}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() =>
                setCropModal({ open: false, src: null, type: "", index: null })
              }
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={applyCrop}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
