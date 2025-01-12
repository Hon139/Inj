require('dotenv').config();
const pdfParse = require('pdf-parse');

// Load the API key from the environment variables
const API_KEY = process.env.PERPLEXITY_API_KEY;

// Define the API base URL
const baseURL = "https://api.perplexity.ai";

async function extractTextFromPdf(pdfPath) {
    const fs = require('fs');
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
}

const systemMessage = "You are an artificial intelligence teacher and you need to ask a question based on the text provided by the user.";

async function generateQuiz(text) {
    try {
        const prompt = `I have provided the following text from a lesson:
          ---
          ${text}
          ---
          Please generate a quiz based on this text.`;

        // Build the request payload
        const payload = {
            model: "llama-3.1-sonar-large-128k-online",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
        };

        // Send the POST request using fetch
        const response = await fetch(`${baseURL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // Convert payload to JSON
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the response
        const responseData = await response.json();
        console.log(responseData.choices[0].message.content); // Log the generated quiz
    } catch (error) {
        console.error("Error fetching chat completion:", error.message);
    }
}

// Call the functions
extractTextFromPdf("lesson.pdf")
    .then(text => generateQuiz(text))
    .catch(console.error);
