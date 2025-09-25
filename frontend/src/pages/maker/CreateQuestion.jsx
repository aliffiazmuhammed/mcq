import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { getCroppedImg } from "../../utils/cropImage";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";

// Helper to get the correct URL for image previews (handles both File objects and URL strings)
const getImagePreviewUrl = (image) => {
  if (!image) return null;
  if (image instanceof File) {
    return URL.createObjectURL(image);
  }
  return image; // It's already a URL string from the backend
};

// --- Sub-Components (can be moved to separate files later) ---

const SectionWrapper = ({ title, children }) => (
  <fieldset className="border border-gray-200 p-6 rounded-lg mb-6">
    <legend className="text-lg font-semibold px-2 text-gray-700">
      {title}
    </legend>
    <div className="space-y-4">{children}</div>
  </fieldset>
);

const QuestionMetadataInputs = ({ formData, handleInputChange }) => (
  <SectionWrapper title="Question Details">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {["course", "grade", "subject", "chapter"].map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
            {field}
          </label>
          <input
            type="text"
            name={field}
            placeholder={`Enter ${field} name...`}
            value={formData[field]}
            onChange={handleInputChange}
            className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
      ))}
    </div>
  </SectionWrapper>
);

const ContentInputSection = ({
  label,
  textName,
  textValue,
  imageValue,
  onTextChange,
  onFileChange,
}) => (
  <SectionWrapper title={label}>
    <textarea
      name={textName}
      placeholder={`${label} content...`}
      value={textValue}
      onChange={onTextChange}
      className="border border-gray-300 px-3 py-2 rounded-md w-full h-28 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    />
    <div className="flex items-center gap-4">
      <input
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
      />
      {imageValue && (
        <img
          src={getImagePreviewUrl(imageValue)}
          alt={`${label} Preview`}
          className="rounded-md h-24 w-auto object-contain border p-1"
        />
      )}
    </div>
  </SectionWrapper>
);

const ChoicesSection = ({
  choices,
  correctAnswer,
  setFormData,
  handleChoiceChange,
  handleFileChange,
  removeChoice,
  addChoice,
}) => (
  <SectionWrapper title="Answer Choices">
    <div className="space-y-4">
      {choices.map((choice, index) => (
        <div
          key={index}
          className="flex items-start gap-4 border p-4 rounded-md bg-gray-50"
        >
          <input
            type="radio"
            name="correctAnswer"
            checked={correctAnswer === index}
            onChange={() =>
              setFormData((prev) => ({ ...prev, correctAnswer: index }))
            }
            className="mt-2.5 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <div className="flex-grow space-y-3">
            <input
              type="text"
              placeholder={`Choice ${index + 1} text`}
              value={choice.text}
              onChange={(e) => handleChoiceChange(index, e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-md w-full"
            />
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "choiceImage", index)}
                className="text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
              {choice.image && (
                <img
                  src={getImagePreviewUrl(choice.image)}
                  alt={`Choice ${index + 1} Preview`}
                  className="rounded h-16 w-auto object-contain border p-1"
                />
              )}
            </div>
          </div>
          {choices.length > 2 && (
            <button
              onClick={() => removeChoice(index)}
              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 self-center text-sm"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
    <button
      onClick={addChoice}
      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mt-4 font-medium"
    >
      + Add Another Choice
    </button>
  </SectionWrapper>
);

const ImageCropModal = ({
  modalState,
  closeModal,
  applyCrop,
  crop,
  setCrop,
  zoom,
  setZoom,
  onCropComplete,
}) => (
  <Modal
    isOpen={modalState.open}
    onRequestClose={closeModal}
    ariaHideApp={false}
    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4"
    overlayClassName="fixed inset-0 z-50"
  >
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full relative">
      <h2 className="text-2xl font-bold mb-4">Crop Image</h2>
      {modalState.src && (
        <div className="relative w-full h-80 bg-gray-200 rounded-md">
          <Cropper
            image={modalState.src}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}
      <div className="flex items-center mt-4 space-x-3">
        <label className="text-sm font-medium">Zoom</label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(e.target.value)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={closeModal}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={applyCrop}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold"
        >
          Apply Crop
        </button>
      </div>
    </div>
  </Modal>
);

// --- Main Component ---

export default function CreateQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();

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
      setLoading(true);
      const fetchDraft = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${host}/api/questions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const q = res.data;

          // --- CORRECTED LOGIC ---
          // Determine the choices array based on fetched data, with a fresh default.
          const choicesForForm =
            q.options && q.options.length > 0
              ? q.options.map((opt) => ({
                  text: opt.text || "",
                  image: opt.image || null,
                }))
              : [
                  // Use a new default array, not the one from the initial state
                  { text: "", image: null },
                  { text: "", image: null },
                ];

          setFormData({
            _id: q._id,
            course: q.course || "",
            grade: q.grade || "",
            subject: q.subject || "",
            chapter: q.chapter || "",
            questionText: q.question?.text || "",
            questionImage: q.question?.image || null,
            choices: choicesForForm, // Use our newly created, correct array
            correctAnswer: q.options?.findIndex((opt) => opt.isCorrect) ?? 0,
            explanation: q.explanation?.text || "",
            explanationImage: q.explanation?.image || null,
            complexity: q.complexity || "Easy",
            keywords: Array.isArray(q.keywords) ? q.keywords.join(", ") : "",
            referenceImage: q.reference?.image || null,
          });
        } catch (err) {
          console.error("Error loading draft", err);
          alert("Failed to load draft.");
        } finally {
          setLoading(false);
        }
      };
      fetchDraft();
    }
    // We add initialFormData to dependencies to avoid stale closures,
    // but since it's stable, it won't cause re-fetches.
  }, [id]);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleChoiceChange = useCallback((index, value) => {
    setFormData((prev) => {
      // Create a new array and update the specific item immutably
      const updatedChoices = prev.choices.map((choice, i) =>
        i === index ? { ...choice, text: value } : choice
      );
      return { ...prev, choices: updatedChoices };
    });
  }, []);

  const addChoice = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      choices: [...prev.choices, { text: "", image: null }],
    }));
  }, []);

  const removeChoice = useCallback((index) => {
    setFormData((prev) => {
      const updatedChoices = prev.choices.filter((_, i) => i !== index);

      // --- CORRECTED LOGIC FOR correctAnswer ---
      // If the removed choice was the correct one, reset to the first choice.
      // If a choice after the correct one was removed, the index is still valid.
      // If a choice before the correct one was removed, decrement the index.
      let newCorrectAnswer = prev.correctAnswer;
      if (index === prev.correctAnswer) {
        newCorrectAnswer = 0;
      } else if (index < prev.correctAnswer) {
        newCorrectAnswer = prev.correctAnswer - 1;
      }

      return {
        ...prev,
        choices: updatedChoices,
        correctAnswer: newCorrectAnswer,
      };
    });
  }, []);

  const handleFileChange = useCallback((e, field, index = null) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropModal({
      open: true,
      src: URL.createObjectURL(file),
      type: field,
      index,
    });
    e.target.value = null;
  }, []);

  const closeModal = () =>
    setCropModal({ open: false, src: null, type: "", index: null });

  const applyCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      setLoading(true);
      const blob = await getCroppedImg(cropModal.src, croppedAreaPixels);
      const croppedFile = new File([blob], "cropped.jpg", {
        type: "image/jpeg",
      });

      if (cropModal.type === "choiceImage") {
        setFormData((prev) => {
          const updatedChoices = prev.choices.map((choice, i) =>
            i === cropModal.index ? { ...choice, image: croppedFile } : choice
          );
          return { ...prev, choices: updatedChoices };
        });
      } else {
        setFormData((prev) => ({ ...prev, [cropModal.type]: croppedFile }));
      }
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [cropModal, croppedAreaPixels]);

  const handleSubmit = useCallback(
    async (type) => {
      setLoading(true);
      try {
        const formPayload = new FormData();
        if (formData._id) formPayload.append("_id", formData._id);

        Object.keys(formData).forEach((key) => {
          if (
            ![
              "choices",
              "questionImage",
              "explanationImage",
              "referenceImage",
            ].includes(key) &&
            formData[key] !== null
          ) {
            formPayload.append(key, formData[key]);
          }
        });
        formPayload.set("status", type === "Draft" ? "Draft" : "Pending");

        if (formData.questionImage instanceof File)
          formPayload.append("questionImage", formData.questionImage);
        if (formData.explanationImage instanceof File)
          formPayload.append("explanationImage", formData.explanationImage);
        if (formData.referenceImage instanceof File)
          formPayload.append("referenceImage", formData.referenceImage);

        if (typeof formData.questionImage === "string")
          formPayload.append("existingQuestionImage", formData.questionImage);
        if (typeof formData.explanationImage === "string")
          formPayload.append(
            "existingExplanationImage",
            formData.explanationImage
          );
        if (typeof formData.referenceImage === "string")
          formPayload.append("existingReferenceImage", formData.referenceImage);

        formData.choices.forEach((choice) => {
          formPayload.append("choicesText[]", choice.text || "");
          if (choice.image instanceof File) {
            formPayload.append("choicesImage", choice.image);
            formPayload.append("hasImage[]", "true");
            formPayload.append("existingChoiceImages[]", "");
          } else if (typeof choice.image === "string") {
            formPayload.append("hasImage[]", "true");
            formPayload.append("existingChoiceImages[]", choice.image);
          } else {
            formPayload.append("hasImage[]", "false");
            formPayload.append("existingChoiceImages[]", "");
          }
        });

        const token = localStorage.getItem("token");
        await axios.post(`${host}/api/questions/create`, formPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        alert(
          `Question ${
            type === "Draft" ? "saved as draft" : "submitted"
          } successfully!`
        );

        navigate("/maker/drafts");
      } catch (err) {
        console.error("Error submitting question:", err);
        alert("An error occurred while saving the question.");
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate]
  );

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto p-8 bg-white rounded-xl shadow-lg relative">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          {id ? "Edit Question" : "Create New Question"}
        </h1>
        <p className="text-gray-500 mb-8 border-b pb-4">
          Fill in all the details to create a comprehensive question.
        </p>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-40 rounded-xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          <QuestionMetadataInputs
            formData={formData}
            handleInputChange={handleInputChange}
          />
          <ContentInputSection
            label="Question"
            textName="questionText"
            textValue={formData.questionText}
            imageValue={formData.questionImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "questionImage")}
          />
          <ChoicesSection
            choices={formData.choices}
            correctAnswer={formData.correctAnswer}
            setFormData={setFormData}
            handleChoiceChange={handleChoiceChange}
            handleFileChange={handleFileChange}
            removeChoice={removeChoice}
            addChoice={addChoice}
          />
          <ContentInputSection
            label="Explanation"
            textName="explanation"
            textValue={formData.explanation}
            imageValue={formData.explanationImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "explanationImage")}
          />

          <SectionWrapper title="Additional Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Complexity
                </label>
                <select
                  value={formData.complexity}
                  onChange={(e) =>
                    setFormData({ ...formData, complexity: e.target.value })
                  }
                  className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  name="keywords"
                  placeholder="e.g. algebra, equations"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </SectionWrapper>

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => handleSubmit("Draft")}
              disabled={loading}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition font-semibold disabled:bg-gray-300"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("Submit")}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-blue-300"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </div>
      {Modal && Cropper && (
        <ImageCropModal
          modalState={cropModal}
          closeModal={closeModal}
          applyCrop={applyCrop}
          crop={crop}
          setCrop={setCrop}
          zoom={zoom}
          setZoom={setZoom}
          onCropComplete={onCropComplete}
        />
      )}
    </div>
  );
}
