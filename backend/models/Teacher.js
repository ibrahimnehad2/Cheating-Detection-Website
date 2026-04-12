const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  teacher_id: {
    type: Number,
    required: true,
    unique: true
  },
  name: { type: String },
  password: { type: String, required: true },
  courses: [{
    name: String,
    exams: [{
      title: String,
      published: { type: Boolean, default: false },
      startDate: Date,
      timeLimit: Number,
      questions: [{
        questionText: String,
        options: [String],
        answer: String
      }]
    }]
  }]
});

module.exports = mongoose.model("Teacher", teacherSchema);
