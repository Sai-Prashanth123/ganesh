import React, { useState, useEffect, useRef } from 'react'
import './Interview.css'
import logo from './interview-imgs/logo-name.png'
import clock_img from './interview-imgs/clock_img.png'
import exit_img from './interview-imgs/exit_img.png'
import cancel_img from './interview-imgs/cancel_img.png'
import interview_vid from './interview-imgs/intervie01.mp4'
import { LowLevelRTClient } from 'rt-client';
import { Link, useLocation } from 'react-router-dom'
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { API_BASE_URL } from '../config';
import { 
  DEFAULT_ENDPOINT, 
  DEFAULT_API_KEY, 
  DEFAULT_DEPLOYMENT 
} from './interviewConfig';

const Interview = () => {
  const [metrics, setMetrics] = useState({
    attention_score: 0,
    gaze_score: 0
  });
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds for testing
  const [timerActive, setTimerActive] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [audioQueue, setAudioQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const realtimeClientRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const timerRef = useRef(null);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Function to fetch metrics
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8002/metrics', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    // Update metrics every 500ms instead of 100ms to reduce load
    const intervalId = setInterval(fetchMetrics, 500);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            setShowTimeUpPopup(true); // Show popup when timer ends
            handleStartAnswering(); // Stop recording when timer ends
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Function to handle video errors
  const handleVideoError = (error) => {
    console.error('Video feed error:', error);
    setVideoError(true);
  };

  // Function to retry video connection
  const retryVideoConnection = () => {
    setVideoError(false);
  };

  
  // Audio handling functions
  const startRealtime = async () => {
    try {
        // Fetch interview instructions from backend
        const response = await fetch(`${API_BASE_URL}/api/get-interview-details`);
        if (!response.ok) {
            throw new Error("Failed to fetch interview details");
        }
        const data = await response.json();
        console.log("Fetched Interview Data:", data);  // <-- Log response

        // Extract relevant data
        const interviewInstructions = data?.data?.interview_instructions || "";
        const resumeDetails = data?.data?.resume_details || "";
        const role = data?.data?.role || "";
        const company = data?.data?.company || "";
        const description = data?.data?.description || "";

        // Initialize real-time client
        realtimeClientRef.current = new LowLevelRTClient(
            new URL(DEFAULT_ENDPOINT),
            { key: DEFAULT_API_KEY },
            { deployment: DEFAULT_DEPLOYMENT }
        );

        // Generate dynamic interview instructions
        const dynamicInstructions = `
        You are Pushpa an AI Interview Coach conducting a professional interview for the role of ${role} at ${company}. The candidate's resume details are as follows:

        ${resumeDetails}

        Job Description:
        ${description}

        Interview Guidelines:
        1. Start the interview by introducing yourself and explaining the structure.
        2. Ask screening questions to verify the candidate's qualifications.
        3. Ask technical questions based on the candidate's skills and projects.
        4. Assess soft skills and leadership qualities through HR questions.
        5. Ensure all questions are concise and relevant to the candidate's resume.
        6. Maintain a professional tone and adhere to the following strict guidelines:

        ${interviewInstructions}
        `;

        console.log("Dynamic Interview Instructions:", dynamicInstructions); // <-- Log dynamic instructions

        // Send session update with dynamic instructions
        await realtimeClientRef.current.send({
            type: "session.update",
            session: {
                turn_detection: {
                    type: "server_vad",
                    threshold: 0.8,
                    silence_duration_ms: 900,
                },
                input_audio_transcription: {
                    model: "whisper-1"
                },
                voice: "ash",
                temperature: 0.7,
                instructions: dynamicInstructions,
            }
        });

        handleRealtimeMessages();
        await setupAudio(true);
    } catch (error) {
        console.error("Error starting realtime:", error);
    }
};

  

  const handleRealtimeMessages = async () => {
    try {
      let isUserSpeech = false;  // Flag to track if the current text is from user speech
      let audioTextQueue = [];    // Queue to store text segments with their corresponding audio
      let currentSegment = "";    // Current text segment being built
      
      for await (const message of realtimeClientRef.current.messages()) {
        switch (message.type) {
          case "response.audio_transcript.delta":
            if (!isUserSpeech) {
              currentSegment += message.delta;
              // If we detect end of sentence, prepare for next segment
              if (message.delta.match(/[.!?]\s/)) {
                audioTextQueue.push(currentSegment.trim());
                currentSegment = "";
              }
            }
            // Check for questions in AI's response
            if (message.delta.includes("?")) {
              const sentences = (message.delta).split(/(?<=[.!?])\s+/);
              const question = sentences.find(s => s.includes("?"));
              if (question) {
                setCurrentQuestion(question.trim());
              }
            }
            break;
          case "conversation.item.input_audio_transcription.completed":
            isUserSpeech = true;
            break;
          case "response.audio.delta":
            const binary = atob(message.delta);
            const bytes = new Uint8Array(binary.split('').map(c => c.charCodeAt(0)));
            const pcmData = new Int16Array(bytes.buffer);
            
            // Get the next text segment from the queue
            const textToShow = audioTextQueue.length > 0 ? audioTextQueue.shift() : currentSegment;
            if (textToShow) {
              setResponseText(textToShow);
            }
            
            setAudioQueue(prev => [...prev, pcmData]);
            isUserSpeech = false;
            break;
          case "response.done":
            isUserSpeech = false;
            audioTextQueue = [];    // Clear the queue
            currentSegment = "";    // Reset current segment
            break;
          default:
            console.log(message);
        }
      }
    } catch (error) {
      console.error('Error handling messages:', error);
    }
  };

  // Add new function to handle video playback
  const handleVideoPlayback = (shouldPlay) => {
    if (videoRef.current) {
      if (shouldPlay) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0; // Reset to start
      }
    }
  };

  useEffect(() => {
    const playNextInQueue = async () => {
      if (audioQueue.length > 0 && !isPlaying) {
        setIsPlaying(true);
        handleVideoPlayback(true); // Start video when audio starts
        const nextAudio = audioQueue[0];
        setAudioQueue(prev => prev.slice(1));
        
        try {
          await playAudio(nextAudio);
        } catch (error) {
          console.error('Error playing audio:', error);
        }
        
        setIsPlaying(false);
        if (audioQueue.length === 0) {
          handleVideoPlayback(false); // Stop video when audio queue is empty
        }
      }
    };

    playNextInQueue();
  }, [audioQueue, isPlaying]);

  const setupAudio = async (startRecording) => {
    if (startRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        startAudioRecording(stream);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  };

  const startAudioRecording = (stream) => {
    const audioContext = new AudioContext({ sampleRate: 24000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const int16Data = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)));
      }
      
      if (realtimeClientRef.current) {
        realtimeClientRef.current.send({
          type: "input_audio_buffer.append",
          audio: btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)))
        });
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    audioRecorderRef.current = { context: audioContext, source, processor };
  };

  const playAudio = async (pcmData) => {
    return new Promise((resolve, reject) => {
      try {
        if (!audioPlayerRef.current) {
          const context = new AudioContext({ sampleRate: 24000 });
          audioPlayerRef.current = context;
        }

        const buffer = audioPlayerRef.current.createBuffer(1, pcmData.length, 24000);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < pcmData.length; i++) {
          channelData[i] = pcmData[i] / 32768;
        }

        const source = audioPlayerRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioPlayerRef.current.destination);
        
        // Start video and ensure it stops when audio ends
        if (videoRef.current) {
          videoRef.current.play();
          source.onended = () => {
            videoRef.current.pause();
            resolve();
          };
        } else {
          source.onended = resolve;
        }

        source.start();
      } catch (error) {
        reject(error);
      }
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartAnswering = async () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimerActive(true);
      setTimeLeft(300); // Reset timer to 30 seconds for testing
      setResponseText('');
      setAudioQueue([]);
      setIsPlaying(false);
      await startRealtime();
    } else {
      setIsRecording(false);
      setTimerActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setAudioQueue([]);
      if (realtimeClientRef.current) {
        realtimeClientRef.current.close();
      }
      if (audioRecorderRef.current) {
        try {
          audioRecorderRef.current.source.disconnect();
          audioRecorderRef.current.processor.disconnect();
          // Only close if the context is not already closed
          if (audioRecorderRef.current.context.state !== 'closed') {
            await audioRecorderRef.current.context.close();
          }
        } catch (error) {
          console.log('Audio recorder cleanup error:', error);
        }
        audioRecorderRef.current = null;
      }
      if (audioPlayerRef.current) {
        try {
          // Only close if the context is not already closed
          if (audioPlayerRef.current.state !== 'closed') {
            await audioPlayerRef.current.close();
          }
        } catch (error) {
          console.log('Audio player cleanup error:', error);
        }
        audioPlayerRef.current = null;
      }
    }
  };

  // Add function to close popup
  const handleClosePopup = () => {
    setShowTimeUpPopup(false);
  };

  // Update the calculate progress function
  const calculateProgress = (timeLeft) => {
    const totalTime = 300; // Total time in seconds (5 minutes)
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="interview-container">
      <div className='interview'>
        <div className='interview-header'>
          <div className='interview-title'>
            <img src={logo} alt="Logo"/>
          </div>
          <div className='progress-bars'>
            <div className='bar-container'>
              <div className='fill' 
                style={{ 
                  width: `${isRecording ? calculateProgress(timeLeft) : 0}%`
                }}
              />
            </div>
            <div className='labels'>
              <p className={timeLeft > 200 ? 'active' : ''}>Screening round</p>
              <p className={timeLeft <= 200 && timeLeft > 100 ? 'active' : ''}>Technical round</p>
              <p className={timeLeft <= 100 ? 'active' : ''}>Behavioral round</p>
            </div>
          </div>
          <div className='time'>
            <p>
              <span>Total interview Time :</span> 
              <img src={clock_img} alt="Clock"/> 
              <span>{formatTime(timeLeft)}</span>
            </p>
          </div>
        </div>
        <div className='interview-coach'>
          <div className='interviewer-side'>
            <div className='interviewer-top'>
              <video 
                ref={videoRef} 
                muted
                loop={false}
              >
                <source src={interview_vid} type="video/mp4"/>
              </video>
              <button 
                className={`start-button ${isRecording ? 'recording' : ''}`}
                onClick={handleStartAnswering}
              >
                {isRecording ? 'Listening' : 'Start Answering'}
              </button>
            </div>
            <div className='interviewer-bottom'>
              <p className='question'>{currentQuestion || 'Click "Start Answering" to begin the interview.'}</p>
              {responseText && (
                <div className='ai-response'>
                  <p>{responseText}</p>
                </div>
              )}
              
            </div>
          </div>
          <div className='user-side'>
            <div className='user-info'>
              <div className='user-vid'>
                {videoError ? (
                  <div className="video-error">
                    <p>Failed to load video feed</p>
                    <button onClick={retryVideoConnection}>Retry Connection</button>
                  </div>
                ) : (
                  <img 
                    key={videoError ? 'retry' : 'video'}
                    src={`${API_BASE_URL}/video-feed`} 
                    alt="User video feed" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={handleVideoError}
                  />
                )}
                <p className='user-name'>Prasanth</p>
              </div>
              <div>
                <h3>UX Designer</h3>
                <div className="metric-container">
                  <p>Eye contact level<span>{Math.round(metrics.gaze_score)}%</span></p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.round(metrics.gaze_score)}%`,
                        backgroundColor: Math.round(metrics.gaze_score) > 70 ? '#4CAF50' : Math.round(metrics.gaze_score) > 40 ? '#FFA500' : '#FF0000',
                        height: '100%'
                      }}
                    />
                  </div>
                  
                </div>
                <div className="metric-container">
                  <p>Attention score <span>{Math.round(metrics.attention_score)}%</span></p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.round(metrics.attention_score)}%`,
                        backgroundColor: Math.round(metrics.attention_score) > 70 ? '#4CAF50' : Math.round(metrics.attention_score) > 40 ? '#FFA500' : '#FF0000',
                        height: '100%'
                      }}
                    />
                  </div>
                  
                </div>
              </div>
            </div>
            <div className='userSide-btns'>
              <button><img src={exit_img} alt="Exit"/>Exit Interview</button>
              <button className='evluation-btn'>Evaluation Criteria</button>
            </div>
          </div>
        </div>
      </div>
      {showTimeUpPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <Link to='/interviewAi_updated'><img className='pop-cancel' src={cancel_img} alt="Close popup"/></Link>
            <img className='pop-logo' src={logo} alt="Job Spring Logo"/>
            
           
            <p>Thank you Prasanth .<br/>You have completed the interview</p>
            <span>Click to download the interview analysis</span>
            <Link to='/interviewAi_updated'><button onClick={handleClosePopup}>Download</button></Link>
            
          </div>
        </div>
      )}
      {showVideo && (
        <div className="video-container">
          <img 
            src={`${API_BASE_URL}/video-feed`} 
            alt="Video feed" 
            className="video-feed"
          />
        </div>
      )}
    </div>
  )
}

export default Interview
