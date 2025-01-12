import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const App = () => {
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [quizzes, setQuizzes] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setMessage("");
    } else {
      setMessage("Please upload a valid PDF file.");
      setFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file); // Backend expects this field
    formData.append("userID", user.sub); // Send Auth0 user ID

    try {
      const response = await fetch("http://localhost:3000/quizzes", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
      } else {
        setMessage(result.message || "Failed to upload the file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("An error occurred while uploading the file.");
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/quizzes?userID=${user.sub}`
      );
      const result = await response.json();
      setQuizzes(result);
      setMessage("Quizzes fetched successfully.");
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setMessage("Failed to fetch quizzes.");
    }
  };

  /*
  const deleteQuizzes = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/quizzes?userID=${user.sub}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      setQuizzes([]);
      setMessage(result.message);
    } catch (error) {
      console.error("Error deleting quizzes:", error);
      setMessage("Failed to delete quizzes.");
    }
  };

  */
  return (
    <div>
      <h1>Upload PDF to Generate Quizzes</h1>
      {!isAuthenticated ? (
        <button onClick={() => loginWithRedirect()}>Log In / Sign Up</button>
      ) : (
        <>
          <button onClick={() => logout({ returnTo: "http://localhost:5000/callback" })}>
            Log Out
          </button>
          <p>Welcome, {user.name}!</p>
          <p>Your User ID: {user.sub}</p>
          <div>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
            <button onClick={handleFileUpload}>Upload</button>
          </div>
          <button onClick={fetchQuizzes}>Fetch Quizzes</button>
          
          {message && <p>{message}</p>}
          {quizzes.length > 0 && (
            <div>
              <h2>Your Quizzes</h2>
              <ul>
                {quizzes.map((quiz, index) => (
                  <li key={index}>
                    <p>
                      <strong>Question:</strong> {quiz.question}
                    </p>
                    <ul>
                      {quiz.options.map((option, i) => (
                        <li key={i}>{option}</li>
                      ))}
                    </ul>
                    <p>
                      <strong>Correct Answer:</strong>{" "}
                      {quiz.options[quiz.correct]}
                    </p>
                    <p>
                      <strong>Explanation:</strong> {quiz.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
