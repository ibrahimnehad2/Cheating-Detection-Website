// client/src/components/Home.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import image from '../assets/face.png';
import camera from '../assets/camera.png';
import image2 from '../assets/2.png';

const Home = () => {
  let navigate = useNavigate();

  const clickLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      {/* -- TOP SECTION (Portals) -- */}
      <div className="text-center my-3">
        <h2 style={{ color: '#310f85' }}>Welcome to Exam Guard</h2>
        <p>Select your Portal:</p>
        <div style={{ display: "inline-flex", gap: "10px" }}>
          <Link to="/login" className="btn btn-primary">Student Portal</Link>
          <Link to="/teacher-login" className="btn btn-primary">Teacher Portal</Link>
          <Link to="/admin-login" className="btn btn-primary">Admin Portal</Link>
        </div>
      </div>

      {/* -- MAIN TITLE & DESCRIPTION -- */}
      <div className='home-main text-center'>
        <h1 className='py-2' style={{ fontSize: "3rem", color: '#310f85' }}>ONLINE EXAM</h1>
        <p className='py-2' style={{ fontSize: "1rem" }}>
          Detect cheating in online exams with the power of Artificial Intelligence &amp; Machine Learning
        </p>
        {!localStorage.getItem('token')
          ? <Link type="button" className="btn btn-primary" to="/login">Log In</Link>
          : <button onClick={clickLogout} className='btn btn-secondary'>Logout</button>
        }
      </div>

      {/* -- MAIN BOXES (AI Face Detection, Instant Exam, Video Proctoring) -- */}
      <div 
        className='container-fluid d-flex align-items-center flex-wrap justify-content-center'
        style={{ marginTop: "30px" }}
      >
        <div className='box my-2 mx-2 shadow-sm p-3 rounded text-center'>
          <img 
            src={image} 
            alt='face detection' 
            style={{ height: "50px", width: "50px" }} 
          />
          <h3 style={{ color: '#310f85', marginTop: '10px' }}>AI Face Detection</h3>
          <p>Advanced AI/ML to detect cheating by tracking student’s facial movements</p>
        </div>

        <div className='box mx-2 my-2 shadow-sm p-3 rounded text-center'>
          <img
            src='https://anti-cheat-exam-app.vercel.app/images/icon/assesment_icon.svg'
            alt='grading'
            style={{ height: "50px", width: "50px" }}
          />
          <h3 style={{ color: '#310f85', marginTop: '10px' }}>Instant Exam Evaluation</h3>
          <p>Provides immediate results with accurate exam analysis and progress tracking.</p>
        </div>

        <div className='box mx-2 my-2 shadow-sm p-3 rounded text-center'>
          <img 
            src={camera} 
            alt='camera' 
            style={{ height: "50px", width: "50px" }} 
          />
          <h3 style={{ color: '#310f85', marginTop: '10px' }}>Video Proctoring</h3>
          <p>Support for live video proctoring (future support)</p>
        </div>
      </div>

      {/* -- CONTACT SECTION -- */}
      <h2 className='mx-3' style={{ color: '#310f85', marginTop: '40px' }}>Contact Us</h2>
      <section className="contact-section" style={{ padding: '20px', fontSize: '1.2rem' }}>
        <div className="contact-details text-center" style={{ lineHeight: '1.8rem' }}>
          <p style={{ color: '#457b9d', fontWeight: 'bold' }}>
            🏫 Arab Academy for Science and Technology (AAST)
          </p>
          <p style={{ color: 'blue', fontWeight: 'bold' }}>
            ✉️ <a href="mailto:info@aast.edu" style={{ color: 'blue', textDecoration: 'none' }}>
              info@aast.edu
            </a>
          </p>
          <p style={{ color: '#457b9d', fontWeight: 'bold' }}>
            📍 Cairo, Egypt
          </p>
          <p style={{ color: 'green', fontWeight: 'bold' }}>
            📞 <a href="tel:+2019838" style={{ color: 'green', textDecoration: 'none' }}>
              +20 19838
            </a>
          </p>
        </div>
      </section>

      {/* -- FOOTER (EDITED TO THE NEW STYLE) -- */}
      <div className="App">
        {/* Footer background: #310f85, all text/links in white */}
        <footer className="footer" style={{ backgroundColor: "#310f85", padding: '10px' }}>
          <nav 
            className="footer-nav" 
            style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <img 
              src={image2} 
              alt='logo' 
              style={{ height: "50px", width: "50px" }} 
            />
            <a 
              href="/" 
              className="footer-link" 
              style={{ color: '#fff', textDecoration: 'none' }}
            >
              Home
            </a>
            <a
              href="https://lms.aast.edu/login/index.php"
              target='_blank'
              className="footer-link"
              rel="noreferrer"
              style={{ color: '#fff', textDecoration: 'none' }}
            >
              AAST Moodle
            </a>
            <a
              href="https://aast.edu/en/about/"
              target='_blank'
              className="footer-link"
              rel="noreferrer"
              style={{ color: '#fff', textDecoration: 'none' }}
            >
              About
            </a>
          </nav>
          <hr />
          <div style={{ color: '#fff', textAlign: 'center' }}>
            &copy; 2024-2025 | All Rights Reserved - Tech
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
