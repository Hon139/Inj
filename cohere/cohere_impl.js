const dotenv = require('dotenv');
const PdfParse = require('pdf-parse');
const { CohereClientV2 } = require('cohere-ai');
const fs = require('fs');
dotenv.config();
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
        let systemMessage = "You are an artificial intelligence teacher that needs to teach students the topics related to the text you are given. List all multiple-choice questions first by saying Questions: and then the question number followed by all multiple choice options starting with a). Then, write Answers:. After that, output the index of the correct answer for the first question. For example, if the correct answer is b), then output Index: 2. In addition, give a thorough and polite explanation of the answer starting with Explanation: and then your explanation. Do this for all questions one at a time.";
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

        //console.log(response.message.content);
        return response.message.content;

    } catch (error) {
        console.error("Error generating quiz:", error.message);
        return null;
    }
}

// Function to parse the quiz once the data is in the database
async function parseQuiz(aiResponse) {
    const textFields = aiResponse.map(item => item.text).join("\n");
    if (typeof textFields !== "string") {
        throw new Error("AI response is not a string.");
    }
    const [questionsPart, answersPart] = textFields.split("Answers:");      // Assume response will be separated by Answers: into questions and answers

    const questions = questionsPart
        .trim()
        .split("\n")
        .filter((line) => line) // Remove empty lines
        .map((question) => question.trim());

    const answers = answersPart
        ? answersPart
            .trim()
            .split("\n")
            .filter((line) => line) // Remove empty lines
            .map((answer) => answer.trim()) : [];
    let correctAnswerIndex = null;
    let explanation = "";
    const quizEntries = questions.map((questionBlock, index) => {
        const [questionText, ...options] = questionBlock
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const choices = options.reduce((acc, option) => {
            const match = option.match(/^[a-d]\)\s+(.*)/); // match it to a) option text
            if (match) {
                acc[match[1]] = match[2];
            }
            return acc;
        }, {});

        // Extract correct answer index
        
        if (correctAnswerIndex === null) {
            const correctAnswerMatch = answers[index]?.match(/Index:\s+(\d+)/);
            correctAnswerIndex = correctAnswerMatch ? parseInt(correctAnswerMatch[1], 10) : null;
        }

        // Extract explanation
        if (explanation === "") {
            const explanationMatch = answers[index]?.match(/Explanation:\s+(.*)/);
            explanation = explanationMatch ? explanationMatch[1] : "";
            
        }
        //console.log(correctAnswerIndex);
        //console.log(explanation);
        // Stop processing if any value is not null or empty
        if (questionText && Object.keys(choices).length > 0 && correctAnswerIndex !== null && explanation) {
            return {
                question: questionText,
                options: choices,
                correctAnswerIndex, // Index of the correct answer
                explanation, // Explanation for the correct answer
            };
        }
        return null;
    }).filter(entry => entry !== null);


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

        const quizData = {
            quizzes: allQuizzes,
        };

        // send it to database
        // await sendToDatabase(quizData);
        console.log("All quizzes successfully sent.");
    } catch (error) {
        console.error("Error processing document:", error.message);
    }
}

// Call the functions
processDoc("lesson.pdf");