const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
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
        let systemMessage = "You are a teacher creating test problems, and you will receive blocks from lessons, and you need to create problems from these. Attempt to write latex as plaintext.";
        const prompt = `This is Block ${blockIndex + 1} from a lesson:
          ---
          ${block}  // Limit input to Cohere's token limit
          ---
          Please generate a test with 2 multiple-choice questions (4 options each) based on this text. Keep the questions, options and answers relatively short but ensure that all needed context is present in the question, for example things like "what is the main idea of the passage" should not be asked. Ensure no answer indicators (e.g., a), b), c), d)) are present in the options, only the needed text.
          It should be JSON array with questions being the root, leading a list of questions with question, options, correct answer (0-indexed), and an explanation for the answer. Do not put markers like a), b), c), d), A), B), C), D), A, B, C, D before an option and do not number the questions.`;

        // Send the POST request using fetch
        const response = await client.chat({
            model: "command-r7b-12-2024",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
            ],
            responseFormat: {
                "type": "json_object",
                "schema": {
                    "type": "object",
                    "properties": {
                        "questions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "question": {"type": "string"},
                                    "options": {
                                        "type": "array",
                                        "items": {"type": "string"},    
                                    },
                                    "correct": {"type": "integer"},
                                    "explanation": {"type": "string"}
                                },
                                "required": ["question", "options", "correct", "explanation"]
                            }
                        }
                    },
                    "required": ["questions"]
                }
            }
        });

        console.log(response.message.content[0].text);
        return JSON.parse(response.message.content[0].text);

    } catch (error) {
        console.error("Error generating quiz:", error.message);
        return null;
    }
}

// Function to parse the quiz once the data is in the database
async function parseQuiz(aiResponse, userID) {
    /*
    const textFields = aiResponse.map(item => item.text).join("\n");
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
      const questionText = lines[0]; // First line is the question
      const options = [];
      const optionRegex = /^[a-d]\)\s+(.*)/i;
  
      lines.slice(1).forEach((line) => {
        const match = line.match(optionRegex);
        if (match) {
          options.push(match[1]); // Extract option text (e.g., "Paris")
        }
      });
  
      // Extract correct answer index
      const correctAnswerMatch = answersPart.match(/Index:\s+(\d+)/);
      const correctAnswerIndex = correctAnswerMatch ? parseInt(correctAnswerMatch[1], 10) : null;
  
      // Extract explanation
      const explanationMatch = answersPart.match(/Explanation:\s+(.*)/);
      const explanation = explanationMatch ? explanationMatch[1] : "Explanation not provided";
      return {
        userID: userID,
        question: questionText,
        options,
        correct: correctAnswerIndex, // Index of the correct answer
        explanation, // Explanation for the correct answer
      };
     
    });
    */
   let quizzes = new Array();
   aiResponse.questions.forEach(element => {
    quizzes.push({
        userID: userID,
        question: element.question,
        options: element.options,
        correct: element.correct,
        explanation: element.explanation
    });
   });
    return quizzes;
}

async function processDoc(pdfPath, userID) {
    try {
        const text = await extractTextFromPdf(pdfPath);
        const blocks = splitText(text, 2000);

        const allQuizzes = [];
        for (let i = 0; i < blocks.length; i++) {
            const quiz = await generateQuiz(blocks[i], i);
            if (quiz) {
                let parsedQuiz = await parseQuiz(quiz, userID);
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

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// connect to mongodb
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, "Mongodb connection error:"));
db.once("open", () => {
    console.log("Connected to mongodb");
});

const upload = multer({ dest: "uploads/" });

// REST API to POST the PDF file and process it
app.post("/quizzes", upload.single("file"), async(req, res) => {
    try {
        const pdfPath = req.file.path;
        const userID = req.body.userID;
        const savedQuizzes = await processDoc(pdfPath, userID);
        res.json({message: "Quizzes generated successfully", quizzes: savedQuizzes});
    } catch (error) {
        console.error("Error processing document:", error.message);
        res.status(500).json({message: "Failed to generate quizzes"});
    }
});

// REST API to GET all quizzes for a specific user
app.get("/quizzes", async (req, res) => {
    try {
        const userID = req.query.userID;
        const quizzes = await Quiz.find({ userID: userID });
        console.log("Quizzes fetched successfully", quizzes);
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch quizzes" });
    }
});

// REST API to DELETE all quizzes for a specific user
app.delete("/quizzes", async (req, res) => {
    try {
        const userID = req.query.userID;
        const result = await Quiz.deleteMany({ userID: userID });
        console.log("Quizzes deleted successfully", result);
        res.json({ message: "Quizzes deleted successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete quizzes" });
    }
});

// Call the functions
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

//processDoc("lesson.pdf");