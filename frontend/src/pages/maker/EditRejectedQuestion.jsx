import { useState, useCallback, useEffect } from "react";
import Cropper from "https://esm.sh/react-easy-crop";
import Modal from "https://esm.sh/react-modal";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { host } from "../../utils/APIRoutes";

// --- Utility Functions ---

function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = (error) => reject(error);
  });
}

const getImagePreviewUrl = (image) => {
  if (!image) return null;
  if (image instanceof File) return URL.createObjectURL(image);
  return image;
};

// --- Helper Sub-Components ---

const SectionWrapper = ({ title, children }) => (
  <fieldset className="border border-gray-200 p-6 rounded-lg mb-6">
    <legend className="text-lg font-semibold px-2 text-gray-700">
      {title}
    </legend>
    <div className="space-y-4">{children}</div>
  </fieldset>
);

const QuestionPaperDetailsInputs = ({
  formData,
  questionPapers,
  onPaperSelect,
}) => (
  <SectionWrapper title="Question Paper Details">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Select Question Paper
        </label>
        <select
          name="questionPaper"
          value={formData.questionPaper}
          onChange={onPaperSelect}
          className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500"
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
          Course
        </label>
        <input
          type="text"
          name="course"
          value={formData.course}
          readOnly
          className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          readOnly
          className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Question Paper Year
        </label>
        <input
          type="text"
          name="questionPaperYear"
          value={formData.questionPaperYear}
          readOnly
          className="border border-gray-300 px-3 py-2 rounded-md w-full bg-gray-100"
        />
      </div>
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
  children,
}) => {
  const fileInputId = `${textName}-file-input`;
  return (
    <SectionWrapper title={label}>
      {children}
      <textarea
        name={textName}
        placeholder={`${label} content...`}
        value={textValue}
        onChange={onTextChange}
        className="border border-gray-300 px-3 py-2 rounded-md w-full h-28 focus:ring-2 focus:ring-blue-500"
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
          className="cursor-pointer bg-blue-50 text-blue-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-blue-100"
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
              className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700"
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
                  className="cursor-pointer bg-gray-100 text-gray-700 font-semibold text-sm px-3 py-1 rounded-full hover:bg-gray-200"
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
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700"
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
        <option value={-1}>None</option>
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

const ImageUploader = ({
  label,
  imageValue,
  onFileChange,
  onRemoveImage,
  fieldName,
}) => {
  const fileInputId = `${fieldName}-input`;
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e, fieldName)}
          className="hidden"
        />
        <label
          htmlFor={fileInputId}
          className="cursor-pointer bg-blue-50 text-blue-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-blue-100"
        >
          Upload Image
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
              onClick={() => onRemoveImage(fieldName)}
              className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ReferenceImagesSection = ({
  imageValue1,
  imageValue2,
  onFileChange,
  onRemoveImage,
}) => (
  <SectionWrapper title="Reference Images">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ImageUploader
        label="Reference Image 1"
        imageValue={imageValue1}
        onFileChange={onFileChange}
        onRemoveImage={onRemoveImage}
        fieldName="referenceImage1"
      />
      <ImageUploader
        label="Reference Image 2"
        imageValue={imageValue2}
        onFileChange={onFileChange}
        onRemoveImage={onRemoveImage}
        fieldName="referenceImage2"
      />
    </div>
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

const NotificationModal = ({ isOpen, message, onClose }) => {
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

// --- Main Edit Rejected Question Component ---

export default function EditRejectedQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const commentOptions = ["Corrections done", "No corrections required"];

  const initialFormData = {
    course: "",
    subject: "",
    unit: "",
    questionPaper: "",
    questionPaperYear: "",
    questionNumber: "",
    FrequentlyAsked: false,
    questionText: "",
    questionImage: null,
    choices: Array(4).fill({ text: "", image: null }),
    correctAnswer: -1,
    explanation: "",
    explanationImage: null,
    complexity: "Easy",
    keywords: "",
    referenceImage1: null,
    referenceImage2: null,
    checkerComments: "",
    makerCommentIndex: -1,
    makerCommentText: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [cropModal, setCropModal] = useState({
    open: false,
    src: null,
    type: "",
    index: null,
  });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    if (id) {
      const fetchQuestion = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${host}/api/questions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const q = res.data;
          const choicesForForm =
            q.options?.length > 0
              ? q.options.map((opt) => ({
                  text: opt.text || "",
                  image: opt.image || null,
                }))
              : initialFormData.choices;

          setFormData({
            _id: q._id,
            course: q.course?.title || "",
            subject: q.subject || "",
            unit: q.unit || "",
            questionPaper: q.questionPaper?._id || "",
            questionPaperYear: q.questionPaperYear || "",
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
            referenceImage1: q.reference?.image1 || null,
            referenceImage2: q.reference?.image2 || null,
            checkerComments: q.checkerComments || "",
            makerCommentIndex: -1,
            makerCommentText: "",
          });
        } catch (err) {
          console.error("Error loading rejected question", err);
          setNotification({
            isOpen: true,
            message: "Failed to load question data.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchQuestion();
    }
  }, [id]);

  const onCropComplete = useCallback(
    (_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels),
    []
  );

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

  const handleRemoveImage = useCallback(
    (fieldName) => setFormData((prev) => ({ ...prev, [fieldName]: null })),
    []
  );

  const handleRemoveChoiceImage = useCallback((index) => {
    setFormData((prev) => {
      const updatedChoices = prev.choices.map((choice, i) =>
        i === index ? { ...choice, image: null } : choice
      );
      return { ...prev, choices: updatedChoices };
    });
  }, []);

  const handleCommentChange = useCallback(
    (e) => {
      const index = parseInt(e.target.value, 10);
      const text = index >= 0 ? commentOptions[index] : "";
      setFormData((prev) => ({
        ...prev,
        makerCommentIndex: index,
        makerCommentText: text,
      }));
    },
    [commentOptions]
  );

  const handleSubmit = useCallback(async () => {
    if (formData.makerCommentIndex < 0) {
      setNotification({
        isOpen: true,
        message:
          "Please select a response in the comments section before submitting.",
      });
      return;
    }

    setLoading(true);
    try {
      const formPayload = new FormData();
      if (formData._id) formPayload.append("_id", formData._id);

      Object.keys(formData).forEach((key) => {
        const BANNED_KEYS = [
          "choices",
          "questionImage",
          "explanationImage",
          "referenceImage1",
          "referenceImage2",
          "checkerComments",
        ];
        if (!BANNED_KEYS.includes(key) && formData[key] !== null) {
          if (key === "makerCommentText") {
            formPayload.append("makerComments", formData[key]);
          } else {
            formPayload.append(key, formData[key]);
          }
        }
      });

      formPayload.set("status", "Pending");

      if (formData.questionImage instanceof File)
        formPayload.append("questionImage", formData.questionImage);
      if (formData.explanationImage instanceof File)
        formPayload.append("explanationImage", formData.explanationImage);
      if (formData.referenceImage1 instanceof File)
        formPayload.append("referenceImage1", formData.referenceImage1);
      if (formData.referenceImage2 instanceof File)
        formPayload.append("referenceImage2", formData.referenceImage2);

      if (typeof formData.questionImage === "string")
        formPayload.append("existingQuestionImage", formData.questionImage);
      if (typeof formData.explanationImage === "string")
        formPayload.append(
          "existingExplanationImage",
          formData.explanationImage
        );
      if (typeof formData.referenceImage1 === "string")
        formPayload.append("existingReferenceImage1", formData.referenceImage1);
      if (typeof formData.referenceImage2 === "string")
        formPayload.append("existingReferenceImage2", formData.referenceImage2);

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

      navigate("/maker/submitted");
    } catch (err) {
      console.error("Error resubmitting question:", err);
      setNotification({
        isOpen: true,
        message: "Failed to resubmit question. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, navigate]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto p-6 sm:p-8 bg-white rounded-xl shadow-lg relative">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Edit Rejected Question
        </h1>
        <p className="text-gray-500 mb-8 border-b pb-4">
          Review the feedback, make your corrections, and resubmit for approval.
        </p>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-40 rounded-xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          <QuestionPaperDetailsInputs
            formData={formData}
            questionPapers={questionPapers}
            onPaperSelect={handleInputChange}
          />

          <ContentInputSection
            label="Question"
            textName="questionText"
            textValue={formData.questionText}
            imageValue={formData.questionImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "questionImage")}
            onRemoveImage={() => handleRemoveImage("questionImage")}
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Question Number
              </label>
              <input
                type="text"
                name="questionNumber"
                placeholder="e.g., 1a, II.3"
                value={formData.questionNumber}
                onChange={handleInputChange}
                className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-1/2"
              />
            </div>
          </ContentInputSection>

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

          <ReferenceImagesSection
            imageValue1={formData.referenceImage1}
            imageValue2={formData.referenceImage2}
            onFileChange={handleFileChange}
            onRemoveImage={handleRemoveImage}
          />

          <ContentInputSection
            label="Explanation"
            textName="explanation"
            textValue={formData.explanation}
            imageValue={formData.explanationImage}
            onTextChange={handleInputChange}
            onFileChange={(e) => handleFileChange(e, "explanationImage")}
            onRemoveImage={() => handleRemoveImage("explanationImage")}
          />

          <SectionWrapper title="Additional Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  placeholder="Enter unit name..."
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="border border-gray-300 px-3 py-2 rounded-md w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Complexity
                </label>
                <select
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleInputChange}
                  className="border border-gray-300 px-3 py-2 rounded-md w-full"
                >
                  <option>Easy</option> <option>Medium</option>{" "}
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
                  className="border border-gray-300 px-3 py-2 rounded-md w-full"
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

          <SectionWrapper title="Review & Comments">
            <div>
              <label className="block text-sm font-semibold text-red-700 mb-1">
                Checker's Rejection Comments
              </label>
              <p className="text-md text-red-800 bg-red-50 p-4 rounded-md mt-1 whitespace-pre-wrap">
                {formData.checkerComments || "No comments were provided."}
              </p>
            </div>
            <div className="pt-4 border-t">
              <label
                htmlFor="maker-comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Response <span className="text-red-500">*</span>
              </label>
              <select
                id="maker-comment"
                name="makerCommentIndex"
                value={formData.makerCommentIndex}
                onChange={handleCommentChange}
                className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500"
              >
                <option value={-1} disabled>
                  -- Select a response --
                </option>
                {commentOptions.map((text, index) => (
                  <option key={index} value={index}>
                    {text}
                  </option>
                ))}
              </select>
            </div>
          </SectionWrapper>

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition font-semibold disabled:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-blue-300"
            >
              Resubmit for Approval
            </button>
          </div>
        </form>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        onClose={() => setNotification({ isOpen: false, message: "" })}
      />
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
    </div>
  );
}
