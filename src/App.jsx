import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react';

import Home from './components/Home.jsx';
import Exam from './components/Exam.jsx';
import Navbar from './components/Navbar.jsx';

// Student
import Login from './components/Login.jsx'; 
import StudentDashboard from './components/StudentDashboard.jsx';

// Admin
import AdminLogin from './components/AdminLogin.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

// Teacher
import TeacherLogin from './components/TeacherLogin.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  return (
    <BrowserRouter>
      <Navbar loggedInUser={loggedInUser} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exam" element={<Exam loggedInUser={loggedInUser} />} />

        {/* Student */}
        <Route path="/login" element={<Login setLoggedInUser={setLoggedInUser} />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />

        {/* Admin */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Teacher */}
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
