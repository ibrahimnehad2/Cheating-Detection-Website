import React from 'react'
import { Link,useNavigate } from 'react-router-dom';
import image from '../assets/face.png'
import camera from '../assets/camera.png'
import computer from '../assets/computer.png'
import image2 from '../assets/2.png'


const Home = () => {

  let navigate = useNavigate()

  const clickLogout = () => {
      localStorage.removeItem('token')
      navigate('/login')
  }

  return (
    <>
      <div className='home-main'>
        <h1 className='py-2' style={{ fontSize: "3rem" }}>ONLINE EXAM</h1>
        <p className='py-2' style={{ fontSize: "1rem" }}>Detect cheating in online exams with the power of Artificial Intelligence & Machine Learning</p>
        {!localStorage.getItem('token') ? <Link type="button" className="btn btn-info" to="/Login">Log In</Link>: <button onClick={clickLogout} className='btn btn-primary'>Logout</button>}
      </div>

      {/* Features Section */}

      <h2 className='mx-3'>Features</h2>
      <div className='container-fluid d-flex align-items-center flex-wrap justify-content-center'>

        <div className='box my-2 mx-2 shadow-sm p-3 mb-5 bg-body-tertiary rounded'>
          <img src={image} alt='image' style={{ height: "50px", width: "50px" }}></img>
          <h3>AI Face Detection</h3>
          <p>Advance AI and ML to detect cheating by tracking student’s facial movements</p>
        </div>





        <div className='box mx-2 my-2 shadow-sm p-3 mb-5 bg-body-tertiary rounded'>
          <img src='https://anti-cheat-exam-app.vercel.app/images/icon/assesment_icon.svg' alt='image' style={{ height: "50px", width: "50px" }}></img>
          <h3> Instant Exam Evaluation and Grading</h3>
          <p>Provides immediate results with accurate exam analysis and and progress tracking.</p>
        </div>

        <div className='box mx-2 my-2 shadow-sm p-3 mb-5 bg-body-tertiary rounded'>
          <img src={camera} alt='image' style={{ height: "50px", width: "50px" }}></img>
          <h3>Video Proctoring</h3>
          <p>Support for live video proctoring (future support)</p>
        </div>
      </div>

      <h2 className='mx-3'>Contact Us</h2>

      <section className="contact-section" style={{ padding: '20px', fontSize: '1.2rem' }}>
  <div className="contact-details text-center" style={{ lineHeight: '1.8rem' }}>
    <p style={{ color: '#457b9d', fontWeight: 'bold' }}>
      🏫 Arab Academy for Science and Technology (AAST)
    </p>
    <p style={{ color: 'blue', fontWeight: 'bold' }}>
      ✉️ <a href="mailto:info@aast.edu" style={{ color: 'blue', textDecoration: 'none' }}>info@aast.edu</a>
    </p>
    <p style={{ color: '#457b9d', fontWeight: 'bold' }}>
      📍 Cairo, Egypt
    </p>
    <p style={{ color: 'green', fontWeight: 'bold' }}>
      📞 <a href="tel:+2019838" style={{ color: 'green', textDecoration: 'none' }}>+20 19838</a>
    </p>
  </div>
</section>




      {/* footer */}
      <div className="App">
        <footer className="footer">
          <nav className="footer-nav">
          <img src={image2} alt='logo' style={{ height: "50px", width: "50px" }}></img>
            <a href="/" className="footer-link">Home</a>
            
            <a href="https://lms.aast.edu/login/index.php" target='_blank' className="footer-link">AAST Moodle</a>
            
            
          
            
            <a href="https://aast.edu/en/about/" target='_blank' className="footer-link">About</a>
          </nav>
          <div className="footer-copyright">
            <hr />
            &copy;  2024-2025 | All Rights Reserved - Tech

          </div>
        </footer>
      </div>

    </>
  )
}

export default Home
