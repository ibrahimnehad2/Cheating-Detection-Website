import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const [studentData, setStudentData] = useState({ courses: [] });
  const [examsByCourse, setExamsByCourse] = useState({});
  const [mySubmissions, setMySubmissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch("http://localhost:15000/auth/profile", {
      headers: { "auth-token": token }
    })
      .then(resp => resp.json())
      .then(data => {
        if (data.student) {
          setStudentData(data.student);
        }
      })
      .catch(err => console.error("Error loading student profile:", err));

    fetch("http://localhost:15000/exams/my-submissions", {
      headers: { "auth-token": token }
    })
      .then(resp => resp.json())
      .then(data => {
        if (data.submissions) {
          setMySubmissions(data.submissions);
        }
      })
      .catch(err => console.error("Error loading submissions:", err));
  }, []);

  const handleViewExams = async (teacherMongoId, courseName) => {
    try {
      const resp = await fetch(
        `http://localhost:15000/exams/by-course?teacherId=${teacherMongoId}&courseName=${encodeURIComponent(courseName)}`
      );
      const data = await resp.json();
      if (resp.ok && data.exams) {
        setExamsByCourse(prev => ({ ...prev, [courseName]: data.exams }));
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  const hasSubmittedExam = (courseName, examTitle) => {
    return mySubmissions.some(
      sub => sub.courseName === courseName && sub.examTitle === examTitle
    );
  };

  const handleStartExam = (teacherMongoId, courseName, examTitle) => {
    navigate(
      `/exam?teacherId=${teacherMongoId}&courseName=${encodeURIComponent(courseName)}&examTitle=${encodeURIComponent(examTitle)}`
    );
  };

  return (
    <div className="dashboard-container">
      <h3 className="dashboard-title">Student Dashboard</h3>
      <p>Welcome, {studentData.name} (ID: {studentData.stud_id})</p>

      <h4 style={{ color: '#310f85' }}>My Courses:</h4>
      {studentData.courses.length === 0 ? (
        <p>No courses found. Ask admin to enroll you!</p>
      ) : (
        <ul>
          {studentData.courses.map((c, idx) => (
            <li key={idx} style={{ marginBottom: "10px" }}>
              <b>{c.name}</b> (Taught by {c.teacherName}){" "}
              <button 
                onClick={() => handleViewExams(c.teacherId, c.name)}
                className="btn btn-primary btn-sm"
                style={{ marginLeft: '6px' }}
              >
                View Exams
              </button>

              {examsByCourse[c.name] && (
                <div style={{ marginTop: "10px" }}>
                  <ul>
                    {examsByCourse[c.name].map((exam, exIdx) => {
                      const examAlreadyTaken = hasSubmittedExam(c.name, exam.title);
                      return (
                        <li key={exIdx} style={{ marginBottom: "5px" }}>
                          <span style={{ fontWeight: "bold" }}>{exam.title}</span>{" "}
                          {examAlreadyTaken ? (
                            <span style={{ color: "red", marginLeft: '6px' }}>
                              (Already Taken / Cannot Retake)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleStartExam(c.teacherId, c.name, exam.title)}
                              className="btn btn-primary btn-sm"
                              style={{ marginLeft: '6px' }}
                            >
                              Take This Exam
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StudentDashboard;
