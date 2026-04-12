import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = (props) => {
  const [credentials, setCredentials] = useState({ stud_id: '', password: '' });
  const navigate = useNavigate();

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { stud_id, password } = credentials;
    try {
      const response = await fetch("http://localhost:15000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stud_id, password })
      });
      const json = await response.json();
      if (response.ok && json.msg?.success) {
        localStorage.setItem('token', json.msg.authToken);
        props.setLoggedInUser(stud_id);
        navigate('/student-dashboard');
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Student Login</h2>
      <form onSubmit={handleSubmit}>
        <label className="form-label">Student ID</label>
        <input
          type="number"
          name="stud_id"
          className="form-control"
          value={credentials.stud_id}
          onChange={onChange}
          required
        />

        <label className="form-label">Password</label>
        <input
          type="password"
          name="password"
          className="form-control"
          value={credentials.password}
          onChange={onChange}
          required
        />

        <button type="submit" className="btn btn-primary">
          Login as Student
        </button>
      </form>
    </div>
  );
};

export default Login;
