import React, { useState, useEffect, useRef } from 'react';

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(5); 
  const [startDateTime, setStartDateTime] = useState("");

  const [questions, setQuestions] = useState([
    {
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A"
    }
  ]);

  const [editMode, setEditMode] = useState(false);
  const [editCourseName, setEditCourseName] = useState("");
  const [oldExamTitle, setOldExamTitle] = useState("");
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newTimeLimit, setNewTimeLimit] = useState("");
  const [newStartDateTime, setNewStartDateTime] = useState("");
  const [newQuestions, setNewQuestions] = useState([
    {
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A"
    }
  ]);

  const editFormRef = useRef(null);
  const teacherToken = localStorage.getItem('teacherToken');

  const fetchDashboardData = async () => {
    if (!teacherToken) {
      setLoading(false);
      return;
    }
    try {
      const resp = await fetch("http://localhost:15000/teacher/dashboard-data", {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setTeacher(data.teacher);
        setStudents(data.students);
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error("Error fetching dashboard-data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuestionChange = (index, field, value, isEdit = false) => {
    if (!isEdit) {
      const newQ = [...questions];
      newQ[index][field] = value;
      setQuestions(newQ);
    } else {
      const editedQ = [...newQuestions];
      editedQ[index][field] = value;
      setNewQuestions(editedQ);
    }
  };

  const addQuestion = (isEdit = false) => {
    const blankQ = {
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A"
    };
    if (!isEdit) {
      setQuestions([...questions, blankQ]);
    } else {
      setNewQuestions([...newQuestions, blankQ]);
    }
  };

  const handleAddExam = async () => {
    if (!teacherToken) return;

    const formattedQuestions = questions.map(q => ({
      questionText: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      answer:
        q.correctOption === "A" ? q.optionA
        : q.correctOption === "B" ? q.optionB
        : q.correctOption === "C" ? q.optionC
        : q.optionD
    }));

    try {
      const resp = await fetch("http://localhost:15000/teacher/add-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          courseName: selectedCourseName,
          examTitle,
          timeLimit,
          startDateTime,
          questions: formattedQuestions
        })
      });
      if (resp.ok) {
        fetchDashboardData();
        // Reset form
        setQuestions([
          { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" }
        ]);
        setExamTitle("");
        setTimeLimit(5);
        setStartDateTime("");
        setSelectedCourseName("");
      }
    } catch (error) {
      console.error("Error adding exam:", error);
    }
  };

  const handleDeleteExam = async (courseName, examTitle) => {
    if (!teacherToken) return;

    try {
      const resp = await fetch("http://localhost:15000/teacher/delete-exam", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ courseName, examTitle })
      });
      if (resp.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  };

  const showEditForm = (courseName, exam) => {
    setEditMode(true);
    setEditCourseName(courseName);
    setOldExamTitle(exam.title);
    setNewExamTitle(exam.title); 
    setNewTimeLimit(exam.timeLimit || 5);

    if (exam.startDate) {
      const isoStr = new Date(exam.startDate).toISOString();
      setNewStartDateTime(isoStr.slice(0,16));
    } else {
      setNewStartDateTime("");
    }

    if (exam.questions) {
      const qArray = exam.questions.map(q => {
        const correctOptIndex = q.options.indexOf(q.answer);
        let letter = "A";
        if (correctOptIndex === 1) letter = "B";
        if (correctOptIndex === 2) letter = "C";
        if (correctOptIndex === 3) letter = "D";
        return {
          questionText: q.questionText,
          optionA: q.options[0] || "",
          optionB: q.options[1] || "",
          optionC: q.options[2] || "",
          optionD: q.options[3] || "",
          correctOption: letter
        };
      });
      setNewQuestions(qArray);
    } else {
      setNewQuestions([]);
    }

    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
  };

  const handleEditExam = async () => {
    if (!teacherToken) return;

    const formattedQ = newQuestions.map(q => ({
      questionText: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      answer:
        q.correctOption === "A" ? q.optionA
        : q.correctOption === "B" ? q.optionB
        : q.correctOption === "C" ? q.optionC
        : q.optionD
    }));

    try {
      const resp = await fetch("http://localhost:15000/teacher/edit-exam", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          courseName: editCourseName,
          oldExamTitle,
          newExamTitle,
          newTimeLimit,
          newStartDateTime,
          newQuestions: formattedQ
        })
      });
      if (resp.ok) {
        setEditMode(false);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error editing exam:", error);
    }
  };

  if (loading) {
    return <div style={{ margin: "20px" }}>Loading Teacher Dashboard...</div>;
  }

  if (!teacher) {
    return <div style={{ margin: "20px" }}>No teacher data. Please log in as teacher.</div>;
  }

  const findSubmission = (courseName, examTitle, student) => {
    return submissions.find(
      sub =>
        sub.courseName === courseName &&
        sub.examTitle === examTitle &&
        sub.studentId === String(student.stud_id)
    );
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Teacher Dashboard</h2>
      <p>Welcome, {teacher.name} (Teacher ID: {teacher.teacher_id})</p>

      <hr />
      <h4 style={{ color: '#310f85' }}>My Courses & Students</h4>
      {teacher.courses.map((course, cIdx) => {
        const studentsInCourse = students.filter(stu =>
          stu.courses.some(sc => sc.name.trim().toLowerCase() === course.name.trim().toLowerCase())
        );

        return (
          <div key={cIdx} style={{ border: "1px solid #ccc", padding: "10px", marginTop: "10px" }}>
            <h5>Course: <span style={{ color: "darkblue" }}>{course.name}</span></h5>
            {course.exams && course.exams.length > 0 ? (
              course.exams.map((exam, eIdx) => {
                const startDateLocal = exam.startDate
                  ? new Date(exam.startDate).toLocaleString()
                  : "No start date";
                return (
                  <div key={eIdx} style={{ margin: "10px 0", paddingLeft: "20px" }}>
                    <h6 style={{ marginBottom: "5px" }}>
                      <strong style={{ color: "#d9534f" }}>Exam Title:</strong> {exam.title}
                    </h6>
                    <p>
                      Time Limit: {exam.timeLimit} min<br/>
                      Start Date/Time: {startDateLocal}
                    </p>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteExam(course.name, exam.title)}
                    >
                      Delete
                    </button>{" "}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => showEditForm(course.name, exam)}
                    >
                      Edit
                    </button>

                    <table className="table table-bordered" style={{ marginTop: "10px" }}>
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Status / Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsInCourse.length === 0 ? (
                          <tr>
                            <td colSpan="3">No students in this course.</td>
                          </tr>
                        ) : (
                          studentsInCourse.map((stu, sIdx) => {
                            const sub = findSubmission(course.name, exam.title, stu);
                            let statusCell = "Not submitted";
                            if (sub) {
                              if (sub.status === "cheating-detected") {
                                statusCell = <span style={{ color: "red" }}>Cheater</span>;
                              } else {
                                const totalQs = exam.questions.length;
                                const subTime = new Date(sub.submittedAt).toLocaleString();
                                statusCell = (
                                  <>
                                    Score: {sub.score}/{totalQs}
                                    <br/>
                                    <small>Submitted: {subTime}</small>
                                  </>
                                );
                              }
                            }
                            return (
                              <tr key={sIdx}>
                                <td>{stu.stud_id}</td>
                                <td>{stu.name}</td>
                                <td>{statusCell}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })
            ) : (
              <p style={{ marginLeft: "20px", color: "#555" }}>No exams in this course yet.</p>
            )}
          </div>
        );
      })}

      <hr />
      <h4 style={{ color: '#310f85' }}>Add a New Exam</h4>
      <div className="mb-3">
        <label className="form-label">Select Course:</label>
        <select
          className="form-control"
          value={selectedCourseName}
          onChange={(e) => setSelectedCourseName(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {teacher.courses?.map((c, i) => (
            <option key={i} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Exam Title</label>
        <input
          className="form-control"
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Time Limit (minutes)</label>
        <input
          type="number"
          className="form-control"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Exam Start Date/Time</label>
        <input
          type="datetime-local"
          className="form-control"
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
        />
      </div>

      {questions.map((q, idx) => (
        <div key={idx} className="border p-2 my-2">
          <label className="form-label"><b>Question Text:</b></label>
          <input
            className="form-control"
            value={q.questionText}
            onChange={(e) => handleQuestionChange(idx, "questionText", e.target.value, false)}
          />

          <label className="form-label mt-2">Option A</label>
          <input
            className="form-control"
            value={q.optionA}
            onChange={(e) => handleQuestionChange(idx, "optionA", e.target.value, false)}
          />

          <label className="form-label mt-2">Option B</label>
          <input
            className="form-control"
            value={q.optionB}
            onChange={(e) => handleQuestionChange(idx, "optionB", e.target.value, false)}
          />

          <label className="form-label mt-2">Option C</label>
          <input
            className="form-control"
            value={q.optionC}
            onChange={(e) => handleQuestionChange(idx, "optionC", e.target.value, false)}
          />

          <label className="form-label mt-2">Option D</label>
          <input
            className="form-control"
            value={q.optionD}
            onChange={(e) => handleQuestionChange(idx, "optionD", e.target.value, false)}
          />

          <label className="form-label mt-2">Correct Answer (A/B/C/D)</label>
          <select
            className="form-control"
            value={q.correctOption}
            onChange={(e) => handleQuestionChange(idx, "correctOption", e.target.value, false)}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      ))}
      <button onClick={() => addQuestion(false)} className="btn btn-primary">
        Add Another Question
      </button>
      <br /><br />
      <button onClick={handleAddExam} className="btn btn-primary">
        Save Exam
      </button>

      {editMode && (
        <div ref={editFormRef} style={{ marginTop: "40px" }}>
          <hr />
          <h4 style={{ color: '#310f85' }}>Edit Exam "{oldExamTitle}" in "{editCourseName}"</h4>
          <p>Change any fields below and click "Save Changes".</p>
          <div className="mb-3">
            <label className="form-label">New Exam Title</label>
            <input
              className="form-control"
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">New Time Limit (minutes)</label>
            <input
              type="number"
              className="form-control"
              value={newTimeLimit}
              onChange={(e) => setNewTimeLimit(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">New Start Date/Time</label>
            <input
              type="datetime-local"
              className="form-control"
              value={newStartDateTime}
              onChange={(e) => setNewStartDateTime(e.target.value)}
            />
          </div>

          {newQuestions.map((q, idx) => (
            <div key={idx} className="border p-2 my-2">
              <label className="form-label"><b>Question Text:</b></label>
              <input
                className="form-control"
                value={q.questionText}
                onChange={(e) => handleQuestionChange(idx, "questionText", e.target.value, true)}
              />

              <label className="form-label mt-2">Option A</label>
              <input
                className="form-control"
                value={q.optionA}
                onChange={(e) => handleQuestionChange(idx, "optionA", e.target.value, true)}
              />

              <label className="form-label mt-2">Option B</label>
              <input
                className="form-control"
                value={q.optionB}
                onChange={(e) => handleQuestionChange(idx, "optionB", e.target.value, true)}
              />

              <label className="form-label mt-2">Option C</label>
              <input
                className="form-control"
                value={q.optionC}
                onChange={(e) => handleQuestionChange(idx, "optionC", e.target.value, true)}
              />

              <label className="form-label mt-2">Option D</label>
              <input
                className="form-control"
                value={q.optionD}
                onChange={(e) => handleQuestionChange(idx, "optionD", e.target.value, true)}
              />

              <label className="form-label mt-2">Correct Answer (A/B/C/D)</label>
              <select
                className="form-control"
                value={q.correctOption}
                onChange={(e) => handleQuestionChange(idx, "correctOption", e.target.value, true)}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          ))}
          <button onClick={() => addQuestion(true)} className="btn btn-primary">
            Add Another Question
          </button>
          <br /><br />
          <button onClick={handleEditExam} className="btn btn-primary">
            Save Changes
          </button>{" "}
          <button
            onClick={() => {
              setEditMode(false);
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
