const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quizSchema = new mongoose.Schema({
    question: String,
    options: Array,
    correct: Number,
    explanation: String,
});

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;