const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const { handleError, handleSuccess } = require("../utils/handleResponse");
const authenticateAdmin = require("../middleware/authenticateAdmin");

const ADMIN_SECRET = "myadminsecret";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password123";

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin" }, ADMIN_SECRET, { expiresIn: "1h" });
    return res.json({ token });
  } else {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }
});

router.post("/add-user", authenticateAdmin, async (req, res) => {
  try {
    const { userType, details } = req.body; 
    if (!userType || !details?.id || !details?.password) {
      return handleError(res, "Missing user details", 400);
    }

    const numericId = parseInt(details.id, 10);

    if (userType === "teacher") {
      const existing = await Teacher.findOne({ teacher_id: numericId });
      if (existing) {
        return handleError(res, "Teacher already exists", 400);
      }
      const hashed = await bcrypt.hash(details.password, 10);
      const newTeacher = new Teacher({
        teacher_id: numericId,
        name: details.name || "NoName",
        password: hashed,
      });
      await newTeacher.save();
      return handleSuccess(res, "Teacher created successfully");
    }
    else if (userType === "student") {
      const existing = await Student.findOne({ stud_id: numericId });
      if (existing) {
        return handleError(res, "Student already exists", 400);
      }
      const hashed = await bcrypt.hash(details.password, 10);
      const newStudent = new Student({
        stud_id: numericId,
        name: details.name || "NoName",
        password: hashed
      });
      await newStudent.save();
      return handleSuccess(res, "Student created successfully");
    }
    else {
      return handleError(res, "Invalid userType (must be 'teacher' or 'student')", 400);
    }
  } catch (error) {
    console.error("Error in add-user:", error);
    return handleError(res, "Internal Server Error", 500);
  }
});

router.get("/view-teachers", authenticateAdmin, async (req, res) => {
  try {
    const teachers = await Teacher.find({});
    return res.json({ teachers });
  } catch (err) {
    return handleError(res, "Error fetching teachers", 500);
  }
});

router.get("/view-students", authenticateAdmin, async (req, res) => {
  try {
    const students = await Student.find({});
    return res.json({ students });
  } catch (err) {
    return handleError(res, "Error fetching students", 500);
  }
});

router.post("/assign-course", authenticateAdmin, async (req, res) => {
  try {
    let { teacherId, courseName } = req.body;
    if (!teacherId || !courseName) {
      return handleError(res, "Missing teacherId or courseName", 400);
    }

    courseName = courseName.trim(); 

    const numericTeacherId = parseInt(teacherId, 10);
    const teacher = await Teacher.findOne({ teacher_id: numericTeacherId });
    if (!teacher) {
      return handleError(res, "Teacher not found", 404);
    }

    const existingCourse = teacher.courses.find(
      (c) => c.name.trim().toLowerCase() === courseName.toLowerCase()
    );
    if (existingCourse) {
      return handleError(res, "Course already assigned to this teacher", 400);
    }

    teacher.courses.push({ name: courseName, exams: [] });
    await teacher.save();

    return handleSuccess(res, "Course assigned to teacher successfully");
  } catch (error) {
    console.error("assign-course error:", error);
    return handleError(res, "Internal server error", 500);
  }
});

router.post("/enroll-student", authenticateAdmin, async (req, res) => {
  try {
    let { studId, teacherId, courseName } = req.body;
    if (!studId || !teacherId || !courseName) {
      return handleError(res, "Missing studId, teacherId, or courseName", 400);
    }

    courseName = courseName.trim();

    const numericTeacherId = parseInt(teacherId, 10);
    const numericStudId = parseInt(studId, 10);

    const teacher = await Teacher.findOne({ teacher_id: numericTeacherId });
    if (!teacher) {
      return handleError(res, "Teacher not found", 404);
    }

    const student = await Student.findOne({ stud_id: numericStudId });
    if (!student) {
      return handleError(res, "Student not found", 404);
    }

    student.courses.push({
      name: courseName,
      teacherId: teacher._id.toString(),
      teacherName: teacher.name
    });
    await student.save();

    return handleSuccess(res, "Student enrolled in the course successfully");
  } catch (error) {
    console.error("enroll-student error:", error);
    return handleError(res, "Internal server error", 500);
  }
});

module.exports = router;
