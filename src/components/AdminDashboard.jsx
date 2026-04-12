import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [userType, setUserType] = useState("teacher");
  const [userDetails, setUserDetails] = useState({ id: "", name: "", password: "" });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  // For assign course & enroll
  const [teacherIdForCourse, setTeacherIdForCourse] = useState("");
  const [courseName, setCourseName] = useState("");
  const [studIdForEnrollment, setStudIdForEnrollment] = useState("");

  const handleChange = (e) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };

  const fetchTeachers = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;
    const resp = await fetch("http://localhost:15000/admin/view-teachers", {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const data = await resp.json();
    if (resp.ok) setTeachers(data.teachers || []);
  };

  const fetchStudents = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;
    const resp = await fetch("http://localhost:15000/admin/view-students", {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const data = await resp.json();
    if (resp.ok) setStudents(data.students || []);
  };

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
    // eslint-disable-next-line
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    await fetch("http://localhost:15000/admin/add-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userType,
        details: {
          id: userDetails.id,
          name: userDetails.name,
          password: userDetails.password
        }
      })
    });
    // Refresh teacher/student lists
    if (userType === "teacher") fetchTeachers();
    if (userType === "student") fetchStudents();
  };

  const handleAssignCourse = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    await fetch("http://localhost:15000/admin/assign-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        teacherId: teacherIdForCourse,
        courseName
      })
    });
    // Refresh teachers
    fetchTeachers();
  };

  const handleEnrollStudent = async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    await fetch("http://localhost:15000/admin/enroll-student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        studId: studIdForEnrollment,
        teacherId: teacherIdForCourse,
        courseName
      })
    });
    // Refresh students
    fetchStudents();
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Admin Dashboard</h2>

      <div>
        <form onSubmit={handleAddUser}>
          <div className="mb-3">
            <label className="form-label">User Type:</label>
            <select
              className="form-control"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">ID</label>
            <input
              type="text"
              className="form-control"
              name="id"
              value={userDetails.id}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={userDetails.name}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={userDetails.password}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Create User
          </button>
        </form>
      </div>

      <hr/>

      <div>
        <h4>All Teachers</h4>
        <ul>
          {teachers.map(t => (
            <li key={t._id}>
              <strong>ID:</strong> {t.teacher_id} | <strong>Name:</strong> {t.name}
              {t.courses?.length > 0 && (
                <ul>
                  {t.courses.map((c, i) => <li key={i}>{c.name}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4>All Students</h4>
        <ul>
          {students.map(s => (
            <li key={s._id}>
              <strong>ID:</strong> {s.stud_id} | <strong>Name:</strong> {s.name}
              {s.courses?.length > 0 && (
                <ul>
                  {s.courses.map((c, i) => (
                    <li key={i}>
                      {c.name} (Taught by {c.teacherName})
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <hr/>

      <div>
        <h4>Assign a Course to a Teacher</h4>
        <div className="mb-3">
          <label className="form-label">Teacher ID:</label>
          <input 
            type="text" 
            className="form-control"
            value={teacherIdForCourse} 
            onChange={e => setTeacherIdForCourse(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Course Name:</label>
          <input
            type="text"
            className="form-control"
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAssignCourse}>
          Assign Course
        </button>
      </div>

      <hr/>

      <div>
        <h4>Enroll a Student in a Course</h4>
        <div className="mb-3">
          <label className="form-label">Student ID:</label>
          <input
            type="text"
            className="form-control"
            value={studIdForEnrollment}
            onChange={e => setStudIdForEnrollment(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleEnrollStudent}>
          Enroll Student
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
