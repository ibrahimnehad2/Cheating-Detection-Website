import React, { useEffect, useState, useRef } from 'react';
import Webcam from "react-webcam";
import { detectCheating, extractFaceCoordinates, getCheatingStatus } from "../helpers/face-detection-helper";
import { NO_CHEATING_RESULT } from "../helpers/face-detection-constants";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

const Exam = (props) => {
  const [examStarted, setExamStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes = 300 seconds
  const [isRunning, setIsRunning] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [exam, setExam] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [cheatingAlert, setCheatingAlert] = useState('');
  const [studentScore, setStudentScore] = useState(0);  // New state for the student's score

  const webcamRef = useRef(null);
  const faceDetectionRef = useRef(null);
  const cheatingTimers = useRef({ left: 0, right: 0 }); // Timers for left and right looks
  const cumulativeTimers = useRef({ left: 0, right: 0 }); // Cumulative timers for left and right looks

  // for decoding " "
  const decodeHTMLEntities = (text) => {
    const parser = new DOMParser();
    const decodedString = parser.parseFromString(`<!doctype html><body>${text}`, 'text/html').body.textContent;
    return decodedString;
  };

  // Shuffle an array (Fisher-Yates Shuffle algorithm)
  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const handleStart = () => {
    setExamStarted(true);
    setSubmitted(false);
    setIsRunning(true);

    fetch('https://opentdb.com/api.php?amount=5&category=18')
      .then(response => response.json())
      .then(data => {
        const formattedExam = data.results.map(question => {
          const allAnswers = [question.correct_answer, ...question.incorrect_answers];
          return {
            ...question,
            question: decodeHTMLEntities(question.question), // Decode HTML entities in the question
            allAnswers: shuffleArray(allAnswers),
            score: 0  // Initialize score for each question
          };
        });
        setExam(formattedExam);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleAnswerSelection = (index) => {
    if (exam[currentQuestionIndex].allAnswers[index] === exam[currentQuestionIndex].correct_answer) {
      // If correct, increase the score for the current question
      setExam(prevExam => {
        const newExam = [...prevExam];
        newExam[currentQuestionIndex].score = 1;  // Increment by 1 for correct answer
        return newExam;
      });
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setExamStarted(false);
    setIsRunning(false);
  
    const totalScore = exam.reduce((sum, question) => sum + question.score, 0);
    setStudentScore(totalScore);
  
    const payload = {
      studentId: props.loggedInUser, // Pass the logged-in student's ID
      examId: 'exam123', // Replace with dynamic exam ID
      score: totalScore,
      status: 'completed',
    };
  
    try {
      await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Exam submitted successfully!');
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };
  
  

  const handleNext = () => {
    if (currentQuestionIndex < exam.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  // Effect to handle the countdown timer
  useEffect(() => {
    let timer;
    if (isRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsRunning(false);
      setSubmitted(true);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeRemaining]);

  // Format time in MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle visibility change event
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab is not visible
      showWarningMessage('Tab is not visible');
    }
  };

  // Handle window blur event
  const handleBlur = () => {
    showWarningMessage('Window lost focus');
  };

  // Handle window focus event
  const handleFocus = () => {
    setShowWarning(false);
  };

  // Handle window resize event
  const handleResize = () => {
    if (window.innerWidth < 800) { // Example condition: when window width is less than 800px
      showWarningMessage('Window resized to small size');
    }
  };

  // Show warning message for a specified duration
  const showWarningMessage = (message) => {
    setWarningMessage(message);
    setShowWarning(true);

    // Hide warning after 3 seconds
    setTimeout(() => {
      setShowWarning(false);
    }, 3000);
  };

  useEffect(() => {
    // Attach event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Face detection
  useEffect(() => {
    let cheatingCount = 0; // Counter to track instances of looking left or right

    const faceDetection = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({
      minDetectionConfidence: 0.5,
      model: "short",
    });

    async function onResult(result) {
      if (result.detections.length < 1) {
        setCheatingAlert("Face not detected. Ensure your face is visible!");
        return;
      } else if (result.detections.length > 1) {
        setCheatingAlert("Multiple faces detected. Possible cheating!");
        return;
      }

      const faceCoordinates = extractFaceCoordinates(result);
      const [lookingLeft, lookingRight] = detectCheating(faceCoordinates);
      const cheatingStatus = getCheatingStatus(lookingLeft, lookingRight);

      setCheatingAlert(cheatingStatus);

      // Increment cheating count if looking left or right is detected
      if (lookingLeft || lookingRight) {
        const direction = lookingLeft ? 'left' : 'right';
        cheatingTimers.current[direction] += 1;
        cumulativeTimers.current[direction] += 1;

        if (cheatingTimers.current[direction] > 30) {
          setCheatingAlert(`Looking ${direction} for over 5 seconds!`);
          cheatingCount += 1;
          cheatingTimers.current[direction] = 0; // Reset timer
        }

        if (cumulativeTimers.current[direction] >= 1000000000000000000000) {
          setCheatingAlert("Cheating detected");
          setIsRunning(false); // Stop the timer
          setSubmitted(true); // Mark the exam as submitted
          setExamStarted(false); // End the exam
        }
      } else {
        cheatingTimers.current.left = 0;
        cheatingTimers.current.right = 0;
      }

      // Automatically submit and close the exam if cheatingCount exceeds 3
      if (cheatingCount > 3) {
        setCheatingAlert("Cheating detected! Exam is now closed.");
        setIsRunning(false);
        setSubmitted(true);
        setExamStarted(false);
      
        const payload = {
          studentId: props.loggedInUser,
          examId: 'exam123',
          score: 0, // Set score to 0 if cheating is detected
          status: 'cheating-detected',
        };
      
        try {
          await fetch('/api/exams/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          alert('Cheating detected! Your exam is closed.');
        } catch (error) {
          console.error('Error updating cheating status:', error);
        }
      }
    }  
        

    faceDetection.onResults(onResult);
    faceDetectionRef.current = faceDetection;

    if (webcamRef.current) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (examStarted) {
            await faceDetection.send({ image: webcamRef.current.video });
          }
        },
      });

      camera.start();
    }

    return () => {
      faceDetection.close();
    };
  }, [examStarted]);

  return (
    <>
      <div>
        {showWarning && (
          <div className="alert alert-danger" role="alert">
            <a href="#" className="alert-link">Warning!</a> {warningMessage}
          </div>
        )}
      </div>

      <p className='mx-3 fw-bold'>Student ID: {props.loggedInUser || 'Unknown'}</p>

      <div className='container'>
        <div className='exam_box'>
          <div className='exam_box_header'>
            <p className=''>Introduction to Artificial Intelligence (cc511) - Prof Dr Ayman Elshenawy </p>
            {!examStarted && (
              <button className='btn btn-warning' onClick={handleStart} disabled={submitted}>
                Start Exam
              </button>
            )}
            {examStarted && !submitted && (
              <button className='btn btn-warning' onClick={handleSubmit}>
                Submit
              </button>
            )}
          </div>
          <hr />

          <div className='d-flex h-100'>
            <div className='w-75 p-4'>
              {!examStarted && !submitted && (
                <p className='text-dark text-center fw-bold'>Start Your Exam.</p>
              )}
              {examStarted && !submitted && exam.length > 0 && (
                <div>
                  <p>{exam[currentQuestionIndex]?.question}</p>
                  <ul className="list-unstyled">
                    {exam[currentQuestionIndex]?.allAnswers.map((answer, index) => (
                      <li key={index}>
                        <input
                          className='mx-2'
                          type='radio'
                          name='answer'
                          value={answer}
                          onChange={() => handleAnswerSelection(index)}
                        /> {answer}
                      </li>
                    ))}
                  </ul>
                  <button className='btn btn-success' onClick={handleNext} disabled={currentQuestionIndex === exam.length - 1}>
                    Next
                  </button>
                </div>
              )}

              {submitted && (
                <div className="d-flex flex-column">
                  <p className="fw-bold">Score: {studentScore}/5</p>
                  <p>{cheatingAlert && <span className="text-danger">{cheatingAlert}</span>}</p>
                </div>
              )}
            </div>

            <div className='w-25 p-4'>
              <div className='border border-warning rounded p-2'>
                <div className='d-flex'>
                  <p className='text-dark text-center mx-auto p-3 fw-bold'>Exam Timer</p>
                </div>
                <div className='d-flex'>
                  <p className='mx-3 fw-bold text-dark'>Remaining Time:</p>
                  <span className='mx-2 fw-bold text-success'>{formatTime(timeRemaining)}</span>
                </div>
              </div>
              <div className='border border-warning rounded p-2'>
                <div className='d-flex'>
                  <p className='text-dark text-center mx-auto p-3 fw-bold'>Cheating Detection</p>
                </div>
                <Webcam
                  ref={webcamRef}
                  width="100%"
                  height="100%"
                  screenshotFormat="image/jpeg"
                />
                <p className='text-danger'>{cheatingAlert}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Exam;
