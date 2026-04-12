const mongoose = require("mongoose");

const QuestionSchema = mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], default: [] },
  answer: { type: String, required: true }
});

module.exports = mongoose.model("Question", QuestionSchema);
