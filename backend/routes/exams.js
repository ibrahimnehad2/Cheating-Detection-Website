const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");
const Submission = require("../models/Submission");
const Student = require("../models/Student");
const fetchStudent = require("../middleware/fetchStudent");

router.get("/by-course", async (req, res) => {
  try {
    let { teacherId, courseName } = req.query;
    if (!teacherId || !courseName) {
      return res.status(400).json({ error: "Missing teacherId or courseName" });
    }

    courseName = courseName.trim();

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const courseObj = teacher.courses.find(
      (c) => c.name.trim().toLowerCase() === courseName.toLowerCase()
    );
    if (!courseObj) {
      return res.status(404).json({ error: "Course not found for this teacher" });
    }

    const publishedExams = courseObj.exams.filter(exam => exam.published === true);

    return res.json({ exams: publishedExams });
  } catch (error) {
    console.error("Error in /exams/by-course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { studentId, teacherId, courseName, examTitle, score, status } = req.body;

    if (!studentId || !teacherId || score == null) {
      return res.status(400).json({ error: "Missing required fields (studentId, teacherId, score)" });
    }

    const submission = new Submission({
      studentId,
      teacherId,
      courseName,
      examTitle,
      score,
      status: status || "completed"
    });

    await submission.save();
    return res.json({ msg: "Exam submitted successfully", submission });
  } catch (error) {
    console.error("Error in /exams/submit:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-submissions", fetchStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const numericId = student.stud_id;
    const subs = await Submission.find({ studentId: String(numericId) });
    return res.json({ submissions: subs });
  } catch (error) {
    console.error("Error in /exams/my-submissions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
