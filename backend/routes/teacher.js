const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Submission = require("../models/Submission");
const { handleError, handleSuccess } = require("../utils/handleResponse");

const TEACHER_JWT_SECRET = "teachersecret";

function authenticateTeacher(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return handleError(res, "No teacher token found", 401);
  }
  const token = authHeader.replace("Bearer ", "").trim();
  try {
    const decoded = jwt.verify(token, TEACHER_JWT_SECRET);
    req.teacherId = decoded._id;
    next();
  } catch (err) {
    console.error("Teacher token verification failed:", err);
    return handleError(res, "Invalid teacher token", 401);
  }
}

router.post("/login", async (req, res) => {
  const { teacher_id, password } = req.body;
  if (!teacher_id || !password) {
    return handleError(res, "Missing teacher_id or password", 400);
  }

  try {
    const numericTeacherId = parseInt(teacher_id, 10);
    const teacher = await Teacher.findOne({ teacher_id: numericTeacherId });
    if (!teacher) {
      return handleError(res, "Teacher not found", 401);
    }

    const match = await bcrypt.compare(password, teacher.password);
    if (!match) {
      return handleError(res, "Invalid credentials", 401);
    }

    const token = jwt.sign({ _id: teacher._id.toString() }, TEACHER_JWT_SECRET, { expiresIn: "2h" });
    return handleSuccess(res, { success: true, token });
  } catch (error) {
    console.error("Teacher login error:", error);
    return handleError(res, "Internal server error", 500);
  }
});

router.post("/add-exam", authenticateTeacher, async (req, res) => {
  try {
    let { courseName, examTitle, timeLimit, startDateTime, questions } = req.body;
    if (!courseName || !examTitle || !questions) {
      return handleError(res, "Missing courseName, examTitle, or questions", 400);
    }

    const teacher = await Teacher.findById(req.teacherId);
    if (!teacher) {
      return handleError(res, "Teacher not found", 404);
    }

    courseName = courseName.trim();
    const courseObj = teacher.courses.find(
      (c) => c.name.trim().toLowerCase() === courseName.toLowerCase()
    );
    if (!courseObj) {
      return handleError(res, "Course not found in teacher's assigned courses", 404);
    }

    const existingExam = courseObj.exams.find(
      (e) => e.title.trim().toLowerCase() === examTitle.trim().toLowerCase()
    );
    if (existingExam) {
      return handleError(res, "An exam with this title already exists in the course", 400);
    }

    const parsedTimeLimit = parseInt(timeLimit, 10);
    if (isNaN(parsedTimeLimit) || parsedTimeLimit <= 0) {
      return handleError(res, "Invalid timeLimit provided", 400);
    }

    let parsedStartDate = new Date();
    if (startDateTime) {
      const maybeDate = new Date(startDateTime);
      if (!isNaN(maybeDate.getTime())) {
        parsedStartDate = maybeDate;
      } else {
        return handleError(res, "Invalid startDateTime format", 400);
      }
    }

    courseObj.exams.push({
      title: examTitle,
      timeLimit: parsedTimeLimit,
      startDate: parsedStartDate,
      questions
    });

    await teacher.save();
    return handleSuccess(res, "Exam added to the course successfully");
  } catch (error) {
    console.error("Add exam error:", error);
    return handleError(res, "Internal server error", 500);
  }
});

router.delete("/delete-exam", authenticateTeacher, async (req, res) => {
  try {
    const { courseName, examTitle } = req.body;
    if (!courseName || !examTitle) {
      return handleError(res, "Missing courseName or examTitle", 400);
    }

    const teacher = await Teacher.findById(req.teacherId);
    if (!teacher) {
      return handleError(res, "Teacher not found", 404);
    }

    const courseObj = teacher.courses.find(
      (c) => c.name.trim().toLowerCase() === courseName.trim().toLowerCase()
    );
    if (!courseObj) {
      return handleError(res, "Course not found in teacher's assigned courses", 404);
    }

    const examIndex = courseObj.exams.findIndex(
      (exam) => exam.title.trim().toLowerCase() === examTitle.trim().toLowerCase()
    );
    if (examIndex === -1) {
      return handleError(res, `Exam "${examTitle}" not found`, 404);
    }

    courseObj.exams.splice(examIndex, 1);
    await teacher.save();

    return handleSuccess(res, `Exam "${examTitle}" deleted successfully`);
  } catch (error) {
    console.error("delete-exam error:", error);
    return handleError(res, "Internal server error", 500);
  }
});

router.put("/edit-exam", authenticateTeacher, async (req, res) => {
  try {
    const {
      courseName,
      oldExamTitle, 
      newExamTitle,
      newTimeLimit,
      newStartDateTime,
      newQuestions
    } = req.body;

    if (!courseName || !oldExamTitle) {
      return handleError(res, "Missing courseName or oldExamTitle", 400);
    }

    const teacher = await Teacher.findById(req.teacherId);
    if (!teacher) {
      return handleError(res, "Teacher not found", 404);
    }

    const courseObj = teacher.courses.find(
      (c) => c.name.trim().toLowerCase() === courseName.trim().toLowerCase()
    );
    if (!courseObj) {
      return handleError(res, "Course not found in teacher's assigned courses", 404);
    }

    const examObj = courseObj.exams.find(
      (exam) => exam.title.trim().toLowerCase() === oldExamTitle.trim().toLowerCase()
    );
    if (!examObj) {
      return handleError(res, `Exam "${oldExamTitle}" not found`, 404);
    }

    if (newExamTitle && newExamTitle.trim().toLowerCase() !== oldExamTitle.trim().toLowerCase()) {
      const duplicateExam = courseObj.exams.find(
        (e) => e.title.trim().toLowerCase() === newExamTitle.trim().toLowerCase()
      );
      if (duplicateExam) {
        return handleError(res, "An exam with the new title already exists in the course", 400);
      }
    }

    if (newExamTitle) {
      examObj.title = newExamTitle;
    }
    if (newTimeLimit != null) {
      const parsed = parseInt(newTimeLimit, 10);
      if (!isNaN(parsed) && parsed > 0) {
        examObj.timeLimit = parsed;
      }
    }
    if (newStartDateTime) {
      const maybeDate = new Date(newStartDateTime);
      if (!isNaN(maybeDate.getTime())) {
        examObj.startDate = maybeDate;
      }
    }
    if (newQuestions) {
      examObj.questions = newQuestions;
    }

    await teacher.save();
    return handleSuccess(res, "Exam updated successfully");
  } catch (error) {
    console.error("edit-exam error:", error);
    return handleError(res, "Internal server error", 500);
  }
});

router.get("/profile", authenticateTeacher, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacherId);
    if (!teacher) {
      return handleError(res, "Teacher not found", 404);
    }
    return res.json({ teacher });
  } catch (error) {
    console.error("GET /teacher/profile error:", error);
    return handleError(res, "Internal server error", 500);
  }
});

router.get("/dashboard-data", authenticateTeacher, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacherId);
    if (!teacher) {
      return handleError(res, "Teacher not found", 404);
    }
    const teacherIdStr = teacher._id.toString();

    const students = await Student.find({ "courses.teacherId": teacherIdStr });
    const submissions = await Submission.find({ teacherId: teacherIdStr });

    return res.json({ teacher, students, submissions });
  } catch (error) {
    console.error("GET /teacher/dashboard-data error:", error);
    return handleError(res, "Internal server error", 500);
  }
});

module.exports = router;
