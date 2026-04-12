import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherLogin = () => {
  const [teacherCreds, setTeacherCreds] = useState({ teacher_id: '', password: '' });
  const navigate = useNavigate();

  const onChange = (e) => {
    setTeacherCreds({ ...teacherCreds, [e.target.name]: e.target.value });
  };

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch("http://localhost:15000/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherCreds)
      });
      const data = await resp.json();
      if (resp.ok && data.msg?.success && data.msg.token) {
        localStorage.setItem('teacherToken', data.msg.token);
        navigate('/teacher-dashboard');
      }
    } catch (error) {
      console.error("Error teacher login:", error);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Teacher Login</h2>
      <form onSubmit={handleTeacherLogin}>
        <label className="form-label">Teacher ID</label>
        <input
          name="teacher_id"
          className="form-control"
          value={teacherCreds.teacher_id}
          onChange={onChange}
          required
        />

        <label className="form-label">Password</label>
        <input
          name="password"
          type="password"
          className="form-control"
          value={teacherCreds.password}
          onChange={onChange}
          required
        />

        <button type="submit" className="btn btn-primary">
          Login as Teacher
        </button>
      </form>
    </div>
  );
};

export default TeacherLogin;
