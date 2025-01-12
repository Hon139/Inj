const dotenv = require('dotenv');
const express = require('express');
const PdfParse = require('pdf-parse');
const bodyParser = require('body-parser');
const multer = require('multer');
const { CohereClientV2 } = require('cohere-ai');      
const mongoose = require('mongoose');
const fs = require('fs');
const Quiz = require('./models/quizzes');
dotenv.config();

const app = express();
const port = 3000;

// Load the API key from the environment variables
// get quiz questions, make quiz questions
const client = new CohereClientV2({ token: process.env.COHERE_API_KEY });
async function extractTextFromPdf(pdfPath) {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await PdfParse(dataBuffer);
    return pdfData.text;
}

function splitText(text, blockSize) {
    const blocks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + blockSize, text.length);

        // Avoid splitting in the middle of a word
        const block = text.slice(start, end).replace(/\s+\S*$/, "");    // Remove trailing whitespace
        blocks.push(block);

        start = end;
    }

    return blocks;
}


async function generateQuiz(block, blockIndex) {
    try {
        let systemMessage = "You are an artificial intelligence teacher that needs to teach students the topics related to the text you are given. List all multiple-choice questions first by saying Questions: followed by all multiple choice options starting with a). After that, output the index of the correct answer for the first question. For example, if the correct answer is b), then output Index: 2. In addition, give a thorough and polite explanation of the answer starting with Explanation: and then your explanation. Do this for all questions one at a time. DO NOT put extra newline characters on otherwise empty lines.";
        const prompt = `This is Block ${blockIndex + 1} from a lesson:
          ---
          ${block}  // Limit input to Cohere's token limit
          ---
          Please generate a quiz with 2 multiple-choice questions (4 options each) based on this text.`;

        // Send the POST request using fetch
        const response = await client.chat({
            model: "command-r-08-2024",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
            ],
        });

        console.log(response.message.content);
        return response.message.content;

    } catch (error) {
        console.error("Error generating quiz:", error.message);
        return null;
    }
}

// Function to parse the quiz once the data is in the database
async function parseQuiz(aiResponse) {
    const textFields = aiResponse.map(item => item.text).join("");
    if (!textFields || typeof textFields !== "string") {
      throw new Error("AI response is not a string or is empty.");
    }
    
    // Split AI response into questions and answers sections
    const [questionsPart, answersPart] = textFields.split("Answers:");
  
    // Extract questions
    const questionBlocks = questionsPart
      .trim()
      .split("\n\n") // Split by double newlines for each question block
      .map((block) => block.trim())
      .filter((block) => block.length > 0);
  
    // Process each question block
    const quizEntries = questionBlocks.map((block, index) => {
      const lines = block.split("\n").map((line) => line.trim());
  
      // Extract question text (first line) and options (remaining lines)
      let questionText = lines[0]; // First line is the question
      if(questionText = "Questions:"){
        questionText = lines[1];
      }
      const options = [];
      const optionRegex = /^[a-d]\)\s+(.*)/i;
  
      lines.slice(1).forEach((line) => {
        const match = line.match(optionRegex);
        if (match) {
          options.push(match[1]);
        }
      });
  
      // Extract correct answer index
      const correctAnswerMatch = answersPart.match(/Index:\s+(\d+)/);
      const correctAnswerIndex = correctAnswerMatch ? parseInt(correctAnswerMatch[1], 10) : null;
  
      // Extract explanation
      const explanationMatch = answersPart.match(/Explanation:\s+(.*)/);
      const explanation = explanationMatch ? explanationMatch[1] : "Explanation not provided";
  
      return {
        question: questionText,
        options,
        correct: correctAnswerIndex, // Index of the correct answer
        explanation, // Explanation for the correct answer
      };
    });
  
    return quizEntries;
}

async function processDoc(pdfPath) {
    try {
        const text = await extractTextFromPdf(pdfPath);
        const blocks = splitText(text, 2000);

        const allQuizzes = [];
        for (let i = 0; i < blocks.length; i++) {
            const quiz = await generateQuiz(blocks[i], i);
            if (quiz) {
                const parsedQuiz = await parseQuiz(quiz);
                allQuizzes.push(...parsedQuiz);
            }
        }

        const savedQuizzes = await Quiz.insertMany(allQuizzes);
        console.log("Quizzes saved to the database", savedQuizzes);

        return savedQuizzes;
    } catch (error) {
        console.error("Error processing document:", error.message);
        throw error;
    }
}

async function fetchQuizzes() {
    try {
        const quizzes = await Quiz.find();
        console.log("Quizzes fetched from the database", quizzes);
        return quizzes;
    } catch (error) {
        console.error("Error fetching quizzes:", error.message);
        throw error;
    }
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// connect to mongodb
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, "Mongodb connection error:"));
db.once("open", () => {
    console.log("Connected to mongodb");
});

const upload = multer({ dest: "uploads/" });

// REST API to POST the PDF file and process it
app.post("/quizzes", upload.single("pdf"), async(req, res) => {
    try {
        // Check if a file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Validate file extension
        const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
        if (fileExtension !== "pdf") {
            return res.status(400).json({ message: "Invalid file type. Please upload a PDF file." });
        }
        const pdfPath = req.file.path;
        const savedQuizzes = await processDoc(pdfPath);
        res.json({message: "Quizzes generated successfully", quizzes: savedQuizzes});
    } catch (error) {
        console.error("Error processing document:", error.message);
        res.status(500).json({message: "Failed to generate quizzes"});
    }

    
});

// REST API to GET all quizzes
app.get("/quizzes", async (req, res) => {
    try {
        const quizzes = await fetchQuizzes();
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({message: "Failed to fetch quizzes"});
    }
});

// Call the functions
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

//processDoc("lesson.pdf");