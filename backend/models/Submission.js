const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  studentId: { 
    type: String,  
    required: true
  },
  teacherId: {
    type: String,  
    required: true
  },
  courseName: {
    type: String
  },
  examTitle: {
    type: String
  },
  score: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: "completed"
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Submission", SubmissionSchema);
