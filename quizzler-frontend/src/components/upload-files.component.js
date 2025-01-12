import React, { useState } from "react";

const UploadPdf = () => {
  const [message, setMessage] = useState("");

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    // Validate the file
    if (selectedFile && selectedFile.type === "application/pdf") {
      setMessage("Uploading...");

      const formData = new FormData();
      formData.append("pdf", selectedFile); // Matches the backend field name

      try {
        const response = await fetch("http://localhost:3000/quizzes", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (response.ok) {
          setMessage(result.message || "Pdf uploaded successfully!");
        } else {
          setMessage(result.message || "Failed to upload the file.");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setMessage("An error occurred while uploading the file.");
      }
    } else {
      setMessage("Please upload a valid PDF file.");
    }
  };

  return (
    <div>
      <h1>Upload PDF to Database</h1>
      <input type="file" accept="application/pdf" name="pdf" onChange={handleFileChange} />
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadPdf;
