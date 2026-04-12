const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  stud_id: {
    type: Number,
    required: true,
    unique: true
  },
  name: { type: String },
  password: { type: String, required: true },
  courses: [
    {
      name: String,
      teacherId: String,
      teacherName: String
    }
  ]
});

module.exports = mongoose.model("Student", studentSchema);
