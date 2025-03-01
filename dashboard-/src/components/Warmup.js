import React from "react";
import { useNavigate } from "react-router-dom";

function Warmup() {
  const navigate = useNavigate();

  const enterFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  };

  const handleStartInterview = () => {
    enterFullScreen(); // Enter full-screen mode first
    setTimeout(() => {
      navigate("/interview"); // Navigate after a short delay
    }, 500);
  };

  return (
    <div className="interview">
      <h2>Coming soon.....</h2>
      <button className="interview-bottom" onClick={handleStartInterview}>
        Start Interview
      </button>
    </div>
  );
}

export default Warmup;