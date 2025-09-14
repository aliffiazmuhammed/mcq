import { useState } from "react";

export default function AcceptedQuestions() {
  const [questions] = useState([
    {
      id: 1,
      text: "What is the capital of France?",
      maker: "John Doe",
      subject: "Geography",
      chapter: "Europe",
      status: "Approved",
      choices: [
        { text: "Paris", image: null },
        { text: "London", image: null },
        { text: "Rome", image: null },
        { text: "Berlin", image: null },
      ],
      correctAnswer: 0,
      explanation: "Paris is the capital city of France.",
      referenceImage: null,
    },
    {
      id: 2,
      text: "Solve 12 × 8",
      maker: "Jane Smith",
      subject: "Math",
      chapter: "Multiplication",
      status: "Approved",
      choices: [
        { text: "90", image: null },
        { text: "96", image: null },
        { text: "108", image: null },
        { text: "84", image: null },
      ],
      correctAnswer: 1,
      explanation: "12 × 8 = 96",
      referenceImage: null,
    },
  ]);

  const [expandedQuestion, setExpandedQuestion] = useState(null);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Approved Questions</h1>

      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white p-4 rounded shadow hover:bg-gray-50 cursor-pointer"
            onClick={() =>
              setExpandedQuestion(expandedQuestion?.id === q.id ? null : q)
            }
          >
            {/* Header: Question + Status */}
            <div className="flex justify-between items-center">
              <p className="font-semibold">{q.text}</p>
              <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                {q.status}
              </span>
            </div>

            {/* Expanded Details */}
            {expandedQuestion?.id === q.id && (
              <div className="mt-4 border-t pt-4 space-y-3">
                <p>
                  <span className="font-semibold">Maker:</span> {q.maker}
                </p>
                <p>
                  <span className="font-semibold">Subject:</span> {q.subject}
                </p>
                <p>
                  <span className="font-semibold">Chapter:</span> {q.chapter}
                </p>
                <p>
                  <span className="font-semibold">Question:</span> {q.text}
                </p>

                {/* Choices */}
                <div>
                  <p className="font-semibold">Choices:</p>
                  <ul className="list-decimal list-inside">
                    {q.choices.map((c, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {c.text}
                        {q.correctAnswer === idx && (
                          <span className="text-green-600 font-bold">
                            (Correct)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Explanation */}
                <p>
                  <span className="font-semibold">Explanation:</span>{" "}
                  {q.explanation}
                </p>

                {/* Reference Image */}
                {q.referenceImage && (
                  <img
                    src={URL.createObjectURL(q.referenceImage)}
                    alt="Reference"
                    className="max-h-48 mt-2"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
