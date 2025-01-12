import React, { useState } from "react";

const UploadPdf = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [quizzes, setQuizzes] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Store the selected file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a PDF file to upload.");
      return;
    }

    // Create FormData to send the file
    const formData = new FormData();
    formData.append("file", file); // Ensure the key matches the backend field name in `upload.single("file")`

    try {
      const response = await fetch("http://localhost:3000/quizzes", {
        method: "POST",
        body: formData, // Attach the form data
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message); // "Quizzes generated successfully"
        setQuizzes(result.quizzes); // Store the generated quizzes
      } else {
        setMessage(result.message || "Failed to upload the file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("An error occurred while uploading the file.");
    }
  };

  return (
    <div>
      <h1>Upload PDF to Generate Quizzes</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button type="submit">Upload and Generate</button>
      </form>
      {message && <p>{message}</p>}
      {quizzes.length > 0 && (
        <div>
          <h2>Generated Quizzes:</h2>
          <ul>
            {quizzes.map((quiz, index) => (
              <li key={index}>
                <strong>Question:</strong> {quiz.question}
                <br />
                <strong>Options:</strong> {quiz.options.join(", ")}
                <br />
                <strong>Answer:</strong> {quiz.options[quiz.correctAnswerIndex]}
                <br />
                <strong>Explanation:</strong> {quiz.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadPdf;
