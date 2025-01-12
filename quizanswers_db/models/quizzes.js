const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartsSchema = new mongoose.Schema({
    question: String,
    answer: String
})