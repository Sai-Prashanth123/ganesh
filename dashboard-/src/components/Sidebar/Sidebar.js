import React, { useState } from 'react';
import './Sidebar.css';
import resume_img from './sidebar-img/resume.png';
import auto_apply_img from './sidebar-img/auto_apply.png';
import job_tracking_img from './sidebar-img/job_tracking.png';
import interview_ai_img from './sidebar-img/interview.png';
import networking_img from './sidebar-img/networking.png';
import sun from './sidebar-img/sun.png';
import moon from './sidebar-img/moon.png';
import logo from './sidebar-img/logo.png';
import { Link } from 'react-router-dom';

const Sidebar = (props) => {
  // Set initial active button to 'Resume Builder'
  const [activeButton, setActiveButton] = useState('resume');

  // Function to handle active button click
  const handleButtonClick = (buttonName) => {
     props.setIsShow(prev => !prev)
    setActiveButton(buttonName); // Update active button on click
    
  };

  // Function to apply filter to the image based on active button
  const getImageStyle = (buttonName) => {
    return activeButton === buttonName ? { filter: 'brightness(0) invert(1)' } : {};
  };

  

  return (
    <div className='sidebar' style={{left:props.isShow?'0px':'-270px'}} >
      <div className='sidebar-top'>
      <div className='logo-name'>
        <a><img src={logo} alt="Job Spring Logo" />Job Spring</a>
      </div>
        <button 
          onClick={() => handleButtonClick('resume')}
          className={activeButton === 'resume' ? 'active' : ''}
        >
          <Link to="/" >
            <img src={resume_img} className='resumeImg' alt="resume" style={getImageStyle('resume')} />
            Resume Builder
          </Link>
        </button>

        <button 
          onClick={() => handleButtonClick('interviewAi')} 
          className={activeButton === 'interviewAi' ? 'active' : ''}
        >
          <Link to="/interviewAi">
            <img src={interview_ai_img} alt="interview ai" style={getImageStyle('interviewAi')} />
            Interview AI
          </Link>
        </button>

        <button 
          onClick={() => handleButtonClick('autoApply')} 
          className={activeButton === 'autoApply' ? 'active' : ''}
        >
          <Link to="/autoApply">
            <img src={auto_apply_img} alt="auto apply" style={getImageStyle('autoApply')} />
            Auto Apply
          </Link>
        </button>

        <button 
          onClick={() => handleButtonClick('jobTracking')} 
          className={activeButton === 'jobTracking' ? 'active' : ''}
        >
          <Link to="/jobTracking">
            <img src={job_tracking_img} alt="job tracking" style={getImageStyle('jobTracking')} />
            Job Tracking
          </Link>
        </button>

        <button 
          onClick={() => handleButtonClick('networking')} 
          className={activeButton === 'networking' ? 'active' : ''}
        >
          <Link to="/networking">
            <img src={networking_img} alt="networking" style={getImageStyle('networking')} />
            Networking
          </Link>
        </button>
      </div>

      <div className='sidebar-bottom'>
        <button><img src={sun} alt="light"/> Light</button>
        <button className='dark-btn'><img src={moon} alt="dark"/> Dark</button>
      </div>
    </div>
  );
};

export default Sidebar;
