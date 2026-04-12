const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const { handleError, handleSuccess } = require('../utils/handleResponse');
const fetchStudent = require('../middleware/fetchStudent');

const JWT_SECRET = 'elephantismyfavoritanimal';

router.post('/login', async (req, res) => {
  const { stud_id, password } = req.body;
  try {
    const numericStudId = parseInt(stud_id, 10);
    const student = await Student.findOne({ stud_id: numericStudId });
    if (!student) {
      return handleError(res, 'Student not found', 401);
    }

    const match = await bcrypt.compare(password, student.password);
    if (!match) {
      return handleError(res, 'Invalid credentials', 401);
    }

    const data = { user: { id: student._id } };
    const authToken = jwt.sign(data, JWT_SECRET);

    return handleSuccess(res, { success: true, msg: 'Login successful', authToken });
  } catch (error) {
    console.error(error.message);
    return handleError(res, 'Internal Server Error', 500);
  }
});

router.get('/profile', fetchStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return handleError(res, "Student not found", 404);
    }
    return res.json({ student });
  } catch (error) {
    console.error("GET /profile error:", error);
    return handleError(res, "Internal Server Error", 500);
  }
});

module.exports = router;
