import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { getCroppedImg } from "../../utils/cropImage"; // Assuming this utility exists
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes"; // Assuming this utility exists

// Helper to get the correct URL for image previews (handles both File objects and URL strings)
const getImagePreviewUrl = (image) => {
  if (!image) return null;
  if (image instanceof File) {
    return URL.createObjectURL(image);
  }
  return image; // It's already a URL string from the backend
};

// --- Sub-Components ---

const SectionWrapper = ({ title, children }) => (
  <fieldset className="border border-gray-200 p-6 rounded-lg mb-6">
    <legend className="text-lg font-semibold px-2 text-gray-700">
      {title}
    </legend>
    <div className="space-y-4">{children}</div>
  </fieldset>
);

// NEW: Component for Question Paper Details
const QuestionPaperDetailsInputs = ({
  formData,
  handleInputChange,
  questionPapers,
}) => (
  <SectionWrapper title="Question Paper Details">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Select Question Paper
        </label>
        <select
          name="questionPaper"
          value={formData.questionPaper}
          onChange={handleInputChange}
          className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
        >
          <option value="">None</option>
          {questionPapers.map((paper) => (
            <option key={paper._id} value={paper._id}>
              {paper.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Question Number
        </label>
        <input
          type="text"
          name="questionNumber"
          placeholder="e.g., 1a, II.3"
          value={formData.questionNumber}
          onChange={handleInputChange}
          className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>
    </div>
  </SectionWrapper>
);

const QuestionMetadataInputs = ({ formData, handleInputChange, courses }) => (
  <SectionWrapper title="Question Classification">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {["course", "subject", "unit", "chapter"].map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
            {field}
          </label>
          {field === "course" ? (
            <select
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course._id} value={course.title}>
                  {course.title}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name={field}
              placeholder={`Enter ${field} name...`}
              value={formData[field]}
              onChange={handleInputChange}
              className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          )}
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
  onRemoveImage,
}) => {
  const fileInputId = `${textName}-file-input`;

  return (
    <SectionWrapper title={label}>
      <textarea
        name={textName}
        placeholder={`${label} content...`}
        value={textValue}
        onChange={onTextChange}
        className="border border-gray-300 px-3 py-2 rounded-md w-full h-28 focus:ring-2 focus:ring-blue-500 transition"
      />
      <div className="flex items-center gap-4">
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <label
          htmlFor={fileInputId}
          className="cursor-pointer bg-blue-50 text-blue-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-blue-100 transition"
        >
          {`Upload ${label} Diagram`}
        </label>
        {imageValue && (
          <div className="relative">
            <img
              src={getImagePreviewUrl(imageValue)}
              alt={`${label} Preview`}
              className="rounded-md h-24 w-auto object-contain border p-1"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

const ChoicesSection = ({
  choices,
  correctAnswer,
  setFormData,
  handleChoiceChange,
  handleFileChange,
  removeChoice,
  addChoice,
  onRemoveChoiceImage,
}) => (
  <SectionWrapper title="Answer Choices">
    <div className="space-y-4">
      {choices.map((choice, index) => {
        const choiceFileInputId = `choice-image-input-${index}`;
        return (
          <div
            key={index}
            className="flex items-start gap-4 border p-4 rounded-md bg-gray-50"
          >
            <span className="text-gray-500 font-semibold mt-2.5">
              {index + 1}.
            </span>
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
                  id={choiceFileInputId}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "choiceImage", index)}
                  className="hidden"
                />
                <label
                  htmlFor={choiceFileInputId}
                  className="cursor-pointer bg-gray-100 text-gray-700 font-semibold text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition"
                >
                  Upload Choice diagram
                </label>
                {choice.image && (
                  <div className="relative">
                    <img
                      src={getImagePreviewUrl(choice.image)}
                      alt={`Choice ${index + 1} Preview`}
                      className="rounded h-16 w-auto object-contain border p-1"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveChoiceImage(index)}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition"
                      aria-label="Remove choice image"
                    >
                      &times;
                    </button>
                  </div>
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
        );
      })}
    </div>
    <div className="mt-6 pt-4 border-t">
      <label
        htmlFor="correct-answer-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Select Correct Answer
      </label>
      <select
        id="correct-answer-select"
        value={correctAnswer}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            correctAnswer: parseInt(e.target.value, 10),
          }))
        }
        className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500"
      >
        <option value={-1}>None (No correct answer)</option>
        {choices.map((_, index) => (
          <option key={index} value={index}>
            Option {index + 1}
          </option>
        ))}
      </select>
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

  // UPDATED: Added questionPaper and questionNumber to initial state
  const initialFormData = {
    course: "",
    subject: "",
    unit: "",
    chapter: "",
    questionPaper: "",
    questionNumber: "",
    FrequentlyAsked: false,
    questionText: "",
    questionImage: null,
    choices: [
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
    ],
    correctAnswer: -1,
    explanation: "",
    explanationImage: null,
    complexity: "Easy",
    keywords: "",
    referenceImage: null,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [courses, setCourses] = useState([]);
  const [questionPapers, setQuestionPapers] = useState([]); // ADDED: State for claimed papers
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

  // Fetch courses and claimed question papers on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${host}/api/questions/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };

    const fetchClaimedPapers = async () => {
      try {
        // ASSUMPTION: This endpoint returns question papers claimed by the logged-in maker
        const res = await axios.get(`${host}/api/questions/papers/makerclaimed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestionPapers(res.data);
      } catch (err) {
        console.error("Failed to fetch claimed question papers:", err);
      }
    };

    fetchCourses();
    fetchClaimedPapers();
  }, []);

  // Fetch existing question data if editing
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
          const choicesForForm =
            q.options && q.options.length > 0
              ? q.options.map((opt) => ({
                  text: opt.text || "",
                  image: opt.image || null,
                }))
              : initialFormData.choices;

          // UPDATED: Populate all fields, including new ones
          setFormData({
            _id: q._id,
            course: q.course?.title || "", 
            subject: q.subject || "",
            unit: q.unit || "",
            chapter: q.chapter || "",
            questionPaper: q.questionPaper?._id || "", 
            questionNumber: q.questionNumber || "",
            FrequentlyAsked: q.FrequentlyAsked || false,
            questionText: q.question?.text || "",
            questionImage: q.question?.image || null,
            choices: choicesForForm,
            correctAnswer: q.options?.findIndex((opt) => opt.isCorrect) ?? -1,
            explanation: q.explanation?.text || "",
            explanationImage: q.explanation?.image || null,
            complexity: q.complexity || "Easy",
            keywords: Array.isArray(q.keywords) ? q.keywords.join(", ") : "",
            referenceImage: q.reference?.image || null,
          });
        } catch (err) {
          console.error("Error loading draft", err);
        } finally {
          setLoading(false);
        }
      };
      fetchDraft();
    }
  }, [id]);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleChoiceChange = useCallback((index, value) => {
    setFormData((prev) => {
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
      let newCorrectAnswer = prev.correctAnswer;
      if (index === prev.correctAnswer) {
        newCorrectAnswer = -1;
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

    const handleRemoveImage = useCallback((fieldName) => {
      setFormData((prev) => ({ ...prev, [fieldName]: null }));
    }, []);

    const handleRemoveChoiceImage = useCallback((index) => {
      setFormData((prev) => {
        const updatedChoices = prev.choices.map((choice, i) =>
          i === index ? { ...choice, image: null } : choice
        );
        return { ...prev, choices: updatedChoices };
      });
    }, []);


  const handleSubmit = useCallback(
    async (type) => {
      setLoading(true);
      try {
        const formPayload = new FormData();
        if (formData._id) formPayload.append("_id", formData._id);

        // Append all fields except images and choices
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
            // Append questionPaper only if it has a value
            if (key === "questionPaper" && !formData[key]) return;
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

        console.log(
          `Question ${
            type === "Draft" ? "saved as draft" : "submitted"
          } successfully!`
        );

        navigate("/maker/drafts");
      } catch (err) {
        console.error("Error submitting question:", err);
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate]
  );

  console.log(formData)
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto p-6 sm:p-8 bg-white rounded-xl shadow-lg relative">
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
          {/* ADDED the new component here */}
          <QuestionPaperDetailsInputs
            formData={formData}
            handleInputChange={handleInputChange}
            questionPapers={questionPapers}
          />

          <QuestionMetadataInputs
            formData={formData}
            handleInputChange={handleInputChange}
            courses={courses}
          />
          <ContentInputSection
            label="Question"
            textName="questionText"
            textValue={formData.questionText}
            imageValue={formData.questionImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "questionImage")}
            onRemoveImage={() => handleRemoveImage("questionImage")}
          />
          <ChoicesSection
            choices={formData.choices}
            correctAnswer={formData.correctAnswer}
            setFormData={setFormData}
            handleChoiceChange={handleChoiceChange}
            handleFileChange={handleFileChange}
            removeChoice={removeChoice}
            addChoice={addChoice}
            onRemoveChoiceImage={handleRemoveChoiceImage}
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
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleInputChange}
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
            <div className="mt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="FrequentlyAsked"
                  checked={formData.FrequentlyAsked}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mark as a frequently asked question
                </span>
              </label>
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
