import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const onChange = (e) => {
    setAdminCreds({ ...adminCreds, [e.target.name]: e.target.value });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch("http://localhost:15000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminCreds),
      });
      const data = await resp.json();
      if (resp.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error("Error admin login:", error);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Admin Login</h2>
      <form onSubmit={handleAdminLogin}>
        <label className="form-label">Username</label>
        <input
          type="text"
          name="username"
          className="form-control"
          value={adminCreds.username}
          onChange={onChange}
          required
        />

        <label className="form-label">Password</label>
        <input
          type="password"
          name="password"
          className="form-control"
          value={adminCreds.password}
          onChange={onChange}
          required
        />

        <button type="submit" className="btn btn-primary">
          Login as Admin
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
