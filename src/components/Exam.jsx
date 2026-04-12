import React, { useEffect, useState, useRef } from 'react';
import Webcam from "react-webcam";
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

import { detectCheating, extractFaceCoordinates, getCheatingStatus } from "../helpers/face-detection-helper";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";
import { useLocation } from 'react-router-dom';

const Exam = (props) => {
  const [examStarted, setExamStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [exam, setExam] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [cheatingAlert, setCheatingAlert] = useState('');
  const [studentScore, setStudentScore] = useState(0);

  const [model, setModel] = useState(null);

  const webcamRef = useRef(null);
  const faceDetectionRef = useRef(null);
  const canvasRef = useRef(null);

  const noFaceFrames = useRef(0);
  const multiFaceFrames = useRef(0);
  const FRAMES_THRESHOLD = 300; 
  const cheatingTimers = useRef({ left: 0, right: 0 });
  const cumulativeTimers = useRef({ left: 0, right: 0 });

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const teacherId = queryParams.get("teacherId");
  const courseName = queryParams.get("courseName");
  const examTitleParam = queryParams.get("examTitle") || "";

  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  // Load COCO-SSD
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
      } catch (error) {
        console.error("Error loading COCO-SSD model:", error);
      }
    };
    loadModel();
  }, []);

  const handleStart = () => {
    if (!teacherId || !courseName || !examTitleParam) {
      return;
    }
    setExamStarted(true);
    setSubmitted(false);
    setIsRunning(true);

    fetch(`http://localhost:15000/exams/by-course?teacherId=${teacherId}&courseName=${encodeURIComponent(courseName)}`)
      .then(resp => resp.json())
      .then(data => {
        if (!data.exams || data.exams.length === 0) {
          setExamStarted(false);
          return;
        }

        const selectedExam = data.exams.find(
          exam => exam.title.trim().toLowerCase() === examTitleParam.trim().toLowerCase()
        );
        if (!selectedExam) {
          setExamStarted(false);
          return;
        }

        const formattedExam = selectedExam.questions.map(q => {
          const allAnswers = shuffleArray(q.options);
          return {
            question: q.questionText,
            allAnswers,
            correct_answer: q.answer,
            score: 0
          };
        });
        setExam(formattedExam);

        if (selectedExam.timeLimit && typeof selectedExam.timeLimit === 'number') {
          setTimeRemaining(selectedExam.timeLimit * 60);
        } else {
          setTimeRemaining(300);
        }
      })
      .catch(err => console.error("Error fetching exam:", err));
  };

  const handleAnswerSelection = (index) => {
    if (exam[currentQuestionIndex].allAnswers[index] === exam[currentQuestionIndex].correct_answer) {
      setExam(prevExam => {
        const newExam = [...prevExam];
        newExam[currentQuestionIndex].score = 1;
        return newExam;
      });
    } else {
      setExam(prevExam => {
        const newExam = [...prevExam];
        newExam[currentQuestionIndex].score = 0;
        return newExam;
      });
    }
  };

  const handleSubmit = async (isCheater = false) => {
    setSubmitted(true);
    setExamStarted(false);
    setIsRunning(false);

    const totalScore = exam.reduce((sum, question) => sum + question.score, 0);
    setStudentScore(totalScore);

    const payload = {
      studentId: props.loggedInUser,
      teacherId,
      courseName,
      examTitle: examTitleParam || "UntitledExam",
      score: isCheater ? 0 : totalScore,
      status: isCheater ? "cheating-detected" : "completed"
    };

    try {
      await fetch('http://localhost:15000/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // No popup
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < exam.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  // Timer
  useEffect(() => {
    let timer;
    if (isRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      setIsRunning(false);
      setSubmitted(true);
      handleSubmit(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeRemaining]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Visibility / focus warnings
  const showWarningMessage = (message) => {
    setWarningMessage(message);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);
  };
  const handleVisibilityChange = () => {
    if (document.hidden) showWarningMessage('Tab not visible');
  };
  const handleBlur = () => showWarningMessage('Window lost focus');
  const handleFocus = () => setShowWarning(false);
  const handleResize = () => {
    if (window.innerWidth < 800) showWarningMessage('Window resized to small size');
  };

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mediapipe FaceDetection
  useEffect(() => {
    let cheatingCount = 0;
    const faceDetection = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });
    faceDetection.setOptions({
      minDetectionConfidence: 0.5,
      model: "short",
    });

    async function onResult(result) {
      if (!examStarted || submitted) return;

      if (result.detections.length < 1) {
        setCheatingAlert("Face not detected!");
        noFaceFrames.current += 1;
        if (noFaceFrames.current >= FRAMES_THRESHOLD) {
          handleSubmit(true);
        }
        return;
      } else if (result.detections.length > 1) {
        setCheatingAlert("Multiple faces detected!");
        multiFaceFrames.current += 1;
        if (multiFaceFrames.current >= FRAMES_THRESHOLD) {
          handleSubmit(true);
        }
        return;
      } else {
        setCheatingAlert("");
      }

      const faceCoordinates = extractFaceCoordinates(result);
      const [lookingLeft, lookingRight] = detectCheating(faceCoordinates);
      const cheatingStatus = getCheatingStatus(lookingLeft, lookingRight);
      setCheatingAlert(cheatingStatus);

      if (lookingLeft || lookingRight) {
        const direction = lookingLeft ? 'left' : 'right';
        cheatingTimers.current[direction] += 1;
        cumulativeTimers.current[direction] += 1;

        if (cheatingTimers.current[direction] > 30) {
          setCheatingAlert(`Looking ${direction} for over 1 second!`);
          cheatingCount += 1;
          cheatingTimers.current[direction] = 0;
        }

        if (cumulativeTimers.current[direction] >= 1000) {
          setCheatingAlert("Cheating detected");
          handleSubmit(true);
        }
      } else {
        cheatingTimers.current.left = 0;
        cheatingTimers.current.right = 0;
      }

      if (cheatingCount > 3) {
        setCheatingAlert("Cheating detected! Exam closed.");
        handleSubmit(true);
      }
    }

    faceDetection.onResults(onResult);
    faceDetectionRef.current = faceDetection;

    if (webcamRef.current) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (examStarted && !submitted) {
            await faceDetection.send({ image: webcamRef.current.video });
          }
        },
      });
      camera.start();
    }

    return () => {
      faceDetection.close();
    };
  }, [examStarted, submitted, props.loggedInUser]);

  // COCO-SSD phone detection
  useEffect(() => {
    if (!model) return;

    let animationFrameId;

    const detectMobile = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video.readyState === 4 &&
        examStarted &&
        !submitted
      ) {
        const video = webcamRef.current.video;
        if (canvasRef.current) {
          canvasRef.current.width = video.videoWidth;
          canvasRef.current.height = video.videoHeight;
        }

        const predictions = await model.detect(video);
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        let mobileDetected = false;
        const mobileClasses = ['cell phone', 'phone', 'smartphone', 'mobile phone'];

        predictions.forEach(prediction => {
          const [x, y, width, height] = prediction.bbox;
          const className = prediction.class.toLowerCase();
          const confidence = prediction.score;

          if (mobileClasses.includes(className) && confidence > 0.8) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            ctx.font = "16px Arial";
            ctx.fillStyle = "red";
            ctx.fillText(
              `${prediction.class} (${(confidence * 100).toFixed(1)}%)`,
              x,
              y > 20 ? y - 5 : y + 15
            );

            mobileDetected = true;
          }
        });

        if (mobileDetected) {
          setCheatingAlert("Mobile phone detected! You are a cheater!");
          handleSubmit(true);
          return;
        }
      }
      animationFrameId = requestAnimationFrame(detectMobile);
    };

    detectMobile();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [model, examStarted, submitted]);

  return (
    <>
      {showWarning && (
        <div className="alert alert-danger" role="alert">
          {warningMessage}
        </div>
      )}

      <p style={{ marginLeft: "15px", fontWeight: "bold" }}>
        Student ID: {props.loggedInUser || 'Unknown'} | Course: {courseName || 'Unknown'}
      </p>

      <div className='container'>
        <div style={{ margin: "20px 0" }}>
          <div>
            {!examStarted && !submitted && (
              <button 
                className='btn btn-primary' 
                onClick={handleStart}
                disabled={submitted}
              >
                Start Exam
              </button>
            )}
            {examStarted && !submitted && (
              <button 
                className='btn btn-primary'
                onClick={() => handleSubmit(false)}
                style={{ marginLeft: "10px" }}
              >
                Submit
              </button>
            )}
          </div>
          <hr />
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: "1" }}>
            {!examStarted && !submitted && (
              <p style={{ textAlign: "center", fontWeight: "bold" }}>
                Click "Start Exam" to begin.
              </p>
            )}
            {examStarted && !submitted && exam.length > 0 && (
              <div>
                <p style={{ fontWeight: "bold" }}>
                  {exam[currentQuestionIndex]?.question}
                </p>
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {exam[currentQuestionIndex]?.allAnswers.map((answer, index) => (
                    <li key={index} style={{ marginBottom: "8px" }}>
                      <label>
                        <input
                          style={{ marginRight: "5px" }}
                          type='radio'
                          name='answer'
                          onChange={() => handleAnswerSelection(index)}
                        />
                        {answer}
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  className='btn btn-primary'
                  onClick={handleNext}
                  disabled={currentQuestionIndex === exam.length - 1}
                >
                  Next
                </button>
              </div>
            )}
            {submitted && (
              <div style={{ marginTop: "20px" }}>
                <p style={{ fontWeight: "bold" }}>
                  Score: {studentScore}/{exam.length}
                </p>
                {cheatingAlert && (
                  <span style={{ color: "red" }}>{cheatingAlert}</span>
                )}
              </div>
            )}
          </div>

          <div style={{ width: "300px", flexShrink: 0 }}>
            <div className='border border-primary rounded p-2 mb-3'>
              <h5 style={{ textAlign: "center" }}>Exam Timer</h5>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={{ fontWeight: "bold", marginRight: "5px" }}>
                  Time Left:
                </span>
                <span style={{ fontWeight: "bold", color: "#28a745" }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            <div
              className='border border-primary rounded p-2'
              style={{ position: 'relative', height: '300px' }}
            >
              <h5 style={{ textAlign: "center" }}>Cheating Detection</h5>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Webcam
                  ref={webcamRef}
                  width="100%"
                  height="100%"
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
              <p style={{ color: "red", textAlign: "center", marginTop: "5px" }}>
                {cheatingAlert}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Exam;
