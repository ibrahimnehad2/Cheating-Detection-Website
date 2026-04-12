// client/src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/2.png';

const Navbar = () => {
  const navigate = useNavigate();

  // If *any* token is present (student / teacher / admin), consider user "logged in"
  const isLoggedIn =
    localStorage.getItem('token') ||
    localStorage.getItem('teacherToken') ||
    localStorage.getItem('adminToken');

  const handleLogout = () => {
    localStorage.removeItem('token');        // student
    localStorage.removeItem('teacherToken'); // teacher
    localStorage.removeItem('adminToken');   // admin
    navigate('/login');
  };

  return (
    <div className="sticky-top">
      <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#310f85' }}>
        <div className="container-fluid">
          {/* Brand / Logo */}
          <Link className="navbar-brand fw-bold text-white" to="/">
            <img
              src={logo}
              alt="logo"
              style={{ height: 'auto', width: '50px' }}
              className="mx-2"
            />
            Exam Guard
          </Link>

          {/* Toggler for mobile view */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ color: '#fff', border: '1px solid #fff' }}
          >
            ☰
          </button>

          {/* Nav links + Logout button */}
          <div className="collapse navbar-collapse" id="navbarContent">
            {/* Left side links */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {/* Home Link */}
              <li className="nav-item">
                <Link className="nav-link text-white" to="/">
                  Home
                </Link>
              </li>
            </ul>

            {/* Right side: show Logout if any token is found */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="btn"
                style={{ backgroundColor: 'red', color: '#fff', marginRight: '10px' }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
